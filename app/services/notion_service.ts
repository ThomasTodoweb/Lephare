import env from '#start/env'
import app from '@adonisjs/core/services/app'
import { createWriteStream } from 'node:fs'
import { mkdir, access, unlink } from 'node:fs/promises'
import { pipeline } from 'node:stream/promises'
import { Readable } from 'node:stream'
import { randomUUID } from 'node:crypto'
import path from 'node:path'

interface NotionFile {
  name: string
  type: 'file' | 'external'
  file?: {
    url: string
    expiry_time: string
  }
  external?: {
    url: string
  }
}

interface NotionPage {
  id: string
  properties: {
    Nom: {
      title: Array<{ plain_text: string }>
    }
    'Fichiers et médias': {
      files: NotionFile[]
    }
    Sélection: {
      select: { name: string } | null
    }
    Clients: {
      relation: Array<{ id: string }>
    }
    'Ma Date': {
      date: { start: string } | null
    }
    'Date de création': {
      created_time: string
    }
  }
}

interface NotionQueryResponse {
  results: NotionPage[]
  has_more: boolean
  next_cursor: string | null
}

export interface ImportedIdea {
  notionPageId: string
  title: string
  aiGeneratedTitle?: string
  type: 'post' | 'story' | 'reel' | 'carousel'
  mediaUrls: string[] // Original Notion URLs (temporary)
  mediaPaths: string[] // Local saved paths
  mediaTypes: string[] // 'image' or 'video' for each media
  clientNotionId?: string
  clientName?: string
  publicationDate?: string
  createdAt: string
}

export default class NotionService {
  private apiKey: string | undefined
  private databaseId: string
  private uploadDir: string

  constructor() {
    this.apiKey = env.get('NOTION_API_KEY')
    this.databaseId = '177e847890628070bed7da9d2d4dba2d'
    this.uploadDir = app.makePath('storage/uploads/notion')
  }

  isConfigured(): boolean {
    return !!this.apiKey
  }

  /**
   * Ensure upload directory exists
   */
  private async ensureUploadDir(): Promise<void> {
    try {
      await access(this.uploadDir)
    } catch {
      await mkdir(this.uploadDir, { recursive: true })
    }
  }

