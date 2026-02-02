"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { ChevronDown, X, Building, MapPin, DollarSign, TrendingUp, Users, Calendar, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { SaveQueryButton } from "./save-query-button"
import { useBulkActions } from "@/lib/bulk-actions-context"

interface FilterOption {
  id: string
  label: string
  value: any
  count?: number
  color?: string
}

interface FilterGroup {
  id: string
  label: string
  icon: React.ComponentType<any>
  type: "select" | "multiselect" | "range" | "search"
  options?: FilterOption[]
  placeholder?: string
  min?: number
  max?: number
  step?: number
  unit?: string
}

const filterGroups: FilterGroup[] = [
  {
    id: "industry",
    label: "Industry",
    icon: Building,
    type: "multiselect",
    options: [
      { id: "saas", label: "SaaS", value: "SaaS", count: 45, color: "blue" },
      { id: "manufacturing", label: "Manufacturing", value: "Manufacturing", count: 32, color: "gray" },
      { id: "healthcare", label: "Healthcare", value: "Healthcare", count: 28, color: "green" },
      { id: "retail", label: "Retail", value: "Retail", count: 21, color: "purple" },
      { id: "technology", label: "Technology", value: "Technology", count: 38, color: "indigo" },
      { id: "financial", label: "Financial Services", value: "Financial Services", count: 15, color: "yellow" },
    ],
  },
  {
    id: "location",
    label: "Location",
    icon: MapPin,
    type: "multiselect",
    options: [
      { id: "austin", label: "Austin, TX", value: "Austin, TX", count: 12 },
      { id: "detroit", label: "Detroit, MI", value: "Detroit, MI", count: 8 },
      { id: "boston", label: "Boston, MA", value: "Boston, MA", count: 15 },
      { id: "la", label: "Los Angeles, CA", value: "Los Angeles, CA", count: 10 },
      { id: "ny", label: "New York, NY", value: "New York, NY", count: 18 },
      { id: "chicago", label: "Chicago, IL", value: "Chicago, IL", count: 9 },
    ],
  },
  {
    id: "revenue",
    label: "Revenue",
    icon: DollarSign,
    type: "range",
    min: 0,
    max: 100,
    step: 5,
    unit: "M",
  },
  {
    id: "employees",
    label: "Employees",
    icon: Users,
    type: "range",
    min: 0,
    max: 1000,
    step: 50,
    unit: "",
  },
  {
    id: "founded",
    label: "Founded",
    icon: Calendar,
    type: "range",
    min: 1990,
    max: 2024,
    step: 1,
    unit: "",
  },
  {
    id: "peRollupScore",
    label: "PE Rollup Score",
    icon: TrendingUp,
    type: "multiselect",
    options: [
      { id: "high", label: "High", value: "High", count: 18, color: "green" },
      { id: "medium", label: "Medium", value: "Medium", count: 24, color: "yellow" },
      { id: "low", label: "Low", value: "Low", count: 12, color: "gray" },
    ],
  },
]

interface LinearStyleFiltersProps {
  onFiltersChange: (filters: any) => void
  activeFilters: any
  className?: string
  resultCount?: number
  onOpenSearchHistory?: () => void
  onSearchExpand?: () => void
}

