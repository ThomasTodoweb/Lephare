import { useState, useRef, useCallback, useEffect } from 'react'

interface UseVoiceRecorderOptions {
  onTranscript?: (text: string) => void
  onError?: (error: string) => void
  language?: string
}

interface UseVoiceRecorderReturn {
  isRecording: boolean
  isSupported: boolean
  transcript: string
  startRecording: () => void
  stopRecording: () => void
  clearTranscript: () => void
}

export function useVoiceRecorder({
  onTranscript,
  onError,
  language = 'fr-FR',
}: UseVoiceRecorderOptions = {}): UseVoiceRecorderReturn {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Check browser support
  useEffect(() => {
    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null
    setIsSupported(!!SpeechRecognitionAPI)
  }, [])

  const startRecording = useCallback(() => {
    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null

    if (!SpeechRecognitionAPI) {
      onError?.("La reconnaissance vocale n'est pas supportée par ce navigateur")
      return
    }

    const recognition = new SpeechRecognitionAPI()
    recognition.lang = language
    recognition.continuous = true
    recognition.interimResults = true

    let finalTranscriptAccumulated = ''

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcriptPart = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscriptAccumulated += transcriptPart + ' '
        } else {
          interimTranscript += transcriptPart
        }
      }

      const currentTranscript = (finalTranscriptAccumulated + interimTranscript).trim()
      setTranscript(currentTranscript)
      onTranscript?.(currentTranscript)
    }

    recognition.onerror = (event) => {
      setIsRecording(false)
      if (event.error === 'not-allowed') {
        onError?.("Accès au microphone refusé. Autorisez l'accès dans les paramètres.")
      } else if (event.error === 'no-speech') {
        onError?.('Aucune parole détectée. Réessayez.')
      } else {
        onError?.('Erreur de reconnaissance vocale')
      }
    }

    recognition.onend = () => {
      setIsRecording(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
  }, [language, onTranscript, onError])

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop()
    setIsRecording(false)
  }, [])

  const clearTranscript = useCallback(() => {
    setTranscript('')
  }, [])

  return {
    isRecording,
    isSupported,
    transcript,
    startRecording,
    stopRecording,
    clearTranscript,
  }
}
