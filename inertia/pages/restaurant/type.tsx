import { Head, useForm } from '@inertiajs/react'
import { Button, Card, Input } from '~/components/ui'
import { Check } from 'lucide-react'

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
    city: '',
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    post('/restaurant/type')
  }

  return (
    <>
      <Head title="Type de restaurant" />
      <div className="min-h-screen bg-bg flex flex-col">
        <div className="flex-1 px-5 pt-12 pb-32 max-w-lg mx-auto w-full">
          <img
            src="/logo-rectangle.png"
            alt="LE PHARE"
            className="h-8 mx-auto mb-8 brightness-0 invert"
          />

          <h1 className="text-[22px] font-bold text-text text-center tracking-tight">
            Ton restaurant
          </h1>
          <p className="text-[15px] text-text-secondary text-center mt-2">
            Quel type de restaurant as-tu ?
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="grid grid-cols-2 gap-2.5">
              {restaurantTypes.map((type) => {
                const isSelected = data.type === type.value
                return (
                  <Card
                    key={type.value}
                    variant="interactive"
                    padding="sm"
                    className={`text-center transition-all border-2 ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                    onClick={() => setData('type', type.value)}
                  >
                    <span className="text-[24px] block mb-1.5">{type.icon}</span>
                    <span className="text-[13px] font-medium text-text">{type.label}</span>
                    {isSelected && (
                      <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center mx-auto mt-1.5">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
            {errors.type && (
              <p className="text-[12px] text-error font-medium">{errors.type}</p>
            )}

            <Input
              label="Nom de ton restaurant"
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              error={errors.name}
              placeholder="Ex: Le Petit Bistrot"
            />

            <Input
              label="Ville"
              value={data.city}
              onChange={(e) => setData('city', e.target.value)}
              error={errors.city}
              placeholder="Ex: Lyon, Paris, Bordeaux..."
            />
          </form>
        </div>

        {/* Fixed bottom button */}
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-bg/80 backdrop-blur-lg border-t border-border/50">
          <div className="max-w-lg mx-auto">
            <Button
              variant="primary"
              fullWidth
              loading={processing}
              disabled={!data.type || !data.name || !data.city}
              onClick={handleSubmit}
            >
              Continuer
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
