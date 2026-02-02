"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Bookmark, Play, Bot, Zap, TrendingUp, Target, Lightbulb } from "lucide-react"
import { FilterIcon } from "@/components/icons/filter-icon"
import { TrendingQueriesTicker } from "@/components/trending-queries-ticker"
import { useSavedDeals } from "@/lib/saved-deals-context"
import { cn } from "@/lib/utils"

interface FindDealsSearchViewProps {
  onSearchSubmit: (query: string) => void
}

export const FindDealsSearchView = ({ onSearchSubmit }: FindDealsSearchViewProps) => {
  const [searchInput, setSearchInput] = useState("")
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showExpandedSuggestions, setShowExpandedSuggestions] = useState(false)
  const [isMorphing, setIsMorphing] = useState(false)
  const [activeTab, setActiveTab] = useState<"suggestions" | "saved">("suggestions")
  const [showAIPrompts, setShowAIPrompts] = useState(true)
  const [aiThinking, setAiThinking] = useState(false)
  const searchInputRef = useRef<HTMLTextAreaElement>(null)

  const { state } = useSavedDeals()

  const industries = ["SaaS", "Manufacturing", "Healthcare", "Retail", "Technology", "Financial Services"]

  const conversationalPrompts = [
    {
      icon: Target,
      title: "What's your ideal deal?",
      description: "Describe the company profile, industry, or metrics you're targeting",
      example: "SaaS companies with $10M+ ARR in the Midwest",
    },
    {
      icon: TrendingUp,
      title: "Looking for growth?",
      description: "Find companies with specific growth metrics or momentum",
      example: "Healthcare tech with 50%+ revenue growth",
    },
    {
      icon: Zap,
      title: "Quick filters",
      description: "Use natural language to describe any criteria",
      example: "Manufacturing companies with EBITDA margins above 25%",
    },
  ]

  useEffect(() => {
    const handleDealSearch = (event: CustomEvent) => {
      const query = event.detail.query
      setSearchInput(query)
      handleSearchSubmit(query)
    }

    document.addEventListener("dealSearch", handleDealSearch as EventListener)
    return () => {
      document.removeEventListener("dealSearch", handleDealSearch as EventListener)
    }
  }, [])

  const getBasicSuggestions = () => [
    "SaaS companies with ARR over $10M in Austin",
    "Manufacturing companies with EBITDA margins above 25%",
    "Healthcare tech with revenue growth over 50%",
    "Technology companies in California with 100+ employees",
    "Financial services with strong unit economics",
    "Retail companies with omnichannel presence",
  ]

  const getExpandedSuggestions = () => [
    ...getBasicSuggestions(),
    "B2B SaaS companies with net revenue retention above 110%",
    "Manufacturing businesses with recurring revenue models",
    "Healthcare companies serving enterprise customers",
    "Technology startups with proven product-market fit",
    "Financial services with regulatory moats",
    "Retail brands with direct-to-consumer channels",
    "Companies with strong management teams and growth potential",
    "Businesses with defensible competitive advantages",
    "Companies in consolidating industries with acquisition opportunities",
    "High-margin service businesses with scalable operations",
  ]

  const handleSavedSearchClick = (savedQuery: any) => {
    setSearchInput(savedQuery.searchQuery)
    searchInputRef.current?.focus()
    handleSearchSubmit({
      searchQuery: savedQuery.searchQuery,
      ...savedQuery.filters,
    })
  }

  const formatFilterSummary = (filters: any) => {
    const parts = []
    if (filters.industry?.length) {
      parts.push(`${filters.industry.length} industries`)
    }
    if (filters.revenue) {
      parts.push(`Revenue: $${filters.revenue.min || 0}M-$${filters.revenue.max || "∞"}M`)
    }
    if (filters.health) {
      parts.push(`Health: ${filters.health.min || 0}-${filters.health.max || 100}%`)
    }
    return parts.length > 0 ? parts.join(", ") : "No filters"
  }

  const handleSearchSubmit = async (queryOrFilters?: string | any) => {
    let filters

    if (typeof queryOrFilters === "string") {
      filters = { searchQuery: queryOrFilters }
    } else if (queryOrFilters) {
      filters = queryOrFilters
    } else {
      if (searchInput.trim() || selectedIndustries.length > 0) {
        filters = {
          searchQuery: searchInput.trim(),
          industries: selectedIndustries,
        }
        const hasActiveFilters = selectedIndustries.length > 0
        filters = hasActiveFilters ? filters : { searchQuery: searchInput.trim() }
      } else {
        return
      }
    }

    setAiThinking(true)
    setShowAIPrompts(false)

    await new Promise((resolve) => setTimeout(resolve, 800))

    setIsMorphing(true)
    setIsSubmitting(true)

    await new Promise((resolve) => setTimeout(resolve, 600))

    await new Promise((resolve) => setTimeout(resolve, 200))
    onSearchSubmit(filters)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSearchSubmit()
    }
    if (e.key === "/" && !showExpandedSuggestions) {
      e.preventDefault()
      setShowExpandedSuggestions(true)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setSearchInput(suggestion)
    searchInputRef.current?.focus()
    setShowExpandedSuggestions(false)
  }

  const handlePromptClick = (example: string) => {
    setSearchInput(example)
    searchInputRef.current?.focus()
    setShowAIPrompts(false)
  }

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries((prev) => {
      const newSelection = prev.includes(industry) ? prev.filter((i) => i !== industry) : [...prev, industry]

      if (newSelection.length === 0) {
        setSearchInput("")
      } else if (newSelection.length === 1) {
        setSearchInput(`${newSelection[0]} companies`)
      } else {
        setSearchInput(`${newSelection.join(" or ")} companies`)
      }

      return newSelection
    })
  }

  useEffect(() => {
    searchInputRef.current?.focus()
  }, [])

  useEffect(() => {
    if (searchInput.trim().length > 0) {
      setShowAIPrompts(false)
    }
  }, [searchInput])

  const currentSuggestions = showExpandedSuggestions ? getExpandedSuggestions() : getBasicSuggestions()

  return (
    <div className="flex flex-col items-center justify-center px-4 relative py-12 h-[90%]">
      <div className="w-full max-w-2xl space-y-8 h-full">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center shadow-lg">
              <Bot className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-foreground">Gordon AI</h1>
              <p className="text-sm text-muted-foreground">Your intelligent deal sourcing assistant</p>
            </div>
          </div>
        </motion.div>

        <div className="w-full bg-white/50 backdrop-blur-sm rounded-xl border border-border/30 p-4 shadow-sm">
          <div className="text-xs font-medium text-muted-foreground mb-2 text-center">Trending Searches</div>
          <TrendingQueriesTicker
            onSearch={(filters) => {
              console.log("[v0] TrendingQueriesTicker onSearch called with:", filters)
              onSearchSubmit(filters)
            }}
          />
        </div>

        <motion.div
          layout
          className="space-y-6"
          animate={
            isMorphing
              ? {
                  scale: 0.85,
                  opacity: 0.7,
                  y: -40,
                  rotateX: 5,
                }
              : isSubmitting
                ? {
                    scale: 0.9,
                    opacity: 0.8,
                    y: 20,
                  }
                : {
                    scale: 1,
                    opacity: 1,
                    y: 0,
                    rotateX: 0,
                  }
          }
          transition={{
            duration: isMorphing ? 0.6 : 0.6,
            ease: isMorphing ? [0.4, 0, 0.2, 1] : [0.4, 0, 0.2, 1],
            delay: isMorphing ? 0 : isSubmitting ? 0.1 : 0,
          }}
          initial={{ opacity: 0, y: 20 }}
        >
          <motion.div
            layout
            className="relative"
            data-morph-target="search-input"
            animate={
              isMorphing
                ? {
                    borderRadius: "12px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                  }
                : {}
            }
          >
            <div className="relative backdrop-blur-sm bg-background/80 border border-border/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
              <AnimatePresence>
                {isMorphing && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20"
                    initial={{ opacity: 0, scale: 1 }}
                    animate={{
                      opacity: [0, 0.5, 0],
                      scale: [1, 1.02, 1],
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  />
                )}
              </AnimatePresence>

              <div className="flex items-start gap-3 relative z-10">
                <div className="flex-shrink-0 mt-1">
                  <motion.div
                    animate={
                      aiThinking || isMorphing
                        ? {
                            rotate: [0, 180, 360],
                            scale: [1, 1.2, 1],
                          }
                        : {}
                    }
                    transition={{ duration: 0.6, repeat: aiThinking ? Number.POSITIVE_INFINITY : 0 }}
                  >
                    <Sparkles className="h-5 w-5 text-primary" />
                  </motion.div>
                </div>
                <div className="flex-1">
                  <AnimatePresence mode="wait">
                    {aiThinking && !isMorphing ? (
                      <motion.div
                        key="thinking"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="py-2"
                      >
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <motion.div
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                          >
                            <Bot className="h-4 w-4" />
                          </motion.div>
                          <span className="text-sm">Gordon is analyzing your search criteria...</span>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <textarea
                          ref={searchInputRef}
                          placeholder="Tell me what kind of deals you're looking for..."
                          value={searchInput}
                          onChange={(e) => setSearchInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          disabled={isSubmitting || isMorphing || aiThinking}
                          rows={3}
                          className="w-full resize-none bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-base leading-relaxed disabled:opacity-50"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/30">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Lightbulb className="h-3 w-3" />
                      <span>Use natural language - be as specific as you want</span>
                    </div>
                    {(searchInput.trim() || selectedIndustries.length > 0) &&
                      !isSubmitting &&
                      !isMorphing &&
                      !aiThinking && (
                        <Button
                          onClick={() => handleSearchSubmit()}
                          size="sm"
                          className="h-8 px-4 bg-primary hover:bg-primary/90"
                        >
                          Search
                        </Button>
                      )}
                    {(isSubmitting || isMorphing || aiThinking) && (
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                          className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full"
                        />
                        <span className="text-xs text-muted-foreground">
                          {aiThinking ? "Analyzing..." : isMorphing ? "Finding deals..." : "Searching..."}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <AnimatePresence>
            {showAIPrompts && !searchInput.trim() && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground mb-1">Not sure where to start?</p>
                  <p className="text-xs text-muted-foreground">Try one of these approaches:</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {conversationalPrompts.map((prompt, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handlePromptClick(prompt.example)}
                      className="group relative p-4 rounded-xl border border-border/50 bg-gradient-to-br from-background to-secondary/20 hover:border-primary/40 hover:shadow-md transition-all duration-200 text-left"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                          <prompt.icon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                            {prompt.title}
                          </h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">{prompt.description}</p>
                        </div>
                      </div>
                      <div className="pl-11">
                        <div className="text-xs text-primary/80 font-medium bg-primary/5 rounded-lg px-2 py-1.5 border border-primary/10">
                          "{prompt.example}"
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            layout
            animate={isMorphing || isSubmitting || aiThinking ? { opacity: 0.6 } : { opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <label className="text-sm font-medium text-foreground mb-3 block text-center">Quick Industry Filters</label>
            <div className="flex flex-wrap gap-2 justify-center">
              {industries.map((industry) => (
                <Button
                  key={industry}
                  variant={selectedIndustries.includes(industry) ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleIndustry(industry)}
                  disabled={isSubmitting || isMorphing || aiThinking}
                  className="text-xs disabled:opacity-50"
                >
                  {industry}
                </Button>
              ))}
            </div>
          </motion.div>

          <motion.div
            layout
            animate={isMorphing || isSubmitting || aiThinking ? { opacity: 0.6 } : { opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="flex items-center bg-secondary/30 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab("suggestions")}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                      activeTab === "suggestions"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Sparkles className="h-3 w-3" />
                    AI Suggestions
                  </button>
                  <button
                    onClick={() => setActiveTab("saved")}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200",
                      activeTab === "saved"
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Bookmark className="h-3 w-3" />
                    Saved ({state.savedQueries.length})
                  </button>
                </div>
              </div>

              <AnimatePresence mode="wait">
                {activeTab === "suggestions" ? (
                  <motion.div
                    key="suggestions"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <div className="text-center">
                      <span className="text-sm text-muted-foreground">Popular search examples:</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 max-w-xl mx-auto max-h-64 overflow-y-auto">
                      {currentSuggestions.map((suggestion, index) => (
                        <button
                          key={`suggestion-${index}`}
                          onClick={() => handleSuggestionClick(suggestion)}
                          disabled={isSubmitting || isMorphing || aiThinking}
                          className="text-left h-auto min-h-[44px] px-4 py-3 rounded-xl border border-border/30 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 text-sm text-muted-foreground hover:text-foreground disabled:opacity-50 group w-full shadow-sm hover:shadow-md"
                        >
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-3 w-3 text-primary/60 flex-shrink-0" />
                            <span className="leading-relaxed">{suggestion}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                    {!showExpandedSuggestions && (
                      <div className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowExpandedSuggestions(true)}
                          className="text-xs text-muted-foreground hover:text-foreground"
                        >
                          Show more suggestions
                        </Button>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="saved"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-3"
                  >
                    <div className="text-center">
                      <span className="text-sm text-muted-foreground">Your saved searches:</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 max-w-xl mx-auto max-h-64 overflow-y-auto">
                      {state.savedQueries.length > 0 ? (
                        state.savedQueries.map((savedQuery) => (
                          <button
                            key={savedQuery.id}
                            onClick={() => handleSavedSearchClick(savedQuery)}
                            disabled={isSubmitting || isMorphing || aiThinking}
                            className="text-left h-auto min-h-[56px] px-4 py-3 rounded-xl border border-border/30 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 text-sm disabled:opacity-50 group w-full shadow-sm hover:shadow-md"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                <div
                                  className={cn(
                                    "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                                    `bg-${savedQuery.color}-500`,
                                  )}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                      {savedQuery.name}
                                    </span>
                                    {savedQuery.resultCount !== undefined && (
                                      <Badge variant="outline" className="text-xs flex-shrink-0">
                                        {savedQuery.resultCount} results
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground mb-1 truncate">
                                    "{savedQuery.searchQuery}"
                                  </div>
                                  <div className="text-xs text-muted-foreground/80 truncate">
                                    {formatFilterSummary(savedQuery.filters)}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play className="h-3 w-3 text-primary" />
                              </div>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="text-center py-8">
                          <Bookmark className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">No saved searches yet</p>
                          <p className="text-xs text-muted-foreground/80 mt-1">
                            Save your searches for quick access later
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          <motion.div
            layout
            className="flex justify-center"
            animate={isMorphing || isSubmitting || aiThinking ? { opacity: 0.6 } : { opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Button
              variant="outline"
              onClick={handleSearchSubmit}
              disabled={isSubmitting || isMorphing || aiThinking}
              className="flex items-center gap-2 disabled:opacity-50 bg-transparent"
            >
              <FilterIcon className="h-4 w-4" />
              Advanced Filters
            </Button>
          </motion.div>
        </motion.div>
      </div>

      <AnimatePresence>
        {(isSubmitting || isMorphing) && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(isMorphing ? 20 : 12)].map((_, i) => (
              <motion.div
                key={i}
                className={`absolute w-1 h-1 ${isMorphing ? "bg-primary/50" : "bg-primary/30"} rounded-full`}
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  scale: 0,
                }}
                animate={{
                  x: window.innerWidth / 2,
                  y: isMorphing ? window.innerHeight / 2 - 100 : window.innerHeight - 100,
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: isMorphing ? 0.6 : 0.8,
                  delay: i * (isMorphing ? 0.03 : 0.05),
                  ease: [0.4, 0, 0.2, 1],
                }}
              />
            ))}

            <motion.div
              className={`absolute left-1/2 top-1/2 w-32 h-32 border-2 ${isMorphing ? "border-primary/40" : "border-primary/20"} rounded-full`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: [0, 1.5, 0],
                opacity: [0, 0.6, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: isMorphing ? 0.6 : 0.8,
                ease: [0.4, 0, 0.2, 1],
              }}
              style={{ transform: "translate(-50%, -50%)" }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
