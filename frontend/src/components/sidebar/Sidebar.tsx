/**
 * Sidebar Component
 * Main left sidebar container that switches between different views
 */

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type SidebarView = 'home' | 'trip-list' | 'trip-detail' | 'location-detail'

interface SidebarProps {
  view: SidebarView
  className?: string
  children: ReactNode
}

export function Sidebar({ view, className, children }: SidebarProps) {
  const isExpanded = view === 'location-detail'

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-background border-r shadow-lg z-[1000] transition-all duration-300 flex flex-col',
        isExpanded ? 'w-[400px]' : 'w-[360px]',
        className
      )}
    >
      {children}
    </aside>
  )
}
