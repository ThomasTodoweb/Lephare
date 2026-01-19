import env from '#start/env'

interface DescriptionContext {
  missionTitle: string
  missionType: string
  contentIdea: string
  restaurantName?: string
  restaurantType?: string
  restaurantCity?: string
  imageBase64?: string // Base64 encoded image for vision
  imageMimeType?: string // e.g., 'image/jpeg'
}

type AIProvider = 'claude' | 'openai'

export default class AIService {
  private openaiApiKey: string | undefined
  private claudeApiKey: string | undefined
  private provider: AIProvider

  constructor() {
    this.claudeApiKey = env.get('ANTHROPIC_API_KEY')
    this.openaiApiKey = env.get('OPENAI_API_KEY')
    // Prefer Claude, fallback to OpenAI
    this.provider = this.claudeApiKey ? 'claude' : 'openai'
  }

  /**
   * Check if the AI service is configured
   */
  isConfigured(): boolean {
    return !!(this.claudeApiKey || this.openaiApiKey)
  }

  /**
   * Make a chat completion request to the configured AI provider
   */
  private async chatCompletion(
    systemPrompt: string,
    userPrompt: string,
    maxTokens: number = 300
  ): Promise<string | null> {
    if (this.provider === 'claude' && this.claudeApiKey) {
      return this.claudeCompletion(systemPrompt, userPrompt, maxTokens)
    } else if (this.openaiApiKey) {
      return this.openaiCompletion(systemPrompt, userPrompt, maxTokens)
    }
    return null
  }

