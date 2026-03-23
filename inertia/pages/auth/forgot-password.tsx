import { Head, useForm, usePage, Link } from '@inertiajs/react'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'
import { Input } from '~/components/ui/Input'
import { Toast } from '~/components/ui/Toast'
import { ArrowLeft } from 'lucide-react'

export default function ForgotPassword() {
  const { flash } = usePage().props as { flash?: { success?: string; error?: string } }
  const form = useForm({
    email: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    form.post('/forgot-password')
  }

  return (
    <>
      <Head title="Mot de passe oublie - Le Phare" />
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-5 py-12">
        {/* Flash messages as toasts */}
        {flash?.error && <Toast message={flash.error} type="error" />}
        {flash?.success && <Toast message={flash.success} type="success" />}

        <Card className="w-full max-w-md" padding="lg">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-bg-subtle rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-5 h-5 text-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-[22px] font-bold text-text tracking-tight">
              Mot de passe oublie ?
            </h1>
            <p className="text-[14px] text-text-secondary mt-2 leading-relaxed">
              Entrez votre adresse email et nous vous enverrons un lien pour reinitialiser votre mot de passe.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Adresse email"
              id="email"
              type="email"
              value={form.data.email}
              onChange={(e) => form.setData('email', e.target.value)}
              placeholder="votre@email.com"
              error={form.errors.email}
              required
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={form.processing}
            >
              Envoyer le lien
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
