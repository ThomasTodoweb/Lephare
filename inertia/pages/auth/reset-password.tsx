import { Head, useForm, usePage, Link } from '@inertiajs/react'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { Toast } from '~/components/ui/Toast'
import { useState } from 'react'

interface Props {
  token: string
}

export default function ResetPassword({ token }: Props) {
  const { flash } = usePage().props as { flash?: { success?: string; error?: string } }
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const form = useForm({
    token,
    password: '',
    password_confirmation: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (form.data.password !== form.data.password_confirmation) {
      form.setError('password_confirmation', 'Les mots de passe ne correspondent pas')
      return
    }

    if (form.data.password.length < 8) {
      form.setError('password', 'Le mot de passe doit contenir au moins 8 caracteres')
      return
    }

    form.post('/reset-password')
  }

  return (
    <>
      <Head title="Nouveau mot de passe - Le Phare" />
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Card className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
              Nouveau mot de passe
            </h1>
            <p className="text-neutral-600 mt-2">
              Choisissez un nouveau mot de passe securise.
            </p>
          </div>

          {/* Flash messages as toasts */}
          {flash?.error && <Toast message={flash.error} type="error" />}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <input type="hidden" name="token" value={token} />

            {/* Password */}
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-semibold text-neutral-700 mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.data.password}
                  onChange={(e) => form.setData('password', e.target.value)}
                  className="w-full px-4 py-3 pr-12 border-2 border-neutral-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Minimum 8 caracteres"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {form.errors.password && (
                <p className="mt-1 text-red-500 text-sm">{form.errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="mb-6">
              <label htmlFor="password_confirmation" className="block text-sm font-semibold text-neutral-700 mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  id="password_confirmation"
                  type={showConfirm ? 'text' : 'password'}
                  value={form.data.password_confirmation}
                  onChange={(e) => form.setData('password_confirmation', e.target.value)}
                  className="w-full px-4 py-3 pr-12 border-2 border-neutral-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="Retapez le mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showConfirm ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {form.errors.password_confirmation && (
                <p className="mt-1 text-red-500 text-sm">{form.errors.password_confirmation}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={form.processing}
              className="w-full"
            >
              {form.processing ? 'Mise a jour...' : 'Mettre a jour le mot de passe'}
            </Button>
          </form>

          {/* Password requirements */}
          <div className="mt-6 p-4 bg-neutral-50 rounded-xl">
            <p className="text-neutral-600 text-sm font-semibold mb-2">Le mot de passe doit :</p>
            <ul className="text-neutral-500 text-xs space-y-1">
              <li className="flex items-center gap-2">
                <span className={form.data.password.length >= 8 ? 'text-green-500' : 'text-neutral-400'}>
                  {form.data.password.length >= 8 ? '✓' : '○'}
                </span>
                Contenir au moins 8 caracteres
              </li>
            </ul>
          </div>

          {/* Back to login */}
          <div className="mt-6 text-center">
            <Link href="/login" className="text-primary font-semibold hover:underline">
              Retour a la connexion
            </Link>
          </div>
        </Card>
      </div>
    </>
  )
}
