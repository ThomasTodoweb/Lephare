import { useState, useRef, useEffect, useCallback } from 'react'
import { Mic, MicOff, Check } from 'lucide-react'

interface ContextQuestion {
  id: string
  label: string
  placeholder: string
}

interface MediaContextInputProps {
  missionTitle: string
  onContextChange: (context: string) => void
  disabled?: boolean
}

// Extend Window interface for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  abort(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: Event & { error: string }) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition
    webkitSpeechRecognition?: new () => SpeechRecognition
  }
}

/**
 * Get contextual questions based on mission title
 */
function getContextQuestions(missionTitle: string): ContextQuestion[] {
  const title = missionTitle.toLowerCase()

  // Plat du jour / Plat signature / Teasing carte / Recette
  if (
    title.includes('plat') ||
    title.includes('recette') ||
    title.includes('teasing') ||
    title.includes('carte')
  ) {
    return [
      { id: 'dish_name', label: 'Nom du plat', placeholder: 'Ex: Burger au chèvre, Risotto aux cèpes...' },
      { id: 'ingredients', label: 'Ingrédients principaux (optionnel)', placeholder: 'Ex: Chèvre frais, oignons caramélisés...' },
    ]
  }

  // Présentation équipe
  if (title.includes('équipe') || title.includes('présentation')) {
    return [
      { id: 'person_name', label: 'Prénom', placeholder: 'Ex: Marie, Thomas...' },
      { id: 'person_role', label: 'Rôle', placeholder: 'Ex: Chef, Serveur depuis 3 ans...' },
    ]
  }

  // Coulisses cuisine
  if (title.includes('coulisse') || title.includes('cuisine')) {
    return [
      { id: 'action', label: 'Que se passe-t-il ?', placeholder: 'Ex: Préparation du service, Dressage...' },
    ]
  }

  // Promotion
  if (title.includes('promotion') || title.includes('spéciale')) {
    return [
      { id: 'promo', label: 'Détails de la promo', placeholder: 'Ex: -20% sur les desserts...' },
    ]
  }

  // Engagement local
  if (title.includes('engagement') || title.includes('local')) {
    return [
      { id: 'local', label: 'Partenaire local ou initiative', placeholder: 'Ex: Légumes de la ferme Dupont...' },
    ]
  }

  // Avis client
  if (title.includes('avis') || title.includes('client')) {
    return [
      { id: 'feedback', label: 'Ce que le client a dit', placeholder: 'Ex: "Meilleur burger de la ville !"...' },
    ]
  }

  // Fallback générique
  return [
    { id: 'context', label: 'Décris ton contenu', placeholder: 'Ex: Notre spécialité du moment...' },
  ]
}

/**
 * Check if Speech Recognition is supported
 */
function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
}

export function MediaContextInput({
  missionTitle,
  onContextChange,
  disabled = false,
}: MediaContextInputProps) {
  const questions = getContextQuestions(missionTitle)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const isSupported = isSpeechRecognitionSupported()

  // Build context string from answers
  const buildContext = useCallback((currentAnswers: Record<string, string>) => {
    const contextParts = questions
      .filter((q) => currentAnswers[q.id]?.trim())
      .map((q) => `${q.label}: ${currentAnswers[q.id].trim()}`)
    return contextParts.join('\n')
  }, [questions])

  // Update parent when answers change
  useEffect(() => {
    onContextChange(buildContext(answers))
  }, [answers, buildContext, onContextChange])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort()
        } catch {
          // Ignore cleanup errors
        }
      }
    }
  }, [])

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }))
  }

  const startListening = () => {
    if (!isSupported || disabled) return

    setError(null)
    setTranscript('')

    try {
      const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SpeechRecognitionClass) return

      const recognition = new SpeechRecognitionClass()
      recognitionRef.current = recognition

      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'fr-FR'

      recognition.onstart = () => {
        setIsListening(true)
      }

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        // Rebuild full transcript from all results
        let fullTranscript = ''

        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i]
          // Only add the transcript (final or interim)
          fullTranscript += result[0].transcript
        }

        // Update displayed transcript
        setTranscript(fullTranscript)

        // Update the first question field with the full transcript
        const firstQuestion = questions[0]
        if (firstQuestion) {
          setAnswers(prevAnswers => ({
            ...prevAnswers,
            [firstQuestion.id]: fullTranscript.trim()
          }))
        }
      }

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        if (event.error === 'not-allowed') {
          setError('Microphone non autorisé. Activez-le dans les paramètres.')
        } else if (event.error === 'no-speech') {
          // This is normal, just stop listening
        } else {
          setError('Erreur de reconnaissance vocale')
        }
        setIsListening(false)
      }

      recognition.onend = () => {
        setIsListening(false)
        recognitionRef.current = null
      }

      recognition.start()
    } catch (err) {
      console.error('Failed to start speech recognition:', err)
      setError('Impossible de démarrer la reconnaissance vocale')
      setIsListening(false)
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {
        // Ignore stop errors
      }
    }
    setIsListening(false)
  }

  const toggleListening = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  const hasAnyAnswer = Object.values(answers).some((v) => v?.trim())

  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-2xl overflow-hidden">
      {/* Main mic button */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Mic button */}
          {isSupported && (
            <button
              type="button"
              onClick={toggleListening}
              disabled={disabled}
              className={`
                flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
                transition-all duration-200
                ${isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-neutral-900 text-white hover:bg-neutral-800 active:scale-95'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isListening ? (
                <MicOff className="w-5 h-5" />
              ) : (
                <Mic className="w-5 h-5" />
              )}
            </button>
          )}

          {/* Instructions / status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-sm font-semibold text-neutral-800">
                {hasAnyAnswer ? 'Contexte ajouté' : 'Ajouter du contexte'}
              </p>
              {hasAnyAnswer && <Check className="w-4 h-4 text-green-600" />}
            </div>

            {isListening ? (
              <p className="text-xs text-red-600 font-medium">
                Parle maintenant... Appuie pour arrêter
              </p>
            ) : isSupported ? (
              <p className="text-xs text-neutral-500">
                Appuie sur le micro et décris ton contenu
              </p>
            ) : (
              <p className="text-xs text-neutral-500">
                Remplis les champs ci-dessous
              </p>
            )}

            {/* Show transcript while listening */}
            {isListening && transcript && (
              <p className="mt-2 text-sm text-neutral-600 bg-white rounded-lg px-3 py-2 italic">
                "{transcript}"
              </p>
            )}

            {/* Error message */}
            {error && (
              <p className="mt-2 text-xs text-red-600">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Editable fields - always visible */}
      <div className="px-4 pb-4 space-y-3 border-t border-neutral-100 pt-3">
        <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide">
          {isSupported ? 'Ou remplis manuellement :' : 'Informations :'}
        </p>
        {questions.map((question) => (
          <div key={question.id}>
            <label className="block text-xs font-medium text-neutral-600 mb-1">
              {question.label}
            </label>
            <input
              type="text"
              value={answers[question.id] || ''}
              onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              placeholder={question.placeholder}
              className="w-full px-3 py-2.5 text-sm border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
              disabled={disabled}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
