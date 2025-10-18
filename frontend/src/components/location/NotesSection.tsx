/**
 * NotesSection Component
 * Display and edit categorized notes
 */

import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

interface NotesSectionProps {
  notes: string
  onChange?: (notes: string) => void
  readonly?: boolean
}

export function NotesSection({ notes, onChange, readonly = false }: NotesSectionProps) {
  // Parse notes into categories (e.g., "For the Temple:", "For the Sushi:")
  const parseNotes = (notesText: string) => {
    const lines = notesText.split('\n')
    const categories: { category: string; text: string }[] = []
    let currentCategory = ''
    let currentText = ''

    lines.forEach((line) => {
      const categoryMatch = line.match(/^For the (.+?):(.*)$/)
      if (categoryMatch) {
        if (currentCategory) {
          categories.push({ category: currentCategory, text: currentText.trim() })
        }
        currentCategory = categoryMatch[1]
        currentText = categoryMatch[2] ? categoryMatch[2].trim() : ''
      } else if (currentCategory) {
        currentText += (currentText ? ' ' : '') + line.trim()
      } else {
        currentText += (currentText ? '\n' : '') + line
      }
    })

    if (currentCategory) {
      categories.push({ category: currentCategory, text: currentText.trim() })
    } else if (currentText) {
      categories.push({ category: '', text: currentText.trim() })
    }

    return categories
  }

  const parsedNotes = parseNotes(notes)

  if (readonly) {
    return (
      <div className="space-y-3">
        <Label className="text-base font-semibold">What you should know</Label>
        <div className="space-y-3">
          {parsedNotes.map((note, index) => (
            <div key={index} className="text-sm">
              {note.category && (
                <p className="font-medium text-foreground">
                  For the {note.category}:{' '}
                </p>
              )}
              <p className="text-muted-foreground italic">"{note.text}"</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Label htmlFor="notes" className="text-base font-semibold">
        What you should know
      </Label>
      <Textarea
        id="notes"
        value={notes}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder="Add notes about this location..."
        className="min-h-[120px] resize-none"
        disabled={readonly}
      />
      <p className="text-xs text-muted-foreground">
        Tip: Use "For the [Thing]: [Note]" format for categorized notes
      </p>
    </div>
  )
}
