import { Head, useForm, Link } from '@inertiajs/react'
import { Button, Input, Card } from '~/components/ui'

export default function Register() {
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <img
            src="/logo-rectangle.png"
            alt="LE PHARE"
            className="h-12 mx-auto mb-8"
          />
          <h1 className="text-2xl font-bold text-center uppercase mb-6">
            Créer un compte
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              label="Confirmer le mot de passe"
              value={data.password_confirmation}
              onChange={(e) => setData('password_confirmation', e.target.value)}
              error={errors.password_confirmation}
              placeholder="Répétez le mot de passe"
            />
            <Button type="submit" disabled={processing} className="w-full">
              {processing ? 'Inscription...' : "S'inscrire"}
            </Button>
          </form>

          <p className="text-center mt-4 text-sm">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-primary font-bold">
              Se connecter
            </Link>
          </p>
        </Card>
      </div>
    </>
  )
}
