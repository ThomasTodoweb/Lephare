import { Head, useForm, Link, usePage } from '@inertiajs/react'
import { Button, Input, Toast } from '~/components/ui'

interface PageProps {
  flash?: { error?: string }
}

export default function Register() {
  const { flash } = usePage<PageProps>().props
  const { data, setData, post, processing, errors } = useForm({
    email: '',
    password: '',
    password_confirmation: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    post('/register')
  }

  return (
    <>
      <Head title="Inscription" />
      <div className="min-h-screen bg-bg flex flex-col justify-center px-5 py-12 relative overflow-hidden">
        {/* Subtle radial gradient behind form */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-sm mx-auto relative z-10">
          <img
            src="/logo-rectangle.png"
            alt="LE PHARE"
            className="h-10 mx-auto mb-10 brightness-0 invert"
          />

          <h1 className="text-[22px] font-bold text-text text-center mb-2 tracking-tight">
            Créer un compte
          </h1>
          <p className="text-[13px] text-text-muted text-center mb-8">
            14 jours gratuits, sans engagement
          </p>

          {flash?.error && <Toast message={flash.error} type="error" />}

          {/* Social Login */}
          <a
            href="/auth/google"
            className="flex items-center justify-center gap-3 w-full h-11 bg-white text-neutral-900 border border-white/20 rounded-xl text-[14px] font-semibold active:scale-[0.97] transition-all mb-6"
          >
            <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continuer avec Google
          </a>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-bg text-[12px] text-text-muted font-medium">ou par email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              label="Email"
              value={data.email}
              onChange={(e) => setData('email', e.target.value)}
              error={errors.email}
              placeholder="votre@email.com"
            />
            <Input
              type="password"
              label="Mot de passe"
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              error={errors.password}
              placeholder="Minimum 8 caractères"
            />
            <Input
              type="password"
              label="Confirmer"
              value={data.password_confirmation}
              onChange={(e) => setData('password_confirmation', e.target.value)}
              error={errors.password_confirmation}
              placeholder="Répétez le mot de passe"
            />
            <Button type="submit" disabled={processing} variant="primary" fullWidth className="mt-2">
              {processing ? 'Inscription...' : "S'inscrire"}
            </Button>
          </form>

          <p className="text-center mt-6 text-[13px] text-text-secondary">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-text font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}
