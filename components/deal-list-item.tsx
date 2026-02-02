"use client"

import type React from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Briefcase, Handshake, BookmarkCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getHealthColor, getStageColor } from "@/lib/deal-utils"
import { useSavedDeals } from "@/lib/saved-deals-context"

interface DealListItemProps {
  deal: any
  onPendingDealClick?: (deal: any) => void
}

export const DealListItem = ({ deal, onPendingDealClick }: DealListItemProps) => {
  const router = useRouter()
  const { state: savedDealsState } = useSavedDeals()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (deal.stage === "Pending LOI") {
      onPendingDealClick?.(deal)
    } else {
      router.push(`/deal/${deal.id}`)
    }
  }

  const getIconBgColor = (stage: string) => {
    switch (stage) {
      case "Due Diligence":
        return "bg-slate-100 group-hover:bg-slate-200"
      case "Pending LOI":
        return "bg-amber-100 group-hover:bg-amber-200"
      case "Closing":
        return "bg-green-100 group-hover:bg-green-200"
      case "Initial Review":
        return "bg-gray-100 group-hover:bg-gray-200"
      case "Sourcing":
        return "bg-neutral-100 group-hover:bg-neutral-200"
      default:
        return "bg-gray-100 group-hover:bg-gray-200"
    }
  }

  const isPendingLOI = deal.stage === "Pending LOI"
  const isBookmarked = savedDealsState.savedDeals.some((savedDeal) => savedDeal.name === deal.name)

  return (
    <div className="block" onClick={handleClick}>
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex items-center px-4 rounded-lg group hover:bg-secondary transition-colors duration-200 leading-7 justify-between py-4 cursor-pointer"
      >
        <div className="flex items-center space-x-4 min-w-0 flex-1">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200",
              getIconBgColor(deal.stage),
            )}
          >
            {deal.type === "buy" ? (
              <Briefcase className="h-5 w-5 text-gray-600" />
            ) : (
              <Handshake className="h-5 w-5 text-gray-600" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-gray-800 text-sm font-semibold truncate">{deal.name}</p>
            <p className="text-xs text-gray-400 truncate">{deal.lastActivity}</p>
            {isBookmarked && <BookmarkCheck className="h-3 w-3 text-green-500 flex-shrink-0 ml-2" />}
          </div>
        </div>
        <div className="flex items-center space-x-3 flex-shrink-0">
          <Badge
            variant="outline"
            className={cn("capitalize text-xs font-medium whitespace-nowrap", getStageColor(deal.stage))}
          >
            {deal.stage}
          </Badge>
          {!isPendingLOI && (
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${getHealthColor(deal.health)}`} />
              <p className="text-xs text-muted-foreground whitespace-nowrap">{deal.health}%</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
