import { Head, useForm, usePage } from '@inertiajs/react'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { Toast } from '~/components/ui/Toast'
import { useState, useRef, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

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
      <Head title="Verifie ton email - Le Phare" />
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-5 py-12">
        {flash?.error && <Toast message={flash.error} type="error" />}
        {flash?.success && <Toast message={flash.success} type="success" />}

        <Card className="w-full max-w-md" padding="lg">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-bg-subtle rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-5 h-5 text-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-[22px] font-bold text-text tracking-tight">
              Verifie ton email
            </h1>
            <p className="text-[14px] text-text-secondary mt-2 leading-relaxed">
              Un code a 6 chiffres a ete envoye a<br />
              <span className="font-medium text-text">{maskedEmail}</span>
            </p>
          </div>

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
                className="w-11 h-12 text-center text-[20px] font-bold bg-bg-card border border-border rounded-xl text-text transition-colors focus:outline-none focus:border-text focus:ring-1 focus:ring-text/10 disabled:opacity-50"
                disabled={verifyForm.processing}
              />
            ))}
          </div>

          {/* Loading state */}
          {verifyForm.processing && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <Loader2 className="w-4 h-4 animate-spin text-text" />
              <span className="text-[13px] text-text-secondary">Verification en cours...</span>
            </div>
          )}

          {/* Resend link */}
          <div className="text-center">
            <p className="text-[13px] text-text-muted mb-1.5">
              Tu n'as pas recu le code ?
            </p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resendForm.processing}
              className="text-[13px] font-medium text-text hover:text-text-secondary transition-colors disabled:opacity-50"
            >
              {resendForm.processing ? 'Envoi en cours...' : 'Renvoyer le code'}
            </button>
          </div>

          {/* Info */}
          <div className="mt-6 p-3 bg-bg-subtle rounded-xl">
            <p className="text-[12px] text-text-muted text-center">
              Le code expire dans 15 minutes. Verifie aussi tes spams si tu ne trouves pas l'email.
            </p>
          </div>
        </Card>
      </div>
    </>
  )
}
