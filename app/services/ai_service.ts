import env from '#start/env'

interface DescriptionContext {
  missionTitle: string
  missionType: string
  contentIdea: string
  restaurantName?: string
  restaurantType?: string
}

export default class AIService {
  private apiKey: string | undefined
  private baseUrl = 'https://api.openai.com/v1'

  constructor() {
    this.apiKey = env.get('OPENAI_API_KEY')
  }

  /**
   * Check if the AI service is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey
  }

  /**
   * Generate a description for an Instagram post
   */
  async generateDescription(context: DescriptionContext): Promise<string | null> {
    if (!this.isConfigured()) {
      console.log('AIService: OpenAI API key not configured')
      return null
    }

    const prompt = this.buildPrompt(context)

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Tu es un expert en marketing digital pour restaurants. Tu écris des descriptions Instagram engageantes, authentiques et adaptées au ton français décontracté.

Règles importantes:
- Maximum 150 mots
- Ton chaleureux et professionnel
- Inclure 3-5 hashtags pertinents à la fin
- Pas de phrases trop commerciales
- Encourager l'interaction (questions, call-to-action subtils)
- Utiliser des emojis avec parcimonie (2-3 max)`,
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('AIService: OpenAI API error', error)
        return null
      }

      const data = (await response.json()) as { choices?: { message?: { content?: string } }[] }
      const generatedText = data.choices?.[0]?.message?.content?.trim()

      return generatedText || null
    } catch (error) {
      console.error('AIService: Failed to generate description', error)
      return null
    }
  }

  /**
   * Build the prompt based on context
   */
  private buildPrompt(context: DescriptionContext): string {
    let prompt = `Écris une description Instagram pour un restaurant.

Mission: ${context.missionTitle}
Type de contenu: ${context.missionType}
Idée: ${context.contentIdea}`

    if (context.restaurantName) {
      prompt += `\nNom du restaurant: ${context.restaurantName}`
    }

    if (context.restaurantType) {
      prompt += `\nType de cuisine: ${context.restaurantType}`
    }

    return prompt
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

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Tu es un coach en communication digitale pour restaurateurs. Tu fais des bilans hebdomadaires encourageants et constructifs. Ton ton est bienveillant et motivant, comme un mentor. Maximum 100 mots.`,
            },
            {
              role: 'user',
              content: `Fais un bilan de la semaine pour ce restaurateur:

- Missions complétées: ${stats.missionsCompleted}
- Missions manquées: ${stats.missionsMissed}
- Tutoriels vus: ${stats.tutorialsWatched}
- Streak actuel: ${stats.currentStreak} jours
- Objectif: ${stats.strategy}

Donne un feedback personnalisé et 1-2 conseils pour la semaine suivante.`,
            },
          ],
          max_tokens: 200,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        return null
      }

      const data = (await response.json()) as { choices?: { message?: { content?: string } }[] }
      return data.choices?.[0]?.message?.content?.trim() || null
    } catch (error) {
      console.error('AIService: Failed to generate weekly report', error)
      return null
    }
  }
}
