import { Bell } from 'lucide-react'

export function Header() {
  return (
    <header className="h-16 bg-background flex items-center justify-between px-4 relative pwa-safe-area-top">
      {/* Spacer for balance */}
      <div className="w-10" />

      {/* Logo centered */}
      <img
        src="/logo-rectangle.png"
        alt="LE PHARE"
        className="h-10 object-contain"
      />

      {/* Notification bell placeholder (Story 9.2) */}
      <button
        type="button"
        className="w-10 h-10 flex items-center justify-center text-text rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6" />
      </button>
    </header>
  )
}
