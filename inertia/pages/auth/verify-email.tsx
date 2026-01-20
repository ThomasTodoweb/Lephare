import { Head, useForm, usePage } from '@inertiajs/react'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { useState, useRef, useEffect } from 'react'

interface Props {
  email: string
}

export default function VerifyEmail({ email }: Props) {
  const { flash } = usePage().props as { flash?: { success?: string; error?: string } }
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const verifyForm = useForm({ code: '' })
  const resendForm = useForm({})

  // Auto-focus first input
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleInputChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value
    setCode(newCode)

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all digits are filled
    if (newCode.every((digit) => digit !== '')) {
      verifyForm.setData('code', newCode.join(''))
      verifyForm.post('/verify-email')
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pastedData.length === 6) {
      const newCode = pastedData.split('')
      setCode(newCode)
      verifyForm.setData('code', pastedData)
      verifyForm.post('/verify-email')
    }
  }

  const handleResend = () => {
    resendForm.post('/resend-verification')
  }

  // Mask email for privacy
  const maskedEmail = email.replace(/(.{2})(.*)(@.*)/, '$1***$3')

  return (
    <>
      <Head title="Verifier votre email - Le Phare" />
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Card className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
              Verifiez votre email
            </h1>
            <p className="text-neutral-600 mt-2">
              Un code a 6 chiffres a ete envoye a<br />
              <span className="font-semibold text-neutral-800">{maskedEmail}</span>
            </p>
          </div>

          {/* Flash messages */}
          {flash?.error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              {flash.error}
            </div>
          )}
          {flash?.success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
              {flash.success}
            </div>
          )}

          {/* Code inputs */}
          <div className="flex justify-center gap-2 mb-6" onPaste={handlePaste}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-14 text-center text-2xl font-bold border-2 border-neutral-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                disabled={verifyForm.processing}
              />
            ))}
          </div>

          {/* Loading state */}
          {verifyForm.processing && (
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 text-primary">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Verification en cours...
              </div>
            </div>
          )}

          {/* Resend link */}
          <div className="text-center">
            <p className="text-neutral-600 text-sm mb-2">
              Vous n'avez pas recu le code ?
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendForm.processing}
              className="text-primary font-semibold hover:underline disabled:opacity-50"
            >
              {resendForm.processing ? 'Envoi en cours...' : 'Renvoyer le code'}
            </button>
          </div>

          {/* Info */}
          <div className="mt-8 p-4 bg-neutral-50 rounded-xl">
            <p className="text-neutral-500 text-xs text-center">
              Le code expire dans 15 minutes. Verifiez aussi vos spams si vous ne trouvez pas l'email.
            </p>
          </div>
        </Card>
      </div>
    </>
  )
}