  /**
   * Claude completion
   */
  private async claudeCompletion(
    systemPrompt: string,
    userPrompt: string,
    maxTokens: number
  ): Promise<string | null> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey!,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-latest',
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [{ role: 'user', content: userPrompt }],
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('AIService: Claude API error', error)
        // Try OpenAI as fallback if Claude fails
        if (this.openaiApiKey) {
          console.log('AIService: Falling back to OpenAI')
          return this.openaiCompletion(systemPrompt, userPrompt, maxTokens)
        }
        return null
      }

      const data = (await response.json()) as { content?: { text?: string }[] }
      return data.content?.[0]?.text?.trim() || null
    } catch (error) {
      console.error('AIService: Claude request failed', error)
      // Try OpenAI as fallback
      if (this.openaiApiKey) {
        return this.openaiCompletion(systemPrompt, userPrompt, maxTokens)
      }
      return null
    }
  }

  /**
   * OpenAI completion
   */
  private async openaiCompletion(
    systemPrompt: string,
    userPrompt: string,
    maxTokens: number
  ): Promise<string | null> {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.openaiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: maxTokens,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('AIService: OpenAI API error', error)
        return null
      }

      const data = (await response.json()) as { choices?: { message?: { content?: string } }[] }
      return data.choices?.[0]?.message?.content?.trim() || null
    } catch (error) {
      console.error('AIService: OpenAI request failed', error)
      return null
    }
  }

  /**
   * Claude vision completion - analyze image and generate text
   */
  private async claudeVisionCompletion(
    systemPrompt: string,
    userPrompt: string,
    imageBase64: string,
    imageMimeType: string,
    maxTokens: number
  ): Promise<string | null> {
    if (!this.claudeApiKey) return null

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.claudeApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-haiku-latest',
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: imageMimeType,
                    data: imageBase64,
                  },
                },
                {
                  type: 'text',
                  text: userPrompt,
                },
              ],
            },
          ],
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('AIService: Claude Vision API error', error)
        return null
      }

      const data = (await response.json()) as { content?: { text?: string }[] }
      return data.content?.[0]?.text?.trim() || null
    } catch (error) {
      console.error('AIService: Claude Vision request failed', error)
      return null
    }
  }

  /**
   * Generate a description for an Instagram post
   * If an image is provided, Claude will analyze it for better context
   */
  async generateDescription(context: DescriptionContext): Promise<string | null> {
    if (!this.isConfigured()) {
      console.log('AIService: No AI API key configured')
      return null
    }

    const systemPrompt = `Tu es un expert en marketing digital pour restaurants français. Tu écris des descriptions Instagram COURTES, PERCUTANTES et AUTHENTIQUES.

RÈGLES STRICTES:
- Maximum 2-3 phrases courtes et impactantes
- Ton décontracté, comme si tu parlais à un ami
- EXACTEMENT 3 hashtags à la fin (pas plus, pas moins)
- Un hashtag DOIT contenir le nom de la ville (ex: #Lyon, #Bordeaux, #ParisFood)
- 1-2 emojis maximum, bien placés
- Pas de phrases commerciales ou trop vendeuses
- Si tu vois l'image, décris ce que tu vois de manière appétissante
- Encourage l'interaction de façon naturelle (question simple ou invitation)`

    const userPrompt = this.buildPrompt(context)

    // Use vision if image is provided
    if (context.imageBase64 && context.imageMimeType && this.claudeApiKey) {
      console.log('AIService: Using Claude Vision for image analysis')
      const result = await this.claudeVisionCompletion(
        systemPrompt,
        userPrompt,
        context.imageBase64,
        context.imageMimeType,
        200
      )
      if (result) return result
      // Fallback to text-only if vision fails
      console.log('AIService: Vision failed, falling back to text-only')
    }

    return this.chatCompletion(systemPrompt, userPrompt, 200)
  }

  /**
   * Build the prompt based on context
   */
  private buildPrompt(context: DescriptionContext): string {
    let prompt = `Écris une description Instagram pour ce post.

CONTEXTE DU RESTAURANT:`

    if (context.restaurantName) {
      prompt += `\n- Nom: ${context.restaurantName}`
    }

    if (context.restaurantType) {
      prompt += `\n- Type: ${context.restaurantType}`
    }

    if (context.restaurantCity) {
      prompt += `\n- Ville: ${context.restaurantCity}`
    }

    prompt += `

MISSION:
- Titre: ${context.missionTitle}
- Type de contenu: ${context.missionType}
- Idée: ${context.contentIdea}`

    if (context.imageBase64) {
      prompt += `\n\nAnalyse l'image ci-jointe et décris ce que tu vois pour créer une description authentique et appétissante.`
    }

    return prompt
  }

  /**
   * Generate a stats interpretation with sentiment
   * Returns a short analysis phrase and sentiment (positive/neutral/negative)
   */
  async generateStatsInterpretation(stats: {
    missionsCompleted: number
    totalTutorials: number
    totalPublications: number
    currentStreak: number
    weeklyChange: number
    weeklyChangePercent: number
    // Instagram metrics (optional)
    instagramFollowers?: number
    instagramFollowersGrowth?: number
    instagramImpressions?: number
    instagramReach?: number
    instagramEngagementRate?: number
  }): Promise<{ text: string; sentiment: 'positive' | 'neutral' | 'negative' } | null> {
    if (!this.isConfigured()) {
      return null
    }

    // Build Instagram stats section if available
    let instagramSection = ''
    if (stats.instagramFollowers !== undefined) {
      // Safely format engagement rate
      const engagementRateStr =
        typeof stats.instagramEngagementRate === 'number'
          ? stats.instagramEngagementRate.toFixed(2) + '%'
          : 'N/A'

      instagramSection = `

Statistiques Instagram:
- Abonnés: ${stats.instagramFollowers}
- Croissance abonnés: ${stats.instagramFollowersGrowth !== undefined ? (stats.instagramFollowersGrowth >= 0 ? '+' : '') + stats.instagramFollowersGrowth : 'N/A'}
- Impressions: ${stats.instagramImpressions ?? 'N/A'}
- Portée: ${stats.instagramReach ?? 'N/A'}
- Taux d'engagement: ${engagementRateStr}`
    }

    const systemPrompt = `Tu es un coach bienveillant pour restaurateurs qui utilisent l'app Le Phare. Tu analyses leurs statistiques (app + Instagram si disponible) et donnes un feedback court et encourageant.

Règles:
- UNE SEULE phrase maximum (15-25 mots)
- Ton positif et motivant, même si les stats sont moyennes
- Personnalisé selon les données
- Si c'est un nouvel utilisateur (0 missions, 0 tutoriels), souhaite-lui la bienvenue et commente ses stats Instagram s'il en a
- Si les données Instagram sont disponibles, mentionne-les (abonnés, impressions, engagement)
- Pas d'emoji
- Tutoiement

Tu dois TOUJOURS répondre au format JSON suivant:
{"text": "ta phrase ici", "sentiment": "positive|neutral|negative"}

Critères sentiment:
- positive: progression, bons résultats, streak actif, croissance followers, bon engagement, bienvenue chaleureuse
- neutral: résultats moyens, stable, début de parcours
- negative: baisse significative, inactivité prolongée, perte de followers`

    const userPrompt = `Analyse ces stats et génère une phrase personnalisée:

Statistiques Le Phare:
- Missions complétées (total): ${stats.missionsCompleted}
- Tutoriels vus: ${stats.totalTutorials}
- Publications: ${stats.totalPublications}
- Streak actuel: ${stats.currentStreak} jours
- Évolution semaine: ${stats.weeklyChange >= 0 ? '+' : ''}${stats.weeklyChange} missions (${stats.weeklyChangePercent}%)
- Nouvel utilisateur: ${stats.missionsCompleted === 0 && stats.totalTutorials === 0 ? 'Oui' : 'Non'}${instagramSection}`

    const content = await this.chatCompletion(systemPrompt, userPrompt, 100)

    if (!content) return null

    try {
      const parsed = JSON.parse(content) as { text: string; sentiment: string }
      const sentiment = ['positive', 'neutral', 'negative'].includes(parsed.sentiment)
        ? (parsed.sentiment as 'positive' | 'neutral' | 'negative')
        : 'neutral'
      return { text: parsed.text, sentiment }
    } catch {
      // If JSON parsing fails, return the text as neutral
      return { text: content, sentiment: 'neutral' }
    }
  }

  /**
   * Generate a weekly report summary
   */
  async generateWeeklyReport(stats: {
    missionsCompleted: number
    missionsMissed: number
    tutorialsWatched: number
    currentStreak: number
    strategy: string
  }): Promise<string | null> {
    if (!this.isConfigured()) {
      return null
    }

    const systemPrompt = `Tu es un coach en communication digitale pour restaurateurs. Tu fais des bilans hebdomadaires encourageants et constructifs. Ton ton est bienveillant et motivant, comme un mentor. Maximum 100 mots.`

    const userPrompt = `Fais un bilan de la semaine pour ce restaurateur:

- Missions complétées: ${stats.missionsCompleted}
- Missions manquées: ${stats.missionsMissed}
- Tutoriels vus: ${stats.tutorialsWatched}
- Streak actuel: ${stats.currentStreak} jours
- Objectif: ${stats.strategy}

Donne un feedback personnalisé et 1-2 conseils pour la semaine suivante.`

    return this.chatCompletion(systemPrompt, userPrompt, 200)
  }
}
