import { useState } from 'react'
import { Bell, X } from 'lucide-react'

export function Header() {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)

  return (
    <>
      <header className="h-20 bg-background flex items-center justify-between px-4 relative pwa-safe-area-top">
        {/* Logo left-aligned */}
        <img
          src="/logo-rectangle.png"
          alt="LE PHARE"
          className="h-12 object-contain"
        />

        {/* Notification bell - opens popup */}
        <button
          type="button"
          onClick={() => setIsNotificationsOpen(true)}
          className="w-10 h-10 flex items-center justify-center text-text rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          aria-label="Notifications"
        >
          <Bell className="w-6 h-6" />
        </button>
      </header>

      {/* Notifications Modal */}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setIsNotificationsOpen(false)}
          />

          {/* Modal content */}
          <div className="relative bg-white rounded-2xl shadow-xl mx-4 w-full max-w-sm animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-neutral-100">
              <h2 className="text-lg font-bold text-neutral-900">Notifications</h2>
              <button
                type="button"
                onClick={() => setIsNotificationsOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-neutral-500 hover:text-neutral-700 rounded-full hover:bg-neutral-100"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Empty state */}
            <div className="p-6 text-center">
              <div className="w-14 h-14 mx-auto mb-3 bg-neutral-100 rounded-full flex items-center justify-center">
                <Bell className="w-7 h-7 text-neutral-400" />
              </div>
              <p className="text-neutral-900 font-medium mb-1">Aucune notification</p>
              <p className="text-neutral-500 text-sm">
                Tu n'as pas encore de notifications
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
