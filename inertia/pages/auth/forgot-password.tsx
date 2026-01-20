import { Head, useForm, usePage, Link } from '@inertiajs/react'
import { Button } from '~/components/ui/Button'
import { Card } from '~/components/ui/Card'

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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <Card className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold text-neutral-900 uppercase tracking-tight">
              Mot de passe oublie ?
            </h1>
            <p className="text-neutral-600 mt-2">
              Entrez votre adresse email et nous vous enverrons un lien pour reinitialiser votre mot de passe.
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

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-semibold text-neutral-700 mb-2">
                Adresse email
              </label>
              <input
                id="email"
                type="email"
                value={form.data.email}
                onChange={(e) => form.setData('email', e.target.value)}
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="votre@email.com"
                required
              />
              {form.errors.email && (
                <p className="mt-1 text-red-500 text-sm">{form.errors.email}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={form.processing}
              className="w-full"
            >
              {form.processing ? 'Envoi en cours...' : 'Envoyer le lien'}
            </Button>
          </form>

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
