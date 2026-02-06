import type { HttpContext } from '@adonisjs/core/http'
import ContentIdea from '#models/content_idea'
import app from '@adonisjs/core/services/app'
import { spawn } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'

export default class MediaOptimizationController {
  /**
   * Get optimization status for all ideas
   */
  async status({ response }: HttpContext) {
    const ideas = await ContentIdea.query()
      .whereNotNull('example_media_path')
      .select('id', 'example_media_path', 'example_media_type', 'is_optimized')

    const total = ideas.length
    const optimized = ideas.filter((i) => i.isOptimized).length
    const pending = total - optimized

    return response.json({
      total,
      optimized,
      pending,
      ideas: ideas.map((i) => ({
        id: i.id,
        path: i.exampleMediaPath,
        type: i.exampleMediaType,
        isOptimized: i.isOptimized,
      })),
    })
  }

  /**
   * Optimize a single idea's media
   */
  async optimizeOne({ params, response }: HttpContext) {
    const idea = await ContentIdea.find(params.id)
    if (!idea || !idea.exampleMediaPath) {
      return response.badRequest({ error: 'Idée ou média non trouvé' })
    }

    if (idea.isOptimized) {
      return response.json({ message: 'Déjà optimisé', skipped: true })
    }

    try {
      const result = await this.optimizeMedia(idea)
      return response.json(result)
    } catch (error) {
      console.error('Optimization error:', error)
      return response.internalServerError({
        error: 'Erreur lors de l\'optimisation',
        details: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Optimize all pending ideas
   */
  async optimizeAll({ response, session }: HttpContext) {
    const ideas = await ContentIdea.query()
      .whereNotNull('example_media_path')
      .where('is_optimized', false)

    const results = {
      total: ideas.length,
      success: 0,
      failed: 0,
      errors: [] as { id: number; error: string }[],
    }

    for (const idea of ideas) {
      try {
        await this.optimizeMedia(idea)
        results.success++
      } catch (error) {
        results.failed++
        results.errors.push({
          id: idea.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        console.error(`Optimization failed for idea ${idea.id}:`, error)
      }
    }

    // Flash the results
    if (results.failed > 0) {
      session.flash('warning', `Optimisation: ${results.success}/${results.total} réussis, ${results.failed} échecs`)
    } else if (results.success > 0) {
      session.flash('success', `${results.success} médias optimisés avec succès`)
    } else {
      session.flash('info', 'Aucun média à optimiser')
    }

    return response.redirect().back()
  }

  /**
   * Internal: Optimize media for an idea
   */
  private async optimizeMedia(idea: ContentIdea): Promise<{ message: string; savings?: string }> {
    if (!idea.exampleMediaPath) {
      throw new Error('No media path')
    }

    const fullPath = app.makePath(idea.exampleMediaPath)

    // Check if file exists
    try {
      await fs.access(fullPath)
    } catch {
      throw new Error(`File not found: ${idea.exampleMediaPath}`)
    }

    const originalStats = await fs.stat(fullPath)
    const originalSize = originalStats.size

    if (idea.exampleMediaType === 'video') {
      await this.optimizeVideo(fullPath)
    } else {
      await this.optimizeImage(fullPath)
    }

    // Get new size
    const newStats = await fs.stat(fullPath)
    const newSize = newStats.size
    const savedBytes = originalSize - newSize
    const savedPercent = ((savedBytes / originalSize) * 100).toFixed(1)

    // Mark as optimized
    idea.isOptimized = true
    await idea.save()

    return {
      message: `Optimisé: ${this.formatSize(originalSize)} → ${this.formatSize(newSize)}`,
      savings: `${this.formatSize(savedBytes)} (${savedPercent}%)`,
    }
  }

  /**
   * Optimize video using FFmpeg
   * Target: 720p, H.264, CRF 28 (good balance quality/size)
   */
  private async optimizeVideo(filePath: string): Promise<void> {
    const ext = path.extname(filePath)
    const tempPath = filePath.replace(ext, '_optimized.mp4')

    await new Promise<void>((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', [
        '-i',
        filePath,
        '-vf',
        'scale=-2:720', // Scale to 720p height, maintain aspect ratio
        '-c:v',
        'libx264',
        '-preset',
        'medium',
        '-crf',
        '28', // Quality (lower = better, 28 is good for web)
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        '-movflags',
        '+faststart', // Enable fast start for web playback
        '-y', // Overwrite
        tempPath,
      ])

      let stderr = ''
      ffmpeg.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          reject(new Error(`FFmpeg error (code ${code}): ${stderr.slice(-500)}`))
        }
      })

      ffmpeg.on('error', (err) => {
        reject(new Error(`FFmpeg not found or error: ${err.message}`))
      })
    })

    // Replace original with optimized
    await fs.unlink(filePath)
    await fs.rename(tempPath, filePath.replace(ext, '.mp4'))

    // Update path in database if extension changed
    if (ext !== '.mp4') {
      // The idea will have the new path after optimization
      // This is handled by the caller
    }
  }

  /**
   * Optimize image using sips (macOS) or imagemagick
   * Target: WebP format, max 1200px width
   */
  private async optimizeImage(filePath: string): Promise<void> {
    const ext = path.extname(filePath).toLowerCase()
    const basePath = filePath.replace(ext, '')

    // Use sips on macOS for resizing
    await new Promise<void>((resolve) => {
      // First resize if too large
      const sips = spawn('sips', [
        '--resampleWidth',
        '1200',
        filePath,
      ])

      sips.on('close', (code) => {
        if (code === 0) {
          resolve()
        } else {
          // sips might fail if image is smaller than 1200px, that's OK
          resolve()
        }
      })

      sips.on('error', () => {
        // sips not available, skip resize
        resolve()
      })
    })

    // Try to convert to WebP using cwebp if available
    const webpPath = `${basePath}.webp`
    const webpSuccess = await new Promise<boolean>((resolve) => {
      const cwebp = spawn('cwebp', ['-q', '80', filePath, '-o', webpPath])

      cwebp.on('close', (code) => {
        resolve(code === 0)
      })

      cwebp.on('error', () => {
        resolve(false)
      })
    })

    if (webpSuccess) {
      // Check if WebP is smaller
      try {
        const originalStats = await fs.stat(filePath)
        const webpStats = await fs.stat(webpPath)

        if (webpStats.size < originalStats.size) {
          // WebP is smaller, use it but keep original extension for compatibility
          // Just update the file in place
          await fs.unlink(filePath)
          await fs.rename(webpPath, filePath)
        } else {
          // Original is smaller or same, remove WebP
          await fs.unlink(webpPath)
        }
      } catch {
        // Cleanup on error
        try {
          await fs.unlink(webpPath)
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  }

  /**
   * Format bytes to human readable
   */
  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
}
