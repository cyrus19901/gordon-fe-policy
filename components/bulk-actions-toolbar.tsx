"use client"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Mail, Bookmark, Download, X, Users, Trash2 } from "lucide-react"
import { useBulkActions } from "@/lib/bulk-actions-context"
import { cn } from "@/lib/utils"

interface BulkActionsToolbarProps {
  onBulkEmail: () => void
  onBulkSave: () => void
  onBulkExport: () => void
  isWatchlistContext?: boolean
  className?: string
}

export function BulkActionsToolbar({
  onBulkEmail,
  onBulkSave,
  onBulkExport,
  isWatchlistContext = false,
  className,
}: BulkActionsToolbarProps) {
  const { state, dispatch } = useBulkActions()
  const selectedCount = state.selectedDeals.length

  if (!state.isSelectionMode && selectedCount === 0) {
    return null
  }

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className={cn(
            "fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-background border border-border rounded-lg shadow-lg px-4 py-3",
            className,
          )}
        >
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="h-6 px-2">
                <Users className="h-3 w-3 mr-1" />
                {selectedCount}
              </Badge>
              <span className="text-sm font-medium">
                {selectedCount} {selectedCount === 1 ? "deal" : "deals"} selected
              </span>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={onBulkEmail} className="h-8 bg-transparent">
                <Mail className="h-3.5 w-3.5 mr-2" />
                Email
              </Button>

              {isWatchlistContext ? (
                <Button variant="outline" size="sm" onClick={onBulkSave} className="h-8 bg-transparent">
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Remove from watchlist
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={onBulkSave} className="h-8 bg-transparent">
                  <Bookmark className="h-3.5 w-3.5 mr-2" />
                  Add to watchlist
                </Button>
              )}

              <Button variant="outline" size="sm" onClick={onBulkExport} className="h-8 bg-transparent">
                <Download className="h-3.5 w-3.5 mr-2" />
                Export
              </Button>
            </div>

            <Separator orientation="vertical" className="h-6" />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch({ type: "CLEAR_SELECTION" })}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