export function LinearStyleFilters({
  onFiltersChange,
  activeFilters,
  className,
  resultCount,
  onOpenSearchHistory,
  onSearchExpand,
}: LinearStyleFiltersProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState(activeFilters?.searchQuery || "")
  const [filters, setFilters] = useState(activeFilters || {})
  const [dropdownSearchQueries, setDropdownSearchQueries] = useState<{ [key: string]: string }>({})
  const dropdownRefs = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const { state, dispatch } = useBulkActions()

  useEffect(() => {
    console.log("[v0] LinearStyleFilters activeFilters changed:", activeFilters)
    if (activeFilters) {
      setFilters(activeFilters)
      setSearchQuery(activeFilters.searchQuery || "")
      console.log("[v0] Updated searchQuery to:", activeFilters.searchQuery || "")
      console.log("[v0] Input field should now show:", activeFilters.searchQuery || "")
    } else if (activeFilters === null) {
      setFilters({})
      setSearchQuery("")
      console.log("[v0] Cleared all filters and search query due to null activeFilters")
    }
  }, [activeFilters])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && dropdownRefs.current[openDropdown]) {
        const dropdown = dropdownRefs.current[openDropdown]
        if (dropdown && !dropdown.contains(event.target as Node)) {
          setOpenDropdown(null)
          setDropdownSearchQueries((prev) => ({ ...prev, [openDropdown]: "" }))
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [openDropdown])

  const syncFiltersToNaturalLanguage = (currentFilters: any) => {
    const parts: string[] = []

    // Add industry filters
    if (currentFilters.industry && currentFilters.industry.length > 0) {
      if (currentFilters.industry.length === 1) {
        parts.push(`${currentFilters.industry[0]} companies`)
      } else {
        parts.push(`${currentFilters.industry.join(", ")} companies`)
      }
    }

    // Add location filters
    if (currentFilters.location && currentFilters.location.length > 0) {
      if (currentFilters.location.length === 1) {
        parts.push(`in ${currentFilters.location[0]}`)
      } else {
        parts.push(`in ${currentFilters.location.join(", ")}`)
      }
    }

    // Add revenue filters
    if (
      currentFilters.revenue &&
      (currentFilters.revenue.min !== undefined || currentFilters.revenue.max !== undefined)
    ) {
      const { min, max } = currentFilters.revenue
      if (min !== undefined && max !== undefined) {
        parts.push(`with revenue ${min}M-${max}M`)
      } else if (min !== undefined) {
        parts.push(`with revenue > ${min}M`)
      } else if (max !== undefined) {
        parts.push(`with revenue < ${max}M`)
      }
    }

    // Add employee filters
    if (
      currentFilters.employees &&
      (currentFilters.employees.min !== undefined || currentFilters.employees.max !== undefined)
    ) {
      const { min, max } = currentFilters.employees
      if (min !== undefined && max !== undefined) {
        parts.push(`with ${min}-${max} employees`)
      } else if (min !== undefined) {
        parts.push(`with > ${min} employees`)
      } else if (max !== undefined) {
        parts.push(`with < ${max} employees`)
      }
    }

    // Add founded filters
    if (
      currentFilters.founded &&
      (currentFilters.founded.min !== undefined || currentFilters.founded.max !== undefined)
    ) {
      const { min, max } = currentFilters.founded
      if (min !== undefined && max !== undefined) {
        parts.push(`founded ${min}-${max}`)
      } else if (min !== undefined) {
        parts.push(`founded after ${min}`)
      } else if (max !== undefined) {
        parts.push(`founded before ${max}`)
      }
    }

    if (currentFilters.peRollupScore && currentFilters.peRollupScore.length > 0) {
      if (currentFilters.peRollupScore.length === 1) {
        parts.push(`with ${currentFilters.peRollupScore[0]} PE rollup score`)
      } else {
        parts.push(`with ${currentFilters.peRollupScore.join(", ")} PE rollup score`)
      }
    }

    const naturalLanguageQuery = parts.join(" ")
    console.log(`[v0] Syncing filters to natural language: ${naturalLanguageQuery}`)
    return naturalLanguageQuery
  }

  const handleFilterChange = (groupId: string, value: any) => {
    const newFilters = { ...filters, [groupId]: value }
    setFilters(newFilters)

    const naturalLanguageQuery = syncFiltersToNaturalLanguage(newFilters)
    setSearchQuery(naturalLanguageQuery)

    onFiltersChange({ ...newFilters, searchQuery: naturalLanguageQuery })
  }

  const handleSearchChange = (query: string) => {
    setSearchQuery(query)
    onFiltersChange({ ...filters, searchQuery: query })
  }

  const handleFiltersFromNaturalLanguage = (extractedFilters: any) => {
    const newFilters = { ...filters, ...extractedFilters }
    setFilters(newFilters)
    onFiltersChange({ ...newFilters, searchQuery })
  }

  const clearFilter = (groupId: string) => {
    const newFilters = { ...filters }
    delete newFilters[groupId]

    const hasRemainingFilters = Object.keys(newFilters).some((key) => {
      const value = newFilters[key]
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === "object" && value !== null) {
        return value.min !== undefined || value.max !== undefined
      }
      return Boolean(value)
    })

    const updatedSearchQuery = hasRemainingFilters ? syncFiltersToNaturalLanguage(newFilters) : ""

    setFilters(newFilters)
    setSearchQuery(updatedSearchQuery)

    onFiltersChange({ ...newFilters, searchQuery: updatedSearchQuery })
  }

  const clearAllFilters = () => {
    setFilters({})
    setSearchQuery("")
    onFiltersChange({}) // Don't include searchQuery in the cleared filters
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (searchQuery.trim()) count++
    Object.keys(filters).forEach((key) => {
      const value = filters[key]
      if (Array.isArray(value) && value.length > 0) count++
      else if (value && typeof value === "object" && (value.min !== undefined || value.max !== undefined)) count++
      else if (value) count++
    })
    return count
  }

  const renderFilterButton = (group: FilterGroup) => {
    const filterValue = filters[group.id]
    let hasActiveFilter = false

    if (filterValue) {
      if (Array.isArray(filterValue)) {
        hasActiveFilter = filterValue.length > 0
      } else if (typeof filterValue === "object") {
        hasActiveFilter = filterValue.min !== undefined || filterValue.max !== undefined
      } else {
        hasActiveFilter = Boolean(filterValue)
      }
    }

    const Icon = group.icon

    let displayValue = ""
    if (hasActiveFilter) {
      if (Array.isArray(filterValue)) {
        displayValue = filterValue.length === 1 ? filterValue[0] : `${filterValue.length} selected`
      } else if (typeof filterValue === "object") {
        const { min, max } = filterValue
        if (min !== undefined && max !== undefined) {
          displayValue = `${min}-${max}${group.unit || ""}`
        }
      } else {
        displayValue = filterValue.toString()
      }
    }

    const dropdownSearchQuery = dropdownSearchQueries[group.id] || ""
    const filteredOptions = group.options?.filter((option) =>
      option.label.toLowerCase().includes(dropdownSearchQuery.toLowerCase()),
    )

    return (
      <div key={group.id} className="relative" ref={(el) => (dropdownRefs.current[group.id] = el)}>
        <Button
          variant={hasActiveFilter ? "default" : "outline"}
          size="sm"
          onClick={() => setOpenDropdown(openDropdown === group.id ? null : group.id)}
          className={cn(
            "h-8 px-3 text-xs font-medium transition-all duration-200",
            hasActiveFilter
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-background hover:bg-secondary border-border/60 hover:border-border",
          )}
        >
          <Icon className="h-3 w-3 mr-1.5" />
          <span>{hasActiveFilter ? displayValue : group.label}</span>
          <ChevronDown
            className={cn(
              "h-3 w-3 ml-1.5 transition-transform duration-200",
              openDropdown === group.id && "rotate-180",
            )}
          />
          {hasActiveFilter && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                clearFilter(group.id)
              }}
              className="ml-1.5 hover:bg-primary-foreground/20 rounded-full p-0.5 transition-colors"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          )}
        </Button>

        <AnimatePresence>
          {openDropdown === group.id && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
              className="absolute top-full left-0 mt-2 w-64 bg-background border border-border rounded-lg shadow-lg z-[100] overflow-hidden"
            >
              {group.type === "multiselect" && (
                <div className="flex flex-col max-h-80">
                  <div className="p-3 pb-2 border-b border-border">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                      <Input
                        placeholder={`Search ${group.label.toLowerCase()}...`}
                        value={dropdownSearchQuery}
                        onChange={(e) => setDropdownSearchQueries((prev) => ({ ...prev, [group.id]: e.target.value }))}
                        className="h-8 text-xs pl-8"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="p-3 space-y-2 overflow-y-auto flex-1">
                    {filteredOptions && filteredOptions.length > 0 ? (
                      filteredOptions.map((option) => {
                        const isSelected = filters[group.id]?.includes(option.value)
                        return (
                          <button
                            key={option.id}
                            onClick={() => {
                              const currentValues = filters[group.id] || []
                              const newValues = isSelected
                                ? currentValues.filter((v: any) => v !== option.value)
                                : [...currentValues, option.value]
                              handleFilterChange(group.id, newValues)
                            }}
                            className={cn(
                              "w-full flex items-center justify-between p-2 rounded-md text-sm transition-colors",
                              isSelected
                                ? "bg-primary/10 text-primary font-medium"
                                : "hover:bg-secondary text-foreground",
                            )}
                          >
                            <div className="flex items-center space-x-2">
                              {option.color && (
                                <div
                                  className={cn("w-2 h-2 rounded-full", `bg-${option.color}-500`)}
                                  style={{ backgroundColor: `var(--${option.color}-500, #6b7280)` }}
                                />
                              )}
                              <span>{option.label}</span>
                            </div>
                            {option.count && (
                              <Badge variant="secondary" className="text-xs">
                                {option.count}
                              </Badge>
                            )}
                          </button>
                        )
                      })
                    ) : (
                      <div className="text-center py-6 text-sm text-muted-foreground">
                        No {group.label.toLowerCase()} found
                      </div>
                    )}
                  </div>
                </div>
              )}

              {group.type === "range" && (
                <div className="p-4 space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      placeholder={`Min ${group.unit || ""}`}
                      value={filters[group.id]?.min || ""}
                      onChange={(e) => {
                        const value = e.target.value ? Number(e.target.value) : undefined
                        handleFilterChange(group.id, { ...filters[group.id], min: value })
                      }}
                      className="h-8 text-xs"
                    />
                    <span className="text-muted-foreground">to</span>
                    <Input
                      type="number"
                      placeholder={`Max ${group.unit || ""}`}
                      value={filters[group.id]?.max || ""}
                      onChange={(e) => {
                        const value = e.target.value ? Number(e.target.value) : undefined
                        handleFilterChange(group.id, { ...filters[group.id], max: value })
                      }}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {group.min}
                      {group.unit}
                    </span>
                    <span>
                      {group.max}
                      {group.unit}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Search Bar */}
      <div className="relative">
        {console.log("[v0] Rendering Input with value:", searchQuery)}
        <Input
          placeholder="Search companies, industries, or keywords..."
          className="pl-10 h-9 text-sm bg-background border-border/60 focus:border-primary"
          enableNaturalLanguageSearch={true}
          onSearchSubmit={(query) => handleSearchChange(query)}
          searchPlaceholder="Describe companies you're looking for..."
          onFiltersExtracted={handleFiltersFromNaturalLanguage}
          activeFilters={filters}
          value={searchQuery || undefined}
          onChange={(e) => setSearchQuery(e.target.value)}
          onOpenSearchHistory={onOpenSearchHistory}
          onSearchExpand={onSearchExpand}
        />
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center space-x-2 flex-wrap gap-y-2 justify-start mx-0 px-0">
        {filterGroups.map(renderFilterButton)}

        {getActiveFilterCount() > 0 && (
          <>
            <Separator orientation="vertical" className="h-6" />
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3 mr-1" />
              Clear all ({getActiveFilterCount()})
            </Button>

            <SaveQueryButton searchQuery={searchQuery} filters={filters} resultCount={resultCount} className="ml-2" />
          </>
        )}
      </div>
    </div>
  )
}
