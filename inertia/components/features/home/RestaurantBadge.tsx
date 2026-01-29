interface RestaurantBadgeProps {
  restaurantName: string
}

export function RestaurantBadge({ restaurantName }: RestaurantBadgeProps) {
  return (
    <div className="inline-flex items-center bg-text text-white px-4 py-2 rounded-full">
      <span className="font-medium text-sm truncate max-w-[150px]">{restaurantName}</span>
    </div>
  )
}
