import { type ReactNode } from 'react'

export interface QuickActionProps {
  icon: ReactNode
  label: string
  onClick?: () => void
  className?: string
}

export function QuickAction({ icon, label, onClick, className = '' }: QuickActionProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center justify-center
        w-14 h-14 rounded-xl
        bg-bg-card shadow-card
        active:scale-95 transition-transform duration-150
        ${className}
      `}
    >
      <div className="text-text [&_svg]:w-5 [&_svg]:h-5">
        {icon}
      </div>
      <span className="text-[10px] text-text-muted font-medium mt-1 leading-none">
        {label}
      </span>
    </button>
  )
}

export interface QuickActionBarProps {
  actions: QuickActionProps[]
  className?: string
}

export function QuickActionBar({ actions, className = '' }: QuickActionBarProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {actions.map((action, i) => (
        <QuickAction key={i} {...action} />
      ))}
    </div>
  )
}

/*
 * Usage:
 *
 * import { Camera, BarChart3, BookOpen, Calendar } from 'lucide-react'
 *
 * <QuickAction
 *   icon={<Camera />}
 *   label="Photo"
 *   onClick={() => router.visit('/publications/photo')}
 * />
 *
 * <QuickActionBar
 *   actions={[
 *     { icon: <Camera />, label: 'Photo', onClick: () => {} },
 *     { icon: <BarChart3 />, label: 'Stats', onClick: () => {} },
 *     { icon: <BookOpen />, label: 'Tutos', onClick: () => {} },
 *     { icon: <Calendar />, label: 'Agenda', onClick: () => {} },
 *   ]}
 * />
 */
