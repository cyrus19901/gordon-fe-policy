"use client"

import type React from "react"
import { useState } from "react"
import { motion } from "framer-motion"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { calculateAdjustedHealthScore, getIndustryRating, getIndustryMultiplier } from "@/lib/deal-utils"
import { EnhancedBookmarkButton } from "./enhanced-bookmark-button"
import { BookmarkCheck } from "lucide-react"
import { useBulkActions } from "@/lib/bulk-actions-context"
import { useSavedDeals } from "@/lib/saved-deals-context"

interface CompanyTableRowProps {
  deal: any
  onSelect: (deal: any) => void
  onBookmarkDeal?: (deal: any) => void
  onIndustryClick?: (industry: string) => void
}

export const CompanyTableRow = ({ deal, onSelect, onBookmarkDeal, onIndustryClick }: CompanyTableRowProps) => {
  const [hoveredDeal, setHoveredDeal] = useState<string | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const { state, dispatch } = useBulkActions()
  const { state: savedDealsState } = useSavedDeals()

  const isSelected = state.selectedDeals.some((d) => d.id === deal.id)
  const someSelected = state.selectedDeals.length > 0
  const isBookmarked = savedDealsState.savedDeals.some((savedDeal) => savedDeal.name === deal.name)

  const handleCheckboxChange = (checked: boolean) => {
    dispatch({ type: "TOGGLE_DEAL_SELECTION", payload: deal })
  }

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const handleRowClick = () => {
    if (state.isSelectionMode) {
      dispatch({ type: "TOGGLE_DEAL_SELECTION", payload: deal })
    } else {
      onSelect(deal)
    }
  }

  const handleIndustryClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log("[v0] Industry clicked in table:", deal.industry)
    onIndustryClick?.(deal.industry)
  }

  const adjustedHealth = calculateAdjustedHealthScore(deal.health, deal.industry)
  const industryRating = getIndustryRating(deal.industry)
  const multiplier = getIndustryMultiplier(deal.industry)
  const hasAdjustment = adjustedHealth !== deal.health

  return (
    <motion.tr
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "group bg-secondary/30 dark:bg-zinc-950/60 hover:bg-secondary/50 dark:hover:bg-zinc-900/60 transition-colors duration-200 cursor-pointer border-b border-border/50 dark:border-white/[0.05] h-10",
        isSelected && "bg-primary/5 hover:bg-primary/10",
      )}
      onClick={handleRowClick}
      onMouseEnter={(e) => {
        setHoveredDeal(deal.id)
        setMousePosition({ x: e.clientX, y: e.clientY })
      }}
      onMouseLeave={() => setHoveredDeal(null)}
      onMouseMove={(e) => {
        if (hoveredDeal === deal.id) {
          setMousePosition({ x: e.clientX, y: e.clientY })
        }
      }}
    >
      <td className="px-4 py-1 pt-2 pl-2 pr-2 w-8">
        <div className="flex items-center justify-center">
          <div
            className={`transition-opacity duration-200 ${
              someSelected || hoveredDeal === deal.id ? "opacity-100" : "opacity-20"
            }`}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={handleCheckboxChange}
              onClick={handleCheckboxClick}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
          </div>
        </div>
      </td>
      <td className="px-4 py-1 w-64">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-secondary group-hover:bg-background rounded-md flex items-center justify-center flex-shrink-0 transition-colors duration-200">
            <span className="text-[10px] font-semibold text-foreground">{deal.ticker}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">{deal.name}</p>
          </div>
          {isBookmarked && <BookmarkCheck className="h-3 w-3 text-green-500 flex-shrink-0" />}
        </div>
      </td>
      <td className="px-4 py-1 w-32">
        <div
          className="flex items-center space-x-2 cursor-pointer hover:opacity-70 transition-opacity"
          onClick={handleIndustryClick}
        >
          <span className="text-[10px] text-muted-foreground truncate whitespace-nowrap">{deal.industry}</span>
        </div>
      </td>
      <td className="px-4 py-1 w-40">
        <span className="text-[10px] text-muted-foreground truncate block max-w-[150px]">{deal.description}</span>
      </td>
      <td className="px-4 py-1 w-24">
        <span className="text-[10px] text-muted-foreground truncate">{deal.revenue}</span>
      </td>
      <td className="px-4 py-1 w-20">
        <span className="text-[10px] text-muted-foreground truncate">{deal.employees}</span>
      </td>
      <td className="px-4 py-1 w-32">
        <span className="text-[10px] text-muted-foreground truncate">{deal.location}</span>
      </td>
      <td className="px-4 py-1 w-20">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <EnhancedBookmarkButton
            deal={deal}
            onSave={onBookmarkDeal}
            className="relative z-10"
            showQuickActions={true}
          />
        </div>
      </td>
    </motion.tr>
  )
}
