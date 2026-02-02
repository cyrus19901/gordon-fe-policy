"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Search, X, History, Sparkles } from "lucide-react"
import { motion } from "framer-motion"

interface NaturalLanguageSearchProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  placeholder?: string
  onFiltersExtracted?: (filters: any) => void
  activeFilters?: any
  onOpenSearchHistory?: () => void // Added callback to open search history
  onExpand?: () => void // Added onExpand callback to allow external components to expand the search
}

const parseNaturalLanguageToFiltersLocal = (query: string): any => {
  const filters: any = {}
  const queryLower = query.toLowerCase()

  // Industry extraction
  const industries = ["saas", "manufacturing", "healthcare", "retail", "technology", "financial services"]
  const foundIndustries = industries.filter(
    (industry) =>
      queryLower.includes(industry.toLowerCase()) ||
      (industry === "financial services" && (queryLower.includes("financial") || queryLower.includes("fintech"))),
  )
  if (foundIndustries.length > 0) {
    filters.industry = foundIndustries.map((ind) =>
      ind === "financial services" ? "Financial Services" : ind.charAt(0).toUpperCase() + ind.slice(1),
    )
  }

  // Location extraction with Midwest, West Coast, East Coast support
  if (queryLower.includes("midwest")) {
    filters.location = [
      "Chicago, IL",
      "Detroit, MI",
      "Cleveland, OH",
      "Milwaukee, WI",
      "Indianapolis, IN",
      "Kansas City, MO",
      "St. Louis, MO",
      "Minneapolis, MN",
    ]
  } else if (queryLower.includes("west coast")) {
    filters.location = ["Los Angeles, CA", "San Francisco, CA", "Seattle, WA", "Portland, OR", "San Diego, CA"]
  } else if (queryLower.includes("east coast")) {
    filters.location = ["New York, NY", "Boston, MA", "Philadelphia, PA", "Washington, DC", "Miami, FL", "Atlanta, GA"]
  } else {
    const locations = ["austin, tx", "detroit, mi", "boston, ma", "los angeles, ca", "new york, ny", "chicago, il"]
    const foundLocations = locations.filter(
      (location) =>
        queryLower.includes(location.toLowerCase()) || queryLower.includes(location.split(",")[0].toLowerCase()),
    )
    if (foundLocations.length > 0) {
      filters.location = foundLocations.map((loc) =>
        loc
          .split(",")
          .map((part) => part.trim().charAt(0).toUpperCase() + part.trim().slice(1))
          .join(", "),
      )
    }
  }

  // Revenue extraction
  const revenueMatch =
    queryLower.match(/revenue\s+(?:over|above|greater than|>\s*)\$?([\d.]+)(?:m|million)?/i) ||
    queryLower.match(/\$([\d.]+)(?:m|million)?\s+(?:revenue|sales)/i) ||
    queryLower.match(/over\s+\$?([\d.]+)(?:m|million)?/i)
  if (revenueMatch) {
    filters.revenue = { min: Number.parseFloat(revenueMatch[1]) }
  }

  // Revenue range extraction
  const revenueRangeMatch = queryLower.match(/\$?([\d.]+)(?:m|million)?\s*-\s*\$?([\d.]+)(?:m|million)?/i)
  if (revenueRangeMatch) {
    filters.revenue = {
      min: Number.parseFloat(revenueRangeMatch[1]),
      max: Number.parseFloat(revenueRangeMatch[2]),
    }
  }

  // Employee count extraction
  const employeeMatch =
    queryLower.match(/([\d,]+)\+?\s+employees?/i) ||
    queryLower.match(/employees?\s+(?:over|above|greater than|>\s*)([\d,]+)/i) ||
    queryLower.match(/(?:more than|over)\s+([\d,]+)\s+employees?/i)
  if (employeeMatch) {
    const count = Number.parseInt(employeeMatch[1].replace(/,/g, ""))
    filters.employees = { min: count }
  }

  // Health score extraction
  const healthMatch = queryLower.match(/health\s+(?:score\s+)?(?:over|above|greater than|>\s*)([\d.]+)%?/i)
  if (healthMatch) {
    filters.health = { min: Number.parseFloat(healthMatch[1]) }
  }

  // Founded year extraction
  const foundedMatch = queryLower.match(/founded\s+(?:after|since|in|from)\s+(\d{4})/i)
  if (foundedMatch) {
    filters.founded = { min: Number.parseInt(foundedMatch[1]) }
  }

  return filters
}

