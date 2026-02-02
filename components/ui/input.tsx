"use client"

import * as React from "react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { NaturalLanguageSearch } from "@/components/natural-language-search"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  enableNaturalLanguageSearch?: boolean
  onSearchSubmit?: (query: string) => void
  searchPlaceholder?: string
  onFiltersExtracted?: (filters: any) => void
  activeFilters?: any
  onOpenSearchHistory?: () => void
  onSearchExpand?: () => void // Added onSearchExpand callback to allow external components to expand the search
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      enableNaturalLanguageSearch,
      onSearchSubmit,
      searchPlaceholder,
      onFiltersExtracted,
      activeFilters,
      onOpenSearchHistory,
      onSearchExpand, // Added onSearchExpand to destructuring
      ...props
    },
    ref,
  ) => {
    const [showNaturalSearch, setShowNaturalSearch] = useState(false)
    const [searchValue, setSearchValue] = useState("")

    if (enableNaturalLanguageSearch) {
      return (
        <div className="relative w-full">
          <NaturalLanguageSearch
            value={searchValue}
            onChange={setSearchValue}
            onSubmit={() => {
              if (onSearchSubmit && searchValue.trim()) {
                onSearchSubmit(searchValue.trim())
              }
            }}
            placeholder={searchPlaceholder || "Ask me anything about deals..."}
            onFiltersExtracted={onFiltersExtracted}
            activeFilters={activeFilters}
            onOpenSearchHistory={onOpenSearchHistory}
            onExpand={onSearchExpand} // Pass onSearchExpand to NaturalLanguageSearch
          />
        </div>
      )
    }

    return (
      <div className="relative w-full">
        <input
          type={type}
          className={cn(
            "flex rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 items-end flex-row justify-end w-full h-9",
            className,
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  },
)
Input.displayName = "Input"

export { Input }
