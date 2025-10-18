/**
 * CostLevelSelector Component
 * Select cost level: Free, $, $$, $$$
 */

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { CostLevel } from '@/types'
import { COST_LEVELS } from '@/types'

interface CostLevelSelectorProps {
  value: CostLevel
  onChange: (value: CostLevel) => void
  readonly?: boolean
}

export function CostLevelSelector({ value, onChange, readonly = false }: CostLevelSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {COST_LEVELS.map((level) => (
        <Button
          key={level}
          type="button"
          variant={value === level ? 'default' : 'outline'}
          size="sm"
          onClick={() => !readonly && onChange(level)}
          disabled={readonly}
          className={cn(
            'min-w-[60px] transition-all',
            value === level && 'bg-primary text-primary-foreground',
            !readonly && 'hover:scale-105'
          )}
        >
          {level}
        </Button>
      ))}
    </div>
  )
}
