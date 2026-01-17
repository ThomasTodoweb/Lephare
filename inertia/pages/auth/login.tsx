import { Head, useForm, Link, usePage } from '@inertiajs/react'
import { Button, Input, Card } from '~/components/ui'

interface PageProps {
  errors?: {
    email?: string
  }
  flash?: {
    success?: string
  }
}

export default function Login() {
  const { errors: flashErrors, flash } = usePage<PageProps>().props
  const { data, setData, post, processing, errors } = useForm({
    email: '',
    password: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    post('/login')
  }

  const emailError = errors.email || flashErrors?.email

  return (
    <>
      <Head title="Connexion" />
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <img
            src="/logo-rectangle.png"
            alt="LE PHARE"
            className="h-12 mx-auto mb-8"
          />
          <h1 className="text-2xl font-bold text-center uppercase mb-6">
            Connexion
          </h1>

          {flash?.success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl mb-4">
              {flash.success}
            </div>
          )}

          {emailError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4">
              {emailError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              label="Email"
              value={data.email}
              onChange={(e) => setData('email', e.target.value)}
              placeholder="votre@email.com"
            />
            <Input
              type="password"
              label="Mot de passe"
              value={data.password}
              onChange={(e) => setData('password', e.target.value)}
              error={errors.password}
              placeholder="Votre mot de passe"
            />
            <Button type="submit" disabled={processing} className="w-full">
              {processing ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <p className="text-center mt-4 text-sm">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-primary font-bold">
              Créer un compte
            </Link>
          </p>
        </Card>
      </div>
    </>
  )
}
