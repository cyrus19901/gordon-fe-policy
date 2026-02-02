"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { NaturalLanguageSearch } from "./natural-language-search"

const viewMotionVariants = {
  initial: { opacity: 0, y: 20 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2, ease: "easeIn" } },
}

export const SearchFilterView = ({
  onClose,
  onApplyFilters,
  initialFilters,
  onOpenSearchHistory, // Added onOpenSearchHistory prop
}: {
  onClose: () => void
  onApplyFilters: (filters: any) => void
  initialFilters?: any
  onOpenSearchHistory?: () => void // Added onOpenSearchHistory prop type
}) => {
  console.log("[v0] SearchFilterView component mounted with initialFilters:", initialFilters)

  const [searchQuery, setSearchQuery] = useState(initialFilters?.searchQuery || "")
  const [extractedFilters, setExtractedFilters] = useState(initialFilters || {})

  const scrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Scroll to top when component mounts - use a slight delay to ensure DOM is ready
    const scrollToTop = () => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: "instant" })
      }
    }

    // Try immediately and also with a small delay to ensure DOM is fully rendered
    scrollToTop()
    const timeoutId = setTimeout(scrollToTop, 50)

    return () => clearTimeout(timeoutId)
  }, [])

  const handleApplyFilters = () => {
    const filters = {
      searchQuery: searchQuery,
      ...extractedFilters,
    }

    // Check if any filters are actually set (non-default values)
    const hasActiveFilters = (searchQuery && searchQuery.trim()) || Object.keys(extractedFilters).length > 0

    // Only pass filters if there are active ones, otherwise pass null to reset
    onApplyFilters(hasActiveFilters ? filters : null)
  }

  const handleClearAll = () => {
    setSearchQuery("")
    setExtractedFilters({})
  }

  const handleFiltersExtracted = (filters: any) => {
    setExtractedFilters(filters)
  }

  return (
    <motion.div
      key="search-filter"
      variants={viewMotionVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className="w-full flex flex-col h-full bg-background"
    >
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-6" style={{ scrollBehavior: "auto" }}>
        <div>
          <NaturalLanguageSearch
            value={searchQuery}
            onChange={setSearchQuery}
            onSubmit={handleApplyFilters}
            placeholder="Describe the deals you're looking for..."
            onFiltersExtracted={handleFiltersExtracted}
            activeFilters={extractedFilters}
            onOpenSearchHistory={onOpenSearchHistory} // Pass onOpenSearchHistory to NaturalLanguageSearch
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-4 border-t border-border flex-shrink-0">
        <Button variant="ghost" onClick={handleClearAll}>
          Clear All
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleApplyFilters}>Apply Filters</Button>
        </div>
      </div>
    </motion.div>
  )
}