const convertFiltersToNaturalLanguage = (filters: any): string => {
  const parts: string[] = []

  // Industry
  if (filters.industry?.length > 0) {
    if (filters.industry.length === 1) {
      parts.push(`${filters.industry[0]} companies`)
    } else if (filters.industry.length === 2) {
      parts.push(`${filters.industry.join(" and ")} companies`)
    } else {
      parts.push(`${filters.industry.slice(0, 2).join(", ")} and ${filters.industry.length - 2} other industries`)
    }
  }

  // Location with improved regional detection
  if (filters.location?.length > 0) {
    if (filters.location.length === 1) {
      parts.push(`in ${filters.location[0]}`)
    } else if (filters.location.length > 5) {
      // Handle regional groupings with better detection
      const locations = filters.location
      const midwestCities = [
        "Chicago, IL",
        "Detroit, MI",
        "Cleveland, OH",
        "Milwaukee, WI",
        "Indianapolis, IN",
        "Kansas City, MO",
        "St. Louis, MO",
        "Minneapolis, MN",
      ]
      const westCoastCities = ["Los Angeles, CA", "San Francisco, CA", "Seattle, WA", "Portland, OR", "San Diego, CA"]
      const eastCoastCities = [
        "New York, NY",
        "Boston, MA",
        "Philadelphia, PA",
        "Washington, DC",
        "Miami, FL",
        "Atlanta, GA",
      ]

      const midwestMatches = locations.filter((loc: string) => midwestCities.includes(loc)).length
      const westCoastMatches = locations.filter((loc: string) => westCoastCities.includes(loc)).length
      const eastCoastMatches = locations.filter((loc: string) => eastCoastCities.includes(loc)).length

      if (midwestMatches >= 3) {
        parts.push("in the Midwest")
      } else if (westCoastMatches >= 3) {
        parts.push("on the West Coast")
      } else if (eastCoastMatches >= 3) {
        parts.push("on the East Coast")
      } else {
        parts.push(`in ${locations.slice(0, 2).join(", ")} and ${locations.length - 2} other locations`)
      }
    } else {
      parts.push(`in ${filters.location.join(", ")}`)
    }
  }

  // Revenue with better formatting
  if (filters.revenue) {
    if (filters.revenue.min && filters.revenue.max) {
      parts.push(`with revenue between $${filters.revenue.min}M and $${filters.revenue.max}M`)
    } else if (filters.revenue.min) {
      parts.push(`with revenue over $${filters.revenue.min}M`)
    } else if (filters.revenue.max) {
      parts.push(`with revenue under $${filters.revenue.max}M`)
    }
  }

  // Employees with better formatting
  if (filters.employees) {
    if (filters.employees.min && filters.employees.max) {
      parts.push(`with ${filters.employees.min}-${filters.employees.max} employees`)
    } else if (filters.employees.min) {
      parts.push(`with more than ${filters.employees.min} employees`)
    } else if (filters.employees.max) {
      parts.push(`with fewer than ${filters.employees.max} employees`)
    }
  }

  // Health score
  if (filters.health) {
    if (filters.health.min && filters.health.max) {
      parts.push(`with health score ${filters.health.min}-${filters.health.max}%`)
    } else if (filters.health.min) {
      parts.push(`with health score over ${filters.health.min}%`)
    } else if (filters.health.max) {
      parts.push(`with health score under ${filters.health.max}%`)
    }
  }

  // Founded year
  if (filters.founded) {
    if (filters.founded.min && filters.founded.max) {
      parts.push(`founded between ${filters.founded.min} and ${filters.founded.max}`)
    } else if (filters.founded.min) {
      parts.push(`founded after ${filters.founded.min}`)
    } else if (filters.founded.max) {
      parts.push(`founded before ${filters.founded.max}`)
    }
  }

  return parts.length > 0 ? parts.join(" ") : ""
}

