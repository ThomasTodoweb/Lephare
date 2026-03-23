export interface TimeGreetingProps {
  /** Override the current hour (0-23) for testing */
  hour?: number
  className?: string
}

function getGreeting(hour: number): string {
  if (hour >= 6 && hour < 11) return 'Bonjour ☀️'
  if (hour >= 11 && hour < 14) return 'Bon service ! 🍽'
  if (hour >= 14 && hour < 17) return "Bonne après-midi 👋"
  if (hour >= 17 && hour < 21) return 'Bon service du soir 🌙'
  return 'Bonne soirée ✨'
}

export function TimeGreeting({ hour, className = '' }: TimeGreetingProps) {
  const currentHour = hour ?? new Date().getHours()

  return (
    <p className={`text-[13px] text-text-muted ${className}`}>
      {getGreeting(currentHour)}
    </p>
  )
}

/*
 * Usage:
 *
 * <TimeGreeting />
 * <TimeGreeting hour={8} />   // "Bonjour ☀️"
 * <TimeGreeting hour={12} />  // "Bon service ! 🍽"
 * <TimeGreeting hour={19} />  // "Bon service du soir 🌙"
 */
