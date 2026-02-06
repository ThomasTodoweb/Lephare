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
  userContext?: string // User-provided context (transcribed from voice)
}

export interface MediaQualityResult {
  score: 'green' | 'yellow' | 'red'
  feedback: string // User-facing message
  details?: string // Technical details for logging
  /** What the AI detected in the image */
  detectedContent?: 'dish' | 'person' | 'team' | 'kitchen' | 'ambiance' | 'exterior' | 'other'
  /** Whether the content matches the mission */
  matchesMission?: boolean
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
   * Claude vision completion with multiple images (for video analysis)
   */
  private async claudeMultiImageCompletion(
    systemPrompt: string,
    userPrompt: string,
    imagesBase64: string[],
    imageMimeType: string,
    maxTokens: number
  ): Promise<string | null> {
    if (!this.claudeApiKey) return null

    try {
      // Build content array with all images
      const content: Array<
        | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
        | { type: 'text'; text: string }
      > = []

      for (const imageBase64 of imagesBase64) {
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: imageMimeType,
            data: imageBase64,
          },
        })
      }

      content.push({
        type: 'text',
        text: userPrompt,
      })

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
          messages: [{ role: 'user', content }],
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('AIService: Claude Multi-Image API error', error)
        return null
      }

      const data = (await response.json()) as { content?: { text?: string }[] }
      return data.content?.[0]?.text?.trim() || null
    } catch (error) {
      console.error('AIService: Claude Multi-Image request failed', error)
      return null
    }
  }

  /**
   * Validate user context from speech recognition
   * Checks if the text is comprehensible, coherent with the mission, and relevant for a restaurant
   * Returns cleaned context if valid, null if invalid
   */
  async validateUserContext(
    userContext: string,
    missionTitle: string,
    missionTheme?: string,
    restaurantName?: string
  ): Promise<{ isValid: boolean; cleanedContext: string | null }> {
    if (!this.isConfigured()) {
      // If AI not configured, pass through as-is
      return { isValid: true, cleanedContext: userContext }
    }

    const systemPrompt = `Tu es un validateur de contexte pour une app de publication Instagram pour restaurants.
L'utilisateur a dicté du contexte par reconnaissance vocale. Tu dois vérifier :

1. COMPRÉHENSIBILITÉ : Le texte est-il lisible et compréhensible ? (pas du charabia, pas de mots sans sens)
2. COHÉRENCE MISSION : Le contexte correspond-il à la mission "${missionTitle}"${missionTheme ? ` (thème : "${missionTheme}")` : ''} ?
3. PERTINENCE RESTAURANT : Le contexte fait-il sens pour un restaurant${restaurantName ? ` ("${restaurantName}")` : ''} ?

RÈGLES :
- Si le texte est du charabia incompréhensible (reconnaissance vocale ratée) → invalide
- Si le texte n'a aucun rapport avec la mission ou le restaurant → invalide
- Si le texte est compréhensible et pertinent, nettoie-le (corrige les fautes de reconnaissance vocale évidentes)
- Sois tolérant : même un contexte minimal ("burger", "Marie la cheffe") est valide s'il fait sens

FORMAT RÉPONSE (JSON uniquement) :
{"isValid": true, "cleanedContext": "texte nettoyé"} ou {"isValid": false, "cleanedContext": null}`

    const userPrompt = `Contexte dicté par l'utilisateur : "${userContext}"`

    try {
      const result = await this.chatCompletion(systemPrompt, userPrompt, 100)
      if (result) {
        const jsonMatch = result.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as { isValid?: boolean; cleanedContext?: string | null }
          return {
            isValid: parsed.isValid === true,
            cleanedContext: parsed.isValid ? (parsed.cleanedContext || userContext) : null,
          }
        }
      }
    } catch (error) {
      console.error('AIService: Context validation failed', error)
    }

    // Fallback: pass through as valid
    return { isValid: true, cleanedContext: userContext }
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

    const systemPrompt = `Tu es un créateur de contenu Instagram pour restaurants, expert du ton 2024-2026 : authentique, direct, zéro bullshit.

VIBE OBLIGATOIRE :
- Parle comme un pote, pas comme une pub
- Phrases courtes, punchy, parfois incomplètes genre "Ce moment où..." ou "Quand tu..."
- Utilise les codes actuels : "no caption needed", "iykyk", "POV:", "main character energy", "ate and left no crumbs"
- Emojis : 0 à 2 max, jamais à la suite, jamais en fin de phrase
- Tutoie TOUJOURS

STRUCTURE :
- Hook en première ligne (question, provoc légère, statement)
- 1-2 phrases max après
- EXACTEMENT 2-3 hashtags à la fin (1 hashtag ville obligatoire)

INTERDIT :
- "Venez découvrir", "N'hésitez pas", "Notre équipe", "Régalez-vous"
- Phrases de pub type "Le meilleur X de la ville"
- Plus de 2 emojis
- Phrases longues et chiantes
- Méta-commentaires ("Voici...", "Je vais...")

EXEMPLES DU BON TON :
- "Ce gratin qui fait oublier tous tes problèmes. Change my mind 🧀 #Lyon #ComfortFood"
- "POV: t'as dit 'juste un verre' et te voilà. #Bordeaux #Apero"
- "La team en cuisine à 6h. Pendant que vous dormez. #Paris #BehindTheScenes"
- "Quand le plat arrive et que personne parle pendant 30 secondes. #Marseille #FoodPorn"

OUTPUT : Retourne UNIQUEMENT la légende, rien d'autre. Commence direct par le texte.`

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
    let prompt = `Écris une légende Instagram style 2026.

RESTO:`
    if (context.restaurantName) prompt += ` ${context.restaurantName}`
    if (context.restaurantType) prompt += ` (${context.restaurantType})`
    if (context.restaurantCity) prompt += ` à ${context.restaurantCity}`

    prompt += `

CONTENU: ${context.missionType} - ${context.missionTitle}
THÈME: ${context.contentIdea}`

    // Add user-provided context if available
    if (context.userContext && context.userContext.trim()) {
      prompt += `

CONTEXTE (fourni par l'utilisateur):
"${context.userContext.trim()}"

Intègre ces informations naturellement dans la légende. Si un nom de plat, des ingrédients, une personne ou une occasion spéciale sont mentionnés, utilise-les pour personnaliser.`
    }

    if (context.imageBase64) {
      prompt += `

Regarde l'image et capte l'ambiance. Écris une légende qui matche le vibe, pas une description littérale.`
    } else {
      prompt += `

Écris une légende qui matche ce thème, ton punchy et authentique.`
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

  /**
   * Analyze media quality for Instagram publication
   * Returns a score (green/yellow/red) and feedback from Popote
   */
  async analyzeMediaQuality(
    imageBase64: string,
    imageMimeType: string,
    _contentType: 'post' | 'story' | 'reel' | 'carousel',
    restaurantName?: string,
    restaurantType?: string,
    missionTitle?: string,
    missionTheme?: string,
    userContext?: string
  ): Promise<MediaQualityResult> {
    // Default response if AI is not configured
    if (!this.claudeApiKey) {
      console.log('AIService: No Claude API key, skipping quality analysis')
      return {
        score: 'green',
        feedback: 'Analyse non disponible, tu peux continuer !',
        details: 'AI not configured',
      }
    }

    const restaurantContext = restaurantName
      ? `\nRESTAURANT : ${restaurantName}${restaurantType ? ` (${restaurantType})` : ''}`
      : ''

    const missionContext = missionTitle
      ? `\nMISSION : "${missionTitle}"${missionTheme ? ` - Thème : "${missionTheme}"` : ''}`
      : ''

    const userContextBlock = userContext
      ? `\nCONTEXTE DE L'UTILISATEUR : "${userContext}"\nL'utilisateur a décrit son contenu. Intègre cette info dans ton avis : si le contexte mentionne un plat et que l'image montre bien ce plat, mentionne-le. Si le contexte ne correspond pas à l'image, signale-le.`
      : ''

    const systemPrompt = `Tu es Popote, un ami qui donne son avis honnête avant qu'on poste sur Instagram.
${restaurantContext}${missionContext}${userContextBlock}

CONTEXTE : C'est le compte Instagram d'un RESTAURANT.

VÉRIFICATIONS À FAIRE (dans l'ordre) :

1. QUALITÉ TECHNIQUE
   - Floue, très sombre, inutilisable → red
   - Un peu sombre ou cadrage moyen → yellow

2. PERTINENCE RESTAURANT
   - Pas de lien visible avec un resto (animaux seuls, paysages, selfies perso) → yellow
   - Contenu lié au resto (plats, cuisine, équipe, ambiance, service) → OK

3. COHÉRENCE AVEC LA MISSION (si mission indiquée)
   - Si la mission demande un type de contenu et la photo montre autre chose → yellow
   - Exemple : mission "plat du jour" mais photo de l'extérieur du resto → yellow

TON STYLE :
- Parle normalement, comme un pote calme
- Pas de surexcitation ("oh j'adore !", "trop bien !", "MDR")
- 1-2 phrases max, direct

SCORING :
- green : Qualité OK + pertinent resto + cohérent avec la mission
- yellow : Problème de qualité OU pas lié au resto OU pas cohérent avec la mission
- red : Qualité vraiment mauvaise

DÉTECTION DU CONTENU (identifie ce qui est montré) :
- "dish" : un plat, une assiette, de la nourriture
- "person" : une personne seule (membre équipe, chef, serveur)
- "team" : plusieurs personnes, équipe
- "kitchen" : cuisine, préparation, coulisses
- "ambiance" : salle, décor, terrasse, ambiance du lieu
- "exterior" : façade, extérieur du restaurant
- "other" : autre chose

EXEMPLES :
- green: "Ça donne faim, la lumière est jolie. Tu peux poster."
- yellow: "C'est un peu sombre, on voit pas bien les détails."
- yellow: "Sympa mais je vois pas le rapport avec ton resto."
- yellow: "La mission c'était le plat du jour, là c'est plutôt l'ambiance générale non ?"
- red: "C'est trop flou, refais-la."

FORMAT RÉPONSE (JSON uniquement) :
{
  "score": "green|yellow|red",
  "feedback": "ton avis",
  "details": "note technique",
  "detectedContent": "dish|person|team|kitchen|ambiance|exterior|other",
  "matchesMission": true|false
}`

    let userPrompt = missionTitle
      ? `Je vais poster cette photo sur l'Instagram de mon resto. La mission c'est "${missionTitle}". T'en penses quoi ?`
      : `Je vais poster cette photo sur l'Instagram de mon resto. T'en penses quoi ?`

    if (userContext) {
      userPrompt += ` J'ai précisé : "${userContext}".`
    }

    try {
      const result = await this.claudeVisionCompletion(
        systemPrompt,
        userPrompt,
        imageBase64,
        imageMimeType,
        300
      )

      if (!result) {
        console.error('AIService: No response from Claude Vision for quality analysis')
        return {
          score: 'green',
          feedback: 'Analyse temporairement indisponible, vous pouvez continuer.',
          details: 'No API response',
        }
      }

      // Parse JSON response
      try {
        // Try to extract JSON from the response (in case there's extra text)
        const jsonMatch = result.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as {
            score?: string
            feedback?: string
            details?: string
            detectedContent?: string
            matchesMission?: boolean
          }

          // Validate score
          const validScores = ['green', 'yellow', 'red']
          const score = validScores.includes(parsed.score || '')
            ? (parsed.score as 'green' | 'yellow' | 'red')
            : 'green'

          // Validate detected content
          const validContents = ['dish', 'person', 'team', 'kitchen', 'ambiance', 'exterior', 'other']
          const detectedContent = validContents.includes(parsed.detectedContent || '')
            ? (parsed.detectedContent as 'dish' | 'person' | 'team' | 'kitchen' | 'ambiance' | 'exterior' | 'other')
            : undefined

          return {
            score,
            feedback: parsed.feedback || 'Image analysée.',
            details: parsed.details,
            detectedContent,
            matchesMission: parsed.matchesMission,
          }
        }
      } catch (parseError) {
        console.error('AIService: Failed to parse quality analysis JSON', parseError, result)
      }

      // Fallback if JSON parsing fails
      return {
        score: 'green',
        feedback: 'Image analysée avec succès.',
        details: `Raw response: ${result}`,
      }
    } catch (error) {
      console.error('AIService: Quality analysis failed', error)
      return {
        score: 'green',
        feedback: 'Analyse temporairement indisponible, tu peux continuer.',
        details: String(error),
      }
    }
  }

  /**
   * Analyze video quality using multiple frames
   * Returns a score (green/yellow/red) and feedback from Popote
   */
  async analyzeVideoQuality(
    framesBase64: string[],
    imageMimeType: string,
    contentType: 'story' | 'reel',
    restaurantName?: string,
    restaurantType?: string,
    missionTitle?: string,
    missionTheme?: string,
    userContext?: string
  ): Promise<MediaQualityResult> {
    if (!this.claudeApiKey) {
      return {
        score: 'green',
        feedback: 'Ta vidéo est prête !',
        details: 'AI not configured',
      }
    }

    const contentLabel = contentType === 'story' ? 'story' : 'reel'
    const restaurantContext = restaurantName
      ? `\nRESTAURANT : ${restaurantName}${restaurantType ? ` (${restaurantType})` : ''}`
      : ''

    const missionContext = missionTitle
      ? `\nMISSION : "${missionTitle}"${missionTheme ? ` - Thème : "${missionTheme}"` : ''}`
      : ''

    const userContextBlock = userContext
      ? `\nCONTEXTE DE L'UTILISATEUR : "${userContext}"\nL'utilisateur a décrit son contenu. Intègre cette info dans ton avis.`
      : ''

    const systemPrompt = `Tu es Popote, un ami qui donne son avis honnête avant qu'on poste sur Instagram.
${restaurantContext}${missionContext}${userContextBlock}

CONTEXTE TECHNIQUE (ne pas mentionner) :
Tu reçois ${framesBase64.length} images extraites d'UNE SEULE VIDÉO ${contentLabel.toUpperCase()}.
Parle de "ta vidéo", jamais de "captures" ou "images".

CONTEXTE : C'est le compte Instagram d'un RESTAURANT.

VÉRIFICATIONS À FAIRE (dans l'ordre) :

1. QUALITÉ TECHNIQUE
   - Floue, très sombre, incompréhensible → red
   - Un peu sombre ou instable → yellow

2. PERTINENCE RESTAURANT
   - Pas de lien visible avec un resto (animaux seuls, paysages, vidéos perso) → yellow
   - Contenu lié au resto (plats, cuisine, équipe, ambiance, service) → OK

3. COHÉRENCE AVEC LA MISSION (si mission indiquée)
   - Si la mission demande un type de contenu et la vidéo montre autre chose → yellow
   - Exemple : mission "plat du jour" mais vidéo de l'extérieur → yellow

TON STYLE :
- Parle normalement, comme un pote calme
- Pas de surexcitation
- 1-2 phrases max, direct

SCORING :
- green : Qualité OK + pertinent resto + cohérent avec la mission
- yellow : Problème de qualité OU pas lié au resto OU pas cohérent avec la mission
- red : Qualité vraiment mauvaise

EXEMPLES :
- green: "C'est dynamique, on voit bien l'ambiance cuisine. Tu peux poster."
- yellow: "C'est un peu sombre, on perd les détails."
- yellow: "Je vois pas trop le rapport avec ton resto."
- yellow: "La mission c'était le plat du jour, là c'est autre chose non ?"
- red: "C'est trop flou, refais-la."

FORMAT RÉPONSE (JSON uniquement) :
{"score": "green|yellow|red", "feedback": "ton avis", "details": "note technique"}`

    let userPrompt = missionTitle
      ? `Je vais poster cette vidéo en ${contentLabel} sur l'Instagram de mon resto. La mission c'est "${missionTitle}". T'en penses quoi ?`
      : `Je vais poster cette vidéo en ${contentLabel} sur l'Instagram de mon resto. T'en penses quoi ?`

    if (userContext) {
      userPrompt += ` J'ai précisé : "${userContext}".`
    }

    try {
      const result = await this.claudeMultiImageCompletion(
        systemPrompt,
        userPrompt,
        framesBase64,
        imageMimeType,
        200
      )

      if (!result) {
        return {
          score: 'green',
          feedback: 'Ta vidéo est prête !',
          details: 'No API response',
        }
      }

      try {
        const jsonMatch = result.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]) as {
            score?: string
            feedback?: string
            details?: string
          }

          const validScores = ['green', 'yellow', 'red']
          const score = validScores.includes(parsed.score || '')
            ? (parsed.score as 'green' | 'yellow' | 'red')
            : 'green'

          return {
            score,
            feedback: parsed.feedback || 'Vidéo analysée.',
            details: parsed.details,
          }
        }
      } catch (parseError) {
        console.error('AIService: Failed to parse video analysis JSON', parseError, result)
      }

      return {
        score: 'green',
        feedback: 'Ta vidéo est prête !',
        details: `Raw: ${result}`,
      }
    } catch (error) {
      console.error('AIService: Video analysis failed', error)
      return {
        score: 'green',
        feedback: 'Ta vidéo est prête !',
        details: String(error),
      }
    }
  }
}
