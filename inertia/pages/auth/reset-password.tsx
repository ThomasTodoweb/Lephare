import { Head, useForm, usePage, Link } from '@inertiajs/react'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { Toast } from '~/components/ui/Toast'
import { useState } from 'react'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'

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
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-5 py-12">
        {flash?.error && <Toast message={flash.error} type="error" />}

        <Card className="w-full max-w-md" padding="lg">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-bg-subtle rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-5 h-5 text-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-[22px] font-bold text-text tracking-tight">
              Nouveau mot de passe
            </h1>
            <p className="text-[14px] text-text-secondary mt-2 leading-relaxed">
              Choisis un nouveau mot de passe securise.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="hidden" name="token" value={token} />

            {/* Password */}
            <div className="w-full">
              <label htmlFor="password" className="block mb-1.5 text-[13px] font-medium text-text-secondary">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.data.password}
                  onChange={(e) => form.setData('password', e.target.value)}
                  className="w-full h-11 px-3.5 pr-11 bg-bg-card border border-border rounded-xl text-[15px] text-text placeholder-text-muted transition-colors focus:outline-none focus:border-text focus:ring-1 focus:ring-text/10"
                  placeholder="Minimum 8 caracteres"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {form.errors.password && (
                <p className="mt-1 text-[12px] text-error font-medium">{form.errors.password}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div className="w-full">
              <label htmlFor="password_confirmation" className="block mb-1.5 text-[13px] font-medium text-text-secondary">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <input
                  id="password_confirmation"
                  type={showConfirm ? 'text' : 'password'}
                  value={form.data.password_confirmation}
                  onChange={(e) => form.setData('password_confirmation', e.target.value)}
                  className="w-full h-11 px-3.5 pr-11 bg-bg-card border border-border rounded-xl text-[15px] text-text placeholder-text-muted transition-colors focus:outline-none focus:border-text focus:ring-1 focus:ring-text/10"
                  placeholder="Retape le mot de passe"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
              {form.errors.password_confirmation && (
                <p className="mt-1 text-[12px] text-error font-medium">{form.errors.password_confirmation}</p>
              )}
            </div>

            {/* Password requirement */}
            <div className="p-3 bg-bg-subtle rounded-xl">
              <div className="flex items-center gap-2 text-[12px]">
                <span className={form.data.password.length >= 8 ? 'text-green-600 font-medium' : 'text-text-muted'}>
                  {form.data.password.length >= 8 ? '/' : 'o'}
                </span>
                <span className={form.data.password.length >= 8 ? 'text-text-secondary' : 'text-text-muted'}>
                  Contenir au moins 8 caracteres
                </span>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={form.processing}
            >
              Mettre a jour le mot de passe
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/login" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-text-secondary hover:text-text transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
              Retour a la connexion
            </Link>
          </div>
        </Card>
      </div>
    </>
  )
}
