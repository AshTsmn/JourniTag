import { Home, Users, Map as MapIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SidebarView } from '@/components/sidebar/Sidebar'

type TabKey = 'home' | 'friends' | 'trip-list'

interface BottomNavProps {
  active: SidebarView | 'friends'
  onChange: (view: TabKey) => void
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  const items: Array<{ key: TabKey; label: string; icon: React.ElementType }> = [
    { key: 'home', label: 'Home', icon: Home },
    { key: 'friends', label: 'Friends', icon: Users },
    { key: 'trip-list', label: 'Trips', icon: MapIcon },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-[1100]">
      <div className="max-w-5xl mx-auto px-4">
        <ul className="flex items-stretch justify-between">
          {items.map(({ key, label, icon: Icon }) => {
            const isActive = active === key
            return (
              <li key={key} className="flex-1">
                <button
                  type="button"
                  onClick={() => onChange(key)}
                  className={cn(
                    'w-full h-14 flex flex-col items-center justify-center gap-1 text-sm transition-colors',
                    isActive ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
                  <span className="leading-none">{label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}

