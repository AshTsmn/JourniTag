import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, UserPlus } from 'lucide-react'

interface FriendsViewProps {
  onBack?: () => void
}

export function FriendsView({ onBack }: FriendsViewProps) {
  return (
    <div className="p-4 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" />
          Friends
        </h2>
        {onBack && (
          <Button variant="outline" size="sm" onClick={onBack}>
            Back
          </Button>
        )}
      </div>

      <Card className="p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Invite friends</h3>
            <p className="text-sm text-muted-foreground">Share trips and explore together.</p>
          </div>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite
          </Button>
        </div>
      </Card>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">No friends yet. Invite someone to get started.</p>
      </div>
    </div>
  )
}


