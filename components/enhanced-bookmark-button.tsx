"use client"
import { Button } from "@/components/ui/button"
import { BookmarkCheck, Bookmark } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSavedDeals } from "@/lib/saved-deals-context"

interface EnhancedBookmarkButtonProps {
  deal: any
  onSave?: (deal: any) => void // Changed from (listId: string) to (deal: any)
  className?: string
  showQuickActions?: boolean
}

export function EnhancedBookmarkButton({
  deal,
  onSave,
  className,
  showQuickActions = true,
}: EnhancedBookmarkButtonProps) {
  const { state } = useSavedDeals()

  const isAlreadySaved = state.savedDeals.some((savedDeal) => savedDeal.name === deal.name)

  if (isAlreadySaved) {
    return (
      <Button variant="outline" size="sm" disabled className={cn("h-8 px-3 text-xs", className)}>
        <BookmarkCheck className="h-3 w-3 mr-1.5 text-green-500" />
        <span className="text-green-600">In Watchlist</span>
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={(e) => {
        e.stopPropagation()
        onSave?.(deal)
      }}
      className={cn("h-8 px-3 text-xs hover:bg-secondary border-border/60 hover:border-border group", className)}
    >
      <Bookmark className="h-3 w-3 mr-1.5 group-hover:fill-current transition-all" />
      Add to watchlist
    </Button>
  )
}
