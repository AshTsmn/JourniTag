/**
 * TagPill Component
 * Display and select tags (Cultural, Local eats, etc.)
 */

import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TagPillProps {
  tag: string
  selected?: boolean
  onToggle?: (tag: string) => void
  removable?: boolean
  variant?: 'default' | 'secondary' | 'outline'
}

export function TagPill({ tag, selected = false, onToggle, removable = false, variant = 'secondary' }: TagPillProps) {
  return (
    <Badge
      variant={selected ? 'default' : variant}
      className={cn(
        'cursor-pointer transition-all hover:scale-105',
        selected && 'bg-primary text-primary-foreground',
        !selected && 'bg-muted text-muted-foreground hover:bg-muted/80',
        'px-3 py-1 text-sm font-medium'
      )}
      onClick={() => onToggle?.(tag)}
    >
      {tag}
      {removable && selected && (
        <X className="ml-1 w-3 h-3 inline-block" />
      )}
    </Badge>
  )
}

interface TagSelectorProps {
  availableTags: string[]
  selectedTags: string[]
  onTagToggle: (tag: string) => void
  maxTags?: number
}

export function TagSelector({ availableTags, selectedTags, onTagToggle, maxTags }: TagSelectorProps) {
  const canAddMore = !maxTags || selectedTags.length < maxTags

  const handleToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagToggle(tag)
    } else if (canAddMore) {
      onTagToggle(tag)
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {availableTags.map((tag) => (
        <TagPill
          key={tag}
          tag={tag}
          selected={selectedTags.includes(tag)}
          onToggle={handleToggle}
          removable
        />
      ))}
    </div>
  )
}
