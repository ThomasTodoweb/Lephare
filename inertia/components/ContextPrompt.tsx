import { useState } from 'react'
import { Mic, MicOff, X, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { useVoiceRecorder } from '~/hooks/useVoiceRecorder'

type DetectedContent = 'dish' | 'person' | 'team' | 'kitchen' | 'ambiance' | 'exterior' | 'other'

interface ContextQuestion {
  id: string
  label: string
  placeholder: string
  icon?: string
}

interface ContextPromptProps {
  missionTitle: string
  detectedContent?: DetectedContent
  matchesMission?: boolean
  onContextChange: (context: string) => void
  initialContext?: string
  disabled?: boolean
}

/**
 * Get contextual questions based on mission title and detected content
 */
function getContextQuestions(
  missionTitle: string,
  detectedContent?: DetectedContent,
  matchesMission?: boolean
): ContextQuestion[] {
  const title = missionTitle.toLowerCase()

  // If content matches mission, ask specific questions
  if (matchesMission !== false) {
    // Plat du jour / Plat signature / Teasing carte
    if (
      title.includes('plat du jour') ||
      title.includes('recette signature') ||
      title.includes('teasing') ||
      title.includes('carte')
    ) {
      if (detectedContent === 'dish') {
        return [
          { id: 'dish_name', label: 'Nom du plat', placeholder: 'Ex: Burger au chèvre, Risotto aux cèpes...' },
          { id: 'ingredients', label: 'Ingrédients principaux', placeholder: 'Ex: Chèvre frais, oignons caramélisés, bacon...' },
        ]
      }
    }

    // Présentation équipe
    if (title.includes('équipe') || title.includes('présentation')) {
      if (detectedContent === 'person' || detectedContent === 'team') {
        return [
          { id: 'person_name', label: 'Prénom', placeholder: 'Ex: Marie, Thomas...' },
          { id: 'person_role', label: 'Rôle dans l\'équipe', placeholder: 'Ex: Chef de cuisine, Serveur depuis 3 ans...' },
          { id: 'person_story', label: 'Petite anecdote (optionnel)', placeholder: 'Ex: Passionné de pâtisserie depuis l\'enfance...' },
        ]
      }
    }

    // Coulisses cuisine
    if (title.includes('coulisse') || title.includes('cuisine')) {
      if (detectedContent === 'kitchen' || detectedContent === 'dish') {
        return [
          { id: 'action', label: 'Que se passe-t-il ?', placeholder: 'Ex: Préparation du service, Dressage des entrées...' },
        ]
      }
    }

    // Promotion
    if (title.includes('promotion') || title.includes('spéciale')) {
      return [
        { id: 'promo_details', label: 'Détails de la promo', placeholder: 'Ex: -20% sur les desserts ce weekend...' },
      ]
    }

    // Avis client
    if (title.includes('avis') || title.includes('client')) {
      return [
        { id: 'client_feedback', label: 'Ce que le client a dit', placeholder: 'Ex: "Meilleur burger de la ville !"...' },
      ]
    }

    // Engagement local
    if (title.includes('engagement') || title.includes('local')) {
      return [
        { id: 'local_info', label: 'Partenaire ou initiative locale', placeholder: 'Ex: Légumes de la ferme Dupont, Bière artisanale locale...' },
      ]
    }
  }

  // Fallback: content doesn't match mission OR generic mission
  // Ask based on what was detected
  if (detectedContent === 'dish') {
    return [
      { id: 'dish_name', label: 'C\'est quoi ce plat ?', placeholder: 'Ex: Notre burger signature, Entrée du jour...' },
    ]
  }

  if (detectedContent === 'person' || detectedContent === 'team') {
    return [
      { id: 'person_info', label: 'Qui est-ce ?', placeholder: 'Ex: Notre chef Thomas, L\'équipe du matin...' },
    ]
  }

  if (detectedContent === 'kitchen') {
    return [
      { id: 'kitchen_action', label: 'Que se passe-t-il ?', placeholder: 'Ex: Préparation du service, Notre nouveau four...' },
    ]
  }

  if (detectedContent === 'ambiance' || detectedContent === 'exterior') {
    return [
      { id: 'ambiance_info', label: 'Contexte', placeholder: 'Ex: Notre nouvelle terrasse, Soirée à thème...' },
    ]
  }

  // Ultimate fallback
  return [
    { id: 'general', label: 'Décris ton contenu', placeholder: 'Ex: Notre spécialité du moment, L\'ambiance du soir...' },
  ]
}

export function ContextPrompt({
  missionTitle,
  detectedContent,
  matchesMission,
  onContextChange,
  initialContext = '',
  disabled = false,
}: ContextPromptProps) {
  const questions = getContextQuestions(missionTitle, detectedContent, matchesMission)
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    // Try to parse initial context as JSON, otherwise use as general answer
    if (initialContext) {
      try {
        return JSON.parse(initialContext)
      } catch {
        return { [questions[0]?.id || 'general']: initialContext }
      }
    }
    return {}
  })
  const [isExpanded, setIsExpanded] = useState(true)
  const [activeVoiceField, setActiveVoiceField] = useState<string | null>(null)

  const { isRecording, isSupported, startRecording, stopRecording } = useVoiceRecorder({
    onTranscript: (text) => {
      if (activeVoiceField) {
        handleAnswerChange(activeVoiceField, text)
      }
    },
    onError: (err) => console.error('Voice error:', err),
  })

  const handleAnswerChange = (questionId: string, value: string) => {
    const newAnswers = { ...answers, [questionId]: value }
    setAnswers(newAnswers)

    // Build context string from all non-empty answers
    const contextParts = questions
      .filter((q) => newAnswers[q.id]?.trim())
      .map((q) => `${q.label}: ${newAnswers[q.id].trim()}`)

    onContextChange(contextParts.join('\n'))
  }

  const hasAnyAnswer = Object.values(answers).some((v) => v?.trim())

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl overflow-hidden">
      {/* Header - collapsible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
        disabled={disabled}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm">?</span>
          </div>
          <div>
            <p className="text-sm font-medium text-amber-900">
              {hasAnyAnswer ? 'Contexte ajouté' : 'Ajoute du contexte (optionnel)'}
            </p>
            <p className="text-xs text-amber-700">
              Pour une meilleure description IA
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasAnyAnswer && <Check className="w-4 h-4 text-green-600" />}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-amber-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-amber-600" />
          )}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3">
          {questions.map((question) => (
            <div key={question.id}>
              <label className="block text-sm font-medium text-amber-900 mb-1">
                {question.label}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={answers[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  placeholder={question.placeholder}
                  className="w-full px-3 py-2 pr-12 text-sm border border-amber-200 rounded-lg focus:outline-none focus:border-amber-400 bg-white"
                  disabled={disabled || isRecording}
                />
                {/* Voice button */}
                {isSupported && (
                  <button
                    onMouseDown={() => {
                      setActiveVoiceField(question.id)
                      startRecording()
                    }}
                    onMouseUp={stopRecording}
                    onMouseLeave={stopRecording}
                    onTouchStart={(e) => {
                      e.preventDefault()
                      setActiveVoiceField(question.id)
                      startRecording()
                    }}
                    onTouchEnd={(e) => {
                      e.preventDefault()
                      stopRecording()
                    }}
                    disabled={disabled}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${
                      isRecording && activeVoiceField === question.id
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                    }`}
                    title="Maintenir pour dicter"
                  >
                    {isRecording && activeVoiceField === question.id ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Clear button */}
          {hasAnyAnswer && (
            <button
              onClick={() => {
                setAnswers({})
                onContextChange('')
              }}
              className="text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1"
              disabled={disabled}
            >
              <X className="w-3 h-3" />
              Effacer
            </button>
          )}
        </div>
      )}
    </div>
  )
}
