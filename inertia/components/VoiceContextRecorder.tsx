import { useState, useEffect } from 'react'
import { Mic, MicOff, X, Check } from 'lucide-react'
import { useVoiceRecorder } from '~/hooks/useVoiceRecorder'

interface VoiceContextRecorderProps {
  onContextChange: (context: string) => void
  initialContext?: string
  disabled?: boolean
}

export function VoiceContextRecorder({
  onContextChange,
  initialContext = '',
  disabled = false,
}: VoiceContextRecorderProps) {
  const [context, setContext] = useState(initialContext)
  const [isExpanded, setIsExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { isRecording, isSupported, transcript, startRecording, stopRecording, clearTranscript } =
    useVoiceRecorder({
      onTranscript: (text) => {
        setContext(text)
        onContextChange(text)
      },
      onError: setError,
    })

  // Sync transcript to context
  useEffect(() => {
    if (transcript) {
      setContext(transcript)
    }
  }, [transcript])

  // Don't render if speech recognition is not supported
  if (!isSupported) {
    // Fallback to text-only input
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Mic className="w-5 h-5 text-white" />
          </div>

          <div className="flex-1">
            <p className="text-sm font-medium text-amber-900 mb-1">Ajouter du contexte (optionnel)</p>
            <p className="text-xs text-amber-700 mb-3">
              Decris ton contenu pour une meilleure description IA
            </p>

            <textarea
              value={context}
              onChange={(e) => {
                setContext(e.target.value)
                onContextChange(e.target.value)
              }}
              placeholder="Ex: C'est notre burger signature au chevre avec des oignons caramelises..."
              className="w-full h-20 px-3 py-2 text-sm border border-amber-200 rounded-lg resize-none focus:outline-none focus:border-amber-400"
              maxLength={1000}
              disabled={disabled}
            />
            <span className="text-xs text-amber-600">{context.length}/1000</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Mic className="w-5 h-5 text-white" />
        </div>

        <div className="flex-1">
          <p className="text-sm font-medium text-amber-900 mb-1">Ajouter du contexte (optionnel)</p>
          <p className="text-xs text-amber-700 mb-3">
            Decris ton contenu pour une meilleure description IA
          </p>

          {!isExpanded && !context ? (
            <button
              onClick={() => setIsExpanded(true)}
              disabled={disabled}
              className="text-sm text-amber-700 underline hover:text-amber-800 disabled:opacity-50"
            >
              Ajouter un contexte vocal
            </button>
          ) : (
            <div className="space-y-3">
              {/* Text area with transcription */}
              <div className="relative">
                <textarea
                  value={context}
                  onChange={(e) => {
                    setContext(e.target.value)
                    onContextChange(e.target.value)
                  }}
                  placeholder="Ex: C'est notre burger signature au chevre avec des oignons caramelises..."
                  className="w-full h-20 px-3 py-2 text-sm border border-amber-200 rounded-lg resize-none focus:outline-none focus:border-amber-400"
                  maxLength={1000}
                  disabled={isRecording || disabled}
                />
                {context && (
                  <button
                    onClick={() => {
                      setContext('')
                      onContextChange('')
                      clearTranscript()
                    }}
                    className="absolute top-2 right-2 text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Microphone button */}
              <div className="flex items-center gap-2">
                <button
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  onTouchStart={(e) => {
                    e.preventDefault()
                    startRecording()
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault()
                    stopRecording()
                  }}
                  disabled={disabled}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isRecording
                      ? 'bg-red-500 text-white animate-pulse'
                      : 'bg-white border border-amber-300 text-amber-700 hover:bg-amber-50'
                  } disabled:opacity-50`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-4 h-4" />
                      Relacher pour terminer
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" />
                      Maintenir pour parler
                    </>
                  )}
                </button>

                {context && <span className="text-xs text-amber-600">{context.length}/1000</span>}
              </div>

              {/* Error message */}
              {error && <p className="text-xs text-red-600">{error}</p>}

              {/* Success indicator */}
              {context && !isRecording && (
                <div className="flex items-center gap-1 text-green-600 text-xs">
                  <Check className="w-3 h-3" />
                  Contexte enregistre
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