const callAIParsingAPI = async (query: string): Promise<any> => {
  try {
    console.log("[v0] Making API call to parse natural language")
    const response = await fetch("/api/parse-natural-language", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    })

    console.log("[v0] API response status:", response.status)

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] API error response:", errorData)
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorData.details || errorData.error}`)
    }

    const data = await response.json()
    console.log("[v0] API response data:", data)
    return data.filters || {}
  } catch (error) {
    console.error("[v0] AI parsing API error:", error)
    throw error
  }
}

export function NaturalLanguageSearch({
  value,
  onChange,
  onSubmit,
  placeholder = "Describe companies you're looking for...", // Updated placeholder text to include "the"
  onFiltersExtracted,
  activeFilters,
  onOpenSearchHistory, // Added onOpenSearchHistory prop
  onExpand, // Added onExpand prop
}: NaturalLanguageSearchProps) {
  const [showExpanded, setShowExpanded] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [lastSyncedFilters, setLastSyncedFilters] = useState<string>("")
  const [isCollapsed, setIsCollapsed] = useState(true)
  const [isProgrammaticUpdate, setIsProgrammaticUpdate] = useState(false)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const suggestionTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const searchHistory = JSON.parse(localStorage.getItem("searchHistory") || "[]")

    // Check if any items have the old malformed structure
    const hasMalformedItems = searchHistory.some(
      (item: any) => item.filters && typeof item.filters === "object" && item.filters.searchQuery,
    )

    if (hasMalformedItems) {
      console.log("[v0] Clearing malformed search history")
      localStorage.removeItem("searchHistory")
    }
  }, [])

  const saveSearchToHistory = (query: string, extractedFilters?: any) => {
    if (!query.trim()) return

    const searchHistory = JSON.parse(localStorage.getItem("searchHistory") || "[]")

    const newSearch = {
      id: Date.now().toString(),
      query: query.trim(), // Keep for backward compatibility
      searchQuery: query.trim(), // Add searchQuery property like saved searches
      timestamp: new Date().toISOString(),
      filters: extractedFilters || {}, // Store the actual extracted filters, not activeFilters
    }

    console.log("[v0] Saving search to history with structure:", newSearch)

    // Remove duplicate queries and keep only the latest 20
    const filteredHistory = searchHistory.filter((item: any) => item.query !== query.trim())
    const updatedHistory = [newSearch, ...filteredHistory].slice(0, 20)

    localStorage.setItem("searchHistory", JSON.stringify(updatedHistory))
  }

  useEffect(() => {
    if (activeFilters && Object.keys(activeFilters).length > 0) {
      const filtersString = JSON.stringify(activeFilters)

      // Prevent infinite loops by checking if filters actually changed
      if (filtersString === lastSyncedFilters) {
        return
      }

      const naturalLanguageFromFilters = convertFiltersToNaturalLanguage(activeFilters)

      if (naturalLanguageFromFilters && naturalLanguageFromFilters !== value) {
        // Check if current value represents the same filters to avoid overriding user input
        const currentFilters = parseNaturalLanguageToFiltersLocal(value)
        const currentFiltersString = JSON.stringify(currentFilters)

        // Only update if:
        // 1. The input is empty or whitespace only
        // 2. The current input represents different filters than what we want to sync
        // 3. The current input looks like it was generated from filters (not user-typed)
        const shouldUpdate =
          !value.trim() ||
          currentFiltersString !== filtersString ||
          (value.includes("companies") && value.includes("with"))

        if (shouldUpdate) {
          console.log("[v0] Syncing filters to natural language:", naturalLanguageFromFilters)
          setIsProgrammaticUpdate(true)
          onChange(naturalLanguageFromFilters)
          setLastSyncedFilters(filtersString)
          // Reset flag after a brief delay
          setTimeout(() => setIsProgrammaticUpdate(false), 100)
        }
      }
    } else if (activeFilters && Object.keys(activeFilters).length === 0 && value.trim() && !isProgrammaticUpdate) {
      // Don't clear if user is actively typing (check if input has focus)
      const isInputFocused = textareaRef.current === document.activeElement
      if (!isInputFocused) {
        console.log("[v0] Clearing natural language input as filters were cleared")
        setIsProgrammaticUpdate(true)
        onChange("")
        setLastSyncedFilters("")
        // Reset flag after a brief delay
        setTimeout(() => setIsProgrammaticUpdate(false), 100)
      }
    }
  }, [activeFilters, onChange, lastSyncedFilters, isProgrammaticUpdate]) // Removed 'value' from dependencies

  const fetchAISuggestions = useCallback(async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setAiSuggestions([])
      return
    }

    setIsLoadingSuggestions(true)
    try {
      console.log("[v0] Fetching AI suggestions for:", query)
      const response = await fetch("/api/generate-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      })

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Received AI suggestions:", data.suggestions)
        setAiSuggestions(data.suggestions || [])
      } else {
        console.error("[v0] Failed to fetch suggestions")
        setAiSuggestions([])
      }
    } catch (error) {
      console.error("[v0] Error fetching AI suggestions:", error)
      setAiSuggestions([])
    } finally {
      setIsLoadingSuggestions(false)
    }
  }, [])

  useEffect(() => {
    // Clear existing timeout
    if (suggestionTimeoutRef.current) {
      clearTimeout(suggestionTimeoutRef.current)
    }

    // Only fetch suggestions if user is actively typing (not programmatic updates)
    if (!isProgrammaticUpdate && value.trim().length >= 3 && !isCollapsed) {
      suggestionTimeoutRef.current = setTimeout(() => {
        fetchAISuggestions(value)
      }, 800) // 800ms debounce
    } else if (value.trim().length < 3) {
      setAiSuggestions([])
    }

    return () => {
      if (suggestionTimeoutRef.current) {
        clearTimeout(suggestionTimeoutRef.current)
      }
    }
  }, [value, isProgrammaticUpdate, isCollapsed, fetchAISuggestions])

  const dealSuggestions = [
    "Tech companies in the Midwest with more than 10 employees",
    "SaaS companies with revenue over $10M in Austin",
    "Healthcare deals with high growth potential",
    "Manufacturing companies with strong margins",
    "Financial services with recurring revenue",
    "Companies with EBITDA over $5M",
    "Retail businesses with multiple locations",
    "Distressed assets in the energy sector",
  ]

  const expandedSuggestions = [
    ...dealSuggestions,
    "Companies with strong management teams",
    "Businesses with proprietary technology",
    "Family-owned companies ready to sell",
    "Roll-up opportunities in fragmented markets",
    "Companies with international expansion potential",
    "Businesses with subscription revenue models",
    "Asset-heavy companies with real estate",
    "Companies with regulatory advantages",
  ]

  const handleAIProcessing = async (query: string) => {
    if (!query.trim() || !onFiltersExtracted) return

    setIsProcessing(true)
    try {
      console.log("[v0] Starting AI processing for query:", query)

      let extractedFilters = {}
      try {
        extractedFilters = await callAIParsingAPI(query)
        console.log("[v0] AI-extracted filters:", extractedFilters)
      } catch (aiError) {
        console.log("[v0] AI parsing failed, using local parsing:", aiError)
        extractedFilters = parseNaturalLanguageToFiltersLocal(query)
        console.log("[v0] Local-extracted filters:", extractedFilters)
      }

      onFiltersExtracted(extractedFilters)
      saveSearchToHistory(query, extractedFilters)
    } catch (error) {
      console.error("[v0] Error processing natural language:", error)
      const fallbackFilters = parseNaturalLanguageToFiltersLocal(query)
      console.log("[v0] Using fallback filters:", fallbackFilters)
      onFiltersExtracted(fallbackFilters)
      saveSearchToHistory(query, fallbackFilters)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    handleAIProcessing(suggestion)
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }

  const handleToggleExpanded = () => {
    setIsCollapsed(!isCollapsed)
    if (!isCollapsed) {
      setShowExpanded(false)
      onChange("")
    }
    if (isCollapsed && onExpand) {
      onExpand()
    }
  }

  const handleCollapsedClick = () => {
    if (isCollapsed) {
      setIsCollapsed(false)
      if (onExpand) {
        onExpand()
      }
      // Focus the textarea after expansion
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
        }
      }, 100)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "/") {
      e.preventDefault()
      setShowExpanded(true)
      setIsCollapsed(false)
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleAIProcessing(value)
      onSubmit()
    } else if (e.key === "Escape") {
      if (showExpanded) {
        setShowExpanded(false)
      } else {
        setIsCollapsed(true)
        onChange("")
      }
    }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    if (!isProgrammaticUpdate) {
      onChange(newValue)
    }
  }

  useEffect(() => {
    if (textareaRef.current && !isCollapsed) {
      textareaRef.current.focus()
    }
  }, [isCollapsed])

  const animationConfig = {
    duration: 0.3,
    ease: [0.25, 0.1, 0.25, 1], // Smooth easing curve
  }

  const suggestionsToShow = aiSuggestions.length > 0 ? aiSuggestions : dealSuggestions

  return (
    <motion.div
      layout
      initial={false}
      animate={{
        height: isCollapsed ? 48 : "auto",
        opacity: 1,
      }}
      transition={animationConfig}
      className="relative w-full"
    >
      <div className="relative bg-card/80 backdrop-blur-sm border border-border/60 rounded-xl hover:shadow-md transition-all duration-300 overflow-hidden shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/2 via-primary/1 to-primary/2" />

        {isProcessing && (
          <div
            className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/3 to-primary/5 opacity-50"
            style={{
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
        )}

        <div className="relative flex items-center justify-between px-4 py-2">
          <div className="flex items-center space-x-3 flex-1 cursor-text" onClick={handleCollapsedClick}>
            <div className="flex items-center justify-center w-8 h-8 bg-secondary border border-border/50 rounded-lg shadow-sm">
              {isProcessing ? (
                <div
                  className="w-4 h-4 border border-muted-foreground border-t-primary rounded-full"
                  style={{
                    animation: "spin 1.5s linear infinite",
                  }}
                />
              ) : (
                <Search className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            {isCollapsed && (
              <span className="text-sm text-muted-foreground transition-colors truncate">{value || placeholder}</span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {onOpenSearchHistory && (
              <button
                onClick={onOpenSearchHistory}
                className="flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-lg transition-all duration-200"
                title="Search History"
              >
                <History className="h-4 w-4" />
              </button>
            )}

            <button
              onClick={handleToggleExpanded}
              className="flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-lg transition-all duration-200"
            >
              {!isCollapsed && <X className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <motion.div
          initial={false}
          animate={{
            height: isCollapsed ? 0 : "auto",
            opacity: isCollapsed ? 0 : 1,
          }}
          transition={animationConfig}
          className="relative overflow-hidden"
        >
          <div className="p-4">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onFocus={handleCollapsedClick}
              placeholder={placeholder}
              className="w-full h-20 px-0 py-0 text-sm bg-transparent border-none outline-none resize-none placeholder:text-muted-foreground text-foreground leading-relaxed"
              rows={3}
              disabled={isProcessing}
            />
          </div>

          <div className="border-t border-border/80 bg-secondary/30 p-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2 overflow-x-auto scrollbar-hide flex-1">
                {!isLoadingSuggestions &&
                  suggestionsToShow.slice(0, showExpanded ? 4 : 2).map((suggestion, index) => (
                    <button
                      key={`${suggestion}-${index}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium bg-background/80 hover:bg-background border border-border/60 hover:border-border/80 rounded-full transition-all duration-200 whitespace-nowrap flex-shrink-0 shadow-sm hover:shadow-md"
                      disabled={isProcessing}
                    >
                      {aiSuggestions.length > 0 ? (
                        <span className="bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                          <Sparkles className="h-3 w-3" style={{ color: "transparent", stroke: "url(#ai-gradient)" }} />
                          <svg width="0" height="0">
                            <defs>
                              <linearGradient id="ai-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#3b82f6" />
                                <stop offset="50%" stopColor="#a855f7" />
                                <stop offset="100%" stopColor="#ec4899" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </span>
                      ) : (
                        <Search className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span className="text-foreground">{suggestion}</span>
                    </button>
                  ))}

                {!showExpanded && !isLoadingSuggestions && (
                  <button
                    onClick={() => setShowExpanded(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium bg-primary/10 hover:bg-primary/20 border border-primary/30 hover:border-primary/50 rounded-full transition-all duration-200 whitespace-nowrap flex-shrink-0 text-primary"
                    disabled={isProcessing}
                  >
                    <span>More ideas</span>
                  </button>
                )}
              </div>

              <button
                onClick={() => {
                  handleAIProcessing(value)
                  onSubmit()
                }}
                className="flex items-center justify-center w-9 h-9 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl flex-shrink-0 ml-3 disabled:opacity-50"
                disabled={isProcessing || !value.trim()}
              >
                {isProcessing ? (
                  <div
                    className="w-4 h-4 border border-primary-foreground/30 border-t-primary-foreground rounded-full"
                    style={{
                      animation: "spin 1s linear infinite",
                    }}
                  />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </motion.div>
  )
}
