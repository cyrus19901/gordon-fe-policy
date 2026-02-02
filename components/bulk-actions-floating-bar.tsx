"use client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Mail, Bookmark, Download, X, Users } from "lucide-react"
import { useBulkActions } from "@/lib/bulk-actions-context"
import { cn } from "@/lib/utils"

interface BulkActionsFloatingBarProps {
  onBulkEmail: () => void
  onBulkSave: () => void
  onBulkExport: () => void
  className?: string
}

export function BulkActionsFloatingBar({
  onBulkEmail,
  onBulkSave,
  onBulkExport,
  className,
}: BulkActionsFloatingBarProps) {
  const { state, dispatch } = useBulkActions()
  const selectedCount = state.selectedDeals.length

  return (
    <motion.div
      key="bulk-actions"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "w-full h-full flex items-center justify-between px-6 py-4",
        "bg-background/95 backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
          <Users className="h-4 w-4 text-primary" />
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-xs font-medium">
            {selectedCount} selected
          </Badge>
          <span className="text-sm font-medium text-foreground">Bulk Actions</span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onBulkEmail}
          className="h-8 px-3 text-xs bg-transparent hover:bg-secondary/80"
          disabled={selectedCount === 0}
        >
          <Mail className="h-3 w-3 mr-1.5" />
          Email ({selectedCount})
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onBulkSave}
          className="h-8 px-3 text-xs bg-transparent hover:bg-secondary/80"
          disabled={selectedCount === 0}
        >
          <Bookmark className="h-3 w-3 mr-1.5" />
          Save to List
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onBulkExport}
          className="h-8 px-3 text-xs bg-transparent hover:bg-secondary/80"
          disabled={selectedCount === 0}
        >
          <Download className="h-3 w-3 mr-1.5" />
          Export
        </Button>

        <Separator orientation="vertical" className="h-6 mx-2" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => dispatch({ type: "CLEAR_SELECTION" })}
          className="h-8 w-8 p-0 hover:bg-secondary/80"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
    </motion.div>
  )
}
