import { Head, useForm } from '@inertiajs/react'
import { Button, Card, Input } from '~/components/ui'

interface RestaurantType {
  value: string
  label: string
  icon: string
}

interface Props {
  restaurantTypes: RestaurantType[]
}

export default function RestaurantType({ restaurantTypes }: Props) {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    type: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    post('/restaurant/type')
  }

  return (
    <>
      <Head title="Type de restaurant" />
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <img
            src="/logo-rectangle.png"
            alt="LE PHARE"
            className="h-10 mx-auto mb-6"
          />

          <h1 className="text-2xl font-bold text-center uppercase mb-2">
            Votre restaurant
          </h1>
          <p className="text-center text-gray-600 mb-6">
            Quel type de restaurant avez-vous ?
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              {restaurantTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setData('type', type.value)}
                  className={`p-4 rounded-xl border-2 transition-all bg-white ${
                    data.type === type.value
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 hover:border-primary/50'
                  }`}
                >
                  <span className="text-3xl block mb-2">{type.icon}</span>
                  <span className="font-medium">{type.label}</span>
                </button>
              ))}
            </div>
            {errors.type && (
              <p className="text-sm text-red-600">{errors.type}</p>
            )}

            <Input
              label="Nom de votre restaurant"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              error={errors.name}
              placeholder="Ex: Le Petit Bistrot"
            />

            <Button
              type="submit"
              disabled={processing || !data.type || !data.name}
              className="w-full"
            >
              Continuer
            </Button>
          </form>
        </div>
      </div>
    </>
  )
}