  /**
   * Fetch all pages from the Notion database
   */
  async fetchAllPages(): Promise<NotionPage[]> {
    if (!this.apiKey) {
      throw new Error('Notion API key not configured')
    }

    const allPages: NotionPage[] = []
    let hasMore = true
    let cursor: string | null = null

    while (hasMore) {
      const body: { page_size: number; start_cursor?: string } = { page_size: 100 }
      if (cursor) {
        body.start_cursor = cursor
      }

      const response = await fetch(
        `https://api.notion.com/v1/databases/${this.databaseId}/query`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      )

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Notion API error: ${error}`)
      }

      const data = (await response.json()) as NotionQueryResponse
      allPages.push(...data.results)
      hasMore = data.has_more
      cursor = data.next_cursor
    }

    return allPages
  }

  /**
   * Get client name from relation ID
   */
  async getClientName(clientId: string): Promise<string | null> {
    if (!this.apiKey) return null

    try {
      const response = await fetch(`https://api.notion.com/v1/pages/${clientId}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Notion-Version': '2022-06-28',
        },
      })

      if (!response.ok) return null

      const data = (await response.json()) as {
        properties?: {
          Name?: { title?: Array<{ plain_text: string }> }
          Nom?: { title?: Array<{ plain_text: string }> }
        }
      }

      const name =
        data.properties?.Name?.title?.[0]?.plain_text ||
        data.properties?.Nom?.title?.[0]?.plain_text
      return name || null
    } catch {
      return null
    }
  }

  /**
   * Get all unique client IDs and fetch their names
   */
  async fetchClients(pages: NotionPage[]): Promise<Map<string, string>> {
    const clientIds = new Set<string>()
    for (const page of pages) {
      const clientId = page.properties.Clients?.relation?.[0]?.id
      if (clientId) {
        clientIds.add(clientId)
      }
    }

    const clientMap = new Map<string, string>()
    for (const clientId of clientIds) {
      const name = await this.getClientName(clientId)
      if (name) {
        clientMap.set(clientId, name)
      }
    }

    return clientMap
  }

  /**
   * Determine content type from Notion selection and media count
   */
  private determineContentType(
    selectionName: string | null,
    mediaCount: number
  ): 'post' | 'story' | 'reel' | 'carousel' {
    if (mediaCount > 1) {
      return 'carousel'
    }

    switch (selectionName?.toLowerCase()) {
      case 'réel':
      case 'reel':
        return 'reel'
      case 'story':
        return 'story'
      case 'post':
      default:
        return 'post'
    }
  }

  /**
   * Get media type from filename
   */
  private getMediaType(filename: string): 'image' | 'video' {
    const videoExtensions = ['.mp4', '.mov', '.avi', '.webm', '.m4v', '.mkv']
    const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'))
    return videoExtensions.includes(ext) ? 'video' : 'image'
  }

  /**
   * Get file extension from filename or content-type
   */
  private getExtension(filename: string, contentType?: string): string {
    const dotIndex = filename.lastIndexOf('.')
    if (dotIndex !== -1) {
      return filename.slice(dotIndex).toLowerCase()
    }

    if (contentType) {
      const typeMap: Record<string, string> = {
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'image/webp': '.webp',
        'video/mp4': '.mp4',
        'video/quicktime': '.mov',
        'video/webm': '.webm',
      }
      return typeMap[contentType] || '.bin'
    }

    return '.bin'
  }

  /**
   * Download and save a media file locally
   */
  async downloadAndSaveMedia(
    url: string,
    originalFilename: string,
    notionPageId: string
  ): Promise<{ localPath: string; relativePath: string } | null> {
    try {
      await this.ensureUploadDir()

      const response = await fetch(url)
      if (!response.ok) {
        console.error(`NotionService: Failed to download ${url}: ${response.status}`)
        return null
      }

      const contentType = response.headers.get('content-type') || undefined
      const extension = this.getExtension(originalFilename, contentType)
      const filename = `${notionPageId.replace(/-/g, '')}_${randomUUID()}${extension}`
      const localPath = path.join(this.uploadDir, filename)
      const relativePath = `/uploads/notion/${filename}`

      const body = response.body
      if (!body) {
        console.error('NotionService: No response body')
        return null
      }

      const writeStream = createWriteStream(localPath)
      // @ts-ignore - Node.js types issue with ReadableStream
      await pipeline(Readable.fromWeb(body), writeStream)

      console.log(`NotionService: Saved ${originalFilename} -> ${relativePath}`)
      return { localPath, relativePath }
    } catch (error) {
      console.error(`NotionService: Error downloading ${url}:`, error)
      return null
    }
  }

  /**
   * Download media and convert to base64 for AI analysis
   */
  private async downloadMediaAsBase64(
    url: string
  ): Promise<{ base64: string; mimeType: string } | null> {
    try {
      const response = await fetch(url)
      if (!response.ok) return null

      const buffer = await response.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      const contentType = response.headers.get('content-type') || 'image/jpeg'

      return { base64, mimeType: contentType }
    } catch (error) {
      console.error('NotionService: Failed to download media for AI', error)
      return null
    }
  }

  /**
   * Generate title using AI vision for image analysis
   */
  async generateTitleFromMedia(
    mediaUrls: string[],
    mediaTypes: string[],
    existingTitle: string
  ): Promise<string | null> {
    const anthropicKey = env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return null
    }

    const imagesToAnalyze: Array<{ base64: string; mimeType: string }> = []

    for (let i = 0; i < Math.min(mediaUrls.length, 3); i++) {
      const url = mediaUrls[i]
      const type = mediaTypes[i]

      if (type === 'image') {
        const media = await this.downloadMediaAsBase64(url)
        if (media) {
          imagesToAnalyze.push(media)
        }
      }
    }

    if (imagesToAnalyze.length === 0) {
      return null
    }

    const systemPrompt = `Tu es un expert en contenu Instagram pour restaurants. Tu dois analyser des images et générer un titre court et descriptif.

RÈGLES :
- Titre de 3-8 mots maximum
- Décris le contenu principal (plat, ambiance, équipe, etc.)
- Pas d'emoji
- Pas de ponctuation à la fin
- Ton descriptif et neutre

EXEMPLES :
- "Burger signature avec frites maison"
- "L'équipe en cuisine"
- "Dessert au chocolat et fruits rouges"
- "Terrasse ensoleillée avec clients"
- "Cocktail coloré au bar"

Réponds UNIQUEMENT avec le titre, rien d'autre.`

    const userPrompt = `Génère un titre court pour ce contenu Instagram de restaurant. Titre actuel : "${existingTitle}"`

    try {
      const content: Array<
        | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
        | { type: 'text'; text: string }
      > = []

      for (const img of imagesToAnalyze) {
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: img.mimeType,
            data: img.base64,
          },
        })
      }
      content.push({ type: 'text', text: userPrompt })

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-latest',
          max_tokens: 50,
          system: systemPrompt,
          messages: [{ role: 'user', content }],
        }),
      })

      if (response.ok) {
        const data = (await response.json()) as { content?: { text?: string }[] }
        return data.content?.[0]?.text?.trim() || null
      }
    } catch (error) {
      console.error('NotionService: AI title generation failed', error)
    }

    return null
  }

  /**
   * Import ideas from Notion with media download
   */
  async importIdeas(options: {
    generateAiTitles?: boolean
    limit?: number
    downloadMedia?: boolean
    onProgress?: (current: number, total: number, message: string) => void
  } = {}): Promise<ImportedIdea[]> {
    const {
      generateAiTitles = false,
      limit,
      downloadMedia = true,
      onProgress,
    } = options

    const progress = (current: number, total: number, message: string) => {
      console.log(`NotionService: [${current}/${total}] ${message}`)
      onProgress?.(current, total, message)
    }

    progress(0, 0, 'Fetching pages from Notion...')
    let pages = await this.fetchAllPages()
    progress(0, pages.length, `Found ${pages.length} pages`)

    // Sort pages by creation date (most recent first) BEFORE processing
    pages.sort((a, b) => {
      const dateA = new Date(a.properties['Date de création']?.created_time || 0).getTime()
      const dateB = new Date(b.properties['Date de création']?.created_time || 0).getTime()
      return dateB - dateA
    })

    // Filter pages with media only
    const pagesWithMedia = pages.filter(
      (page) => (page.properties['Fichiers et médias']?.files || []).length > 0
    )
    progress(0, pagesWithMedia.length, `${pagesWithMedia.length} pages with media`)

    // Get client IDs from limited pages only
    const clientIds = new Set<string>()
    const pagesToProcess = limit && limit > 0 ? pagesWithMedia.slice(0, limit * 2) : pagesWithMedia
    for (const page of pagesToProcess) {
      const clientId = page.properties.Clients?.relation?.[0]?.id
      if (clientId) clientIds.add(clientId)
    }

    progress(0, pagesToProcess.length, 'Fetching client names...')
    const clientMap = new Map<string, string>()
    for (const clientId of clientIds) {
      const name = await this.getClientName(clientId)
      if (name) clientMap.set(clientId, name)
    }
    progress(0, pagesToProcess.length, `Found ${clientMap.size} clients`)

    // First pass: collect metadata WITHOUT downloading media
    interface PageMetadata {
      page: NotionPage
      title: string
      contentType: 'post' | 'story' | 'reel' | 'carousel'
      clientNotionId?: string
      clientName?: string
      publicationDate?: string
      createdAt: string
      files: NotionFile[]
    }

    const metadata: PageMetadata[] = []
    for (const page of pagesToProcess) {
      const files = page.properties['Fichiers et médias']?.files || []
      if (files.length === 0) continue

      const title = page.properties.Nom?.title?.[0]?.plain_text || 'Sans titre'
      const selectionName = page.properties.Sélection?.select?.name || null
      const clientId = page.properties.Clients?.relation?.[0]?.id
      const clientName = clientId ? clientMap.get(clientId) : undefined
      const publicationDate = page.properties['Ma Date']?.date?.start
      const createdAt = page.properties['Date de création']?.created_time

      metadata.push({
        page,
        title,
        contentType: this.determineContentType(selectionName, files.length),
        clientNotionId: clientId,
        clientName,
        publicationDate,
        createdAt,
        files,
      })
    }

    // Distribute across clients BEFORE downloading
    const distributeMetadata = (items: PageMetadata[]): PageMetadata[] => {
      const byClient = new Map<string, PageMetadata[]>()
      for (const item of items) {
        const key = item.clientNotionId || 'unknown'
        if (!byClient.has(key)) byClient.set(key, [])
        byClient.get(key)!.push(item)
      }

      const distributed: PageMetadata[] = []
      const iterators = Array.from(byClient.values()).map((arr) => ({ arr, idx: 0 }))

      while (distributed.length < items.length) {
        for (const iter of iterators) {
          if (iter.idx < iter.arr.length) {
            distributed.push(iter.arr[iter.idx])
            iter.idx++
          }
        }
      }
      return distributed
    }

    let selectedMetadata = distributeMetadata(metadata)

    // Apply limit BEFORE downloading media
    if (limit && limit > 0) {
      selectedMetadata = selectedMetadata.slice(0, limit)
    }

    const totalToProcess = selectedMetadata.length
    progress(0, totalToProcess, `Processing ${totalToProcess} ideas...`)

    // Now download media only for selected pages
    const ideas: ImportedIdea[] = []
    let processed = 0

    for (const meta of selectedMetadata) {
      const mediaUrls: string[] = []
      const mediaPaths: string[] = []
      const mediaTypes: string[] = []

      for (const file of meta.files) {
        const url = file.file?.url || file.external?.url
        if (url) {
          mediaUrls.push(url)
          mediaTypes.push(this.getMediaType(file.name))

          if (downloadMedia) {
            const saved = await this.downloadAndSaveMedia(url, file.name, meta.page.id)
            if (saved) {
              mediaPaths.push(saved.relativePath)
            }
          }
        }
      }

      if (downloadMedia && mediaPaths.length === 0) {
        console.log(`NotionService: Skipping ${meta.page.id} - no media downloaded`)
        continue
      }

      ideas.push({
        notionPageId: meta.page.id,
        title: meta.title,
        type: meta.contentType,
        mediaUrls,
        mediaPaths: downloadMedia ? mediaPaths : [],
        mediaTypes,
        clientNotionId: meta.clientNotionId,
        clientName: meta.clientName,
        publicationDate: meta.publicationDate,
        createdAt: meta.createdAt,
      })

      processed++
      progress(processed, totalToProcess, `Processed ${processed}/${totalToProcess} ideas`)
    }

    if (generateAiTitles) {
      progress(0, ideas.length, 'Generating AI titles...')
      let aiProcessed = 0
      for (const idea of ideas) {
        const aiTitle = await this.generateTitleFromMedia(
          idea.mediaUrls,
          idea.mediaTypes,
          idea.title
        )
        if (aiTitle) {
          idea.aiGeneratedTitle = aiTitle
        }
        aiProcessed++
        if (aiProcessed % 5 === 0) {
          progress(aiProcessed, ideas.length, `AI titles: ${aiProcessed}/${ideas.length}`)
        }
      }
    }

    progress(ideas.length, ideas.length, 'Import complete')
    return ideas
  }

  /**
   * Delete a locally saved media file
   */
  async deleteLocalMedia(relativePath: string): Promise<boolean> {
    try {
      const fullPath = path.join(app.makePath('storage'), relativePath)
      await unlink(fullPath)
      return true
    } catch {
      return false
    }
  }
}
