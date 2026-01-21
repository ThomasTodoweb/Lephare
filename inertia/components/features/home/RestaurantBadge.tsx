interface RestaurantBadgeProps {
  restaurantName: string
  restaurantType: string
}

const RESTAURANT_EMOJIS: Record<string, string> = {
  brasserie: '🍺',
  gastronomique: '⭐',
  fast_food: '🍔',
  pizzeria: '🍕',
  cafe_bar: '☕',
  autre: '🍽️',
}

export function RestaurantBadge({ restaurantName, restaurantType }: RestaurantBadgeProps) {
  const emoji = RESTAURANT_EMOJIS[restaurantType] || RESTAURANT_EMOJIS.autre

  return (
    <div className="inline-flex items-center gap-2 bg-text text-white px-4 py-2 rounded-full">
      <span className="text-lg">{emoji}</span>
      <span className="font-medium text-sm truncate max-w-[120px]">{restaurantName}</span>
    </div>
  )
}
