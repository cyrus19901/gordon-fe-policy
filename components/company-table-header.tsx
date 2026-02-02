"use client"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { useBulkActions } from "@/lib/bulk-actions-context"

interface CompanyTableHeaderProps {
  deals?: any[]
}

export const CompanyTableHeader = ({ deals = [] }: CompanyTableHeaderProps) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)
  const { state, dispatch } = useBulkActions()

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const allSelected =
    deals.length > 0 && deals.every((deal) => state.selectedDeals.some((selected) => selected.id === deal.id))
  const someSelected = state.selectedDeals.length > 0
  const hasDeals = deals.length > 0

  const handleSelectAll = () => {
    dispatch({ type: "SELECT_ALL_DEALS", payload: deals })
  }

  return (
    <thead>
      <tr className="border-b border-border/50 dark:border-white/[0.05] dark:border-b-2 bg-secondary/30 dark:bg-zinc-950/60 h-10">
        <th className="px-4 py-3 text-left w-12">
          {hasDeals && (
            <div
              className={`transition-opacity duration-200 px-0 text-center ${
                someSelected ? "opacity-100" : "opacity-20 hover:opacity-60"
              }`}
            >
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected && !allSelected
                }}
                onCheckedChange={handleSelectAll}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
            </div>
          )}
        </th>
        <th className="px-4 py-3 text-left w-64">
          <button
            className="text-xs font-medium text-muted-foreground dark:text-neutral-400 hover:text-foreground transition-colors cursor-pointer"
            onClick={() => handleSort("name")}
          >
            <div className="flex items-center space-x-2 px-0">
              <span className="text-xs">
                Company {sortConfig?.key === "name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
              </span>
              <span className="text-[10px] text-muted-foreground dark:text-neutral-400 whitespace-nowrap font-medium bg-secondary dark:bg-zinc-800 px-2 py-1 rounded-xl">
                {deals.length}
              </span>
            </div>
          </button>
        </th>
        <th className="px-4 py-3 text-left w-32">
          <button
            className="text-xs font-medium text-muted-foreground dark:text-neutral-400 hover:text-foreground transition-colors cursor-pointer whitespace-nowrap"
            onClick={() => handleSort("industry")}
          >
            Industry {sortConfig?.key === "industry" && (sortConfig.direction === "asc" ? "↑" : "↓")}
          </button>
        </th>
        <th className="px-4 py-3 text-left w-40">
          <button
            className="text-xs font-medium text-muted-foreground dark:text-neutral-400 hover:text-foreground transition-colors cursor-pointer"
            onClick={() => handleSort("description")}
          >
            Description {sortConfig?.key === "description" && (sortConfig.direction === "asc" ? "↑" : "↓")}
          </button>
        </th>
        <th className="px-4 py-3 text-left w-24">
          <button
            className="text-xs font-medium text-muted-foreground dark:text-neutral-400 hover:text-foreground transition-colors cursor-pointer"
            onClick={() => handleSort("revenue")}
          >
            Revenue {sortConfig?.key === "revenue" && (sortConfig.direction === "asc" ? "↑" : "↓")}
          </button>
        </th>
        <th className="px-4 py-3 text-left w-20">
          <button
            className="text-xs font-medium text-muted-foreground dark:text-neutral-400 hover:text-foreground transition-colors cursor-pointer relative group"
            onClick={() => handleSort("founded")}
          >
            Employees {sortConfig?.key === "founded" && (sortConfig.direction === "asc" ? "↑" : "↓")}
          </button>
        </th>
        <th className="px-4 py-3 text-left w-32">
          <button
            className="text-xs font-medium text-muted-foreground dark:text-neutral-400 hover:text-foreground transition-colors cursor-pointer"
            onClick={() => handleSort("location")}
          >
            Location {sortConfig?.key === "location" && (sortConfig.direction === "asc" ? "↑" : "↓")}
          </button>
        </th>
        <th className="px-4 py-3 text-left w-20">{/* Empty header for action button column */}</th>
      </tr>
    </thead>
  )
}
