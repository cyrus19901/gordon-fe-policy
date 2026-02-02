"use client"
import { useState, useCallback, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import type React from "react"

import { motion, AnimatePresence, useMotionValue, useAnimation } from "framer-motion"
import { Sparkles } from "lucide-react"

interface TrendingQuery {
  id: string
  query: string
  reason: string
  isHot?: boolean
  dealCount?: string
  avgValuation?: string
  growth?: string
  timeAgo?: string
}

interface TrendingQueriesTickerProps {
  onSearch?: (filters: { searchQuery: string; filters: {} }) => void
}

const trendingQueries: TrendingQuery[] = [
  {
    id: "ai-startups-series-a",
    query: "AI startups with Series A funding > $10M",
    reason:
      "Surge in AI funding rounds with major VCs increasing allocation to AI companies. Enterprise adoption of AI tools driving valuations higher, with 47% increase in Series A rounds this quarter.",
    isHot: true,
    dealCount: "2,847",
    avgValuation: "$45.2M",
    growth: "+23%",
    timeAgo: "12m ago",
  },
  {
    id: "saas-arr-growth",
    query: "SaaS companies with ARR growth > 100%",
    reason:
      "Enterprise software consolidation driving M&A activity in vertical SaaS. Companies with strong unit economics and predictable revenue streams attracting premium valuations.",
    dealCount: "1,234",
    avgValuation: "$78.5M",
    growth: "+18%",
    timeAgo: "8m ago",
  },
  {
    id: "fintech-revenue",
    query: "Fintech deals with revenue > $50M",
    reason:
      "Banking-as-a-Service and embedded finance solutions gaining traction. Regulatory clarity and partnerships with traditional banks driving investor confidence.",
    dealCount: "892",
    avgValuation: "$125.3M",
    growth: "+31%",
    timeAgo: "15m ago",
  },
  {
    id: "healthcare-valuation",
    query: "Healthcare tech with valuation < 10x revenue",
    reason:
      "Regulatory uncertainty creating value opportunities in digital health. Telehealth adoption stabilizing post-pandemic, creating attractive entry points for strategic buyers.",
    dealCount: "567",
    avgValuation: "$32.1M",
    growth: "+12%",
    timeAgo: "22m ago",
  },
  {
    id: "climate-tech-carbon",
    query: "Climate tech with carbon credit partnerships",
    reason:
      "ESG mandates and carbon credit markets driving clean tech investments. Corporate sustainability commitments creating predictable revenue streams for climate solutions.",
    dealCount: "423",
    avgValuation: "$28.7M",
    growth: "+45%",
    timeAgo: "5m ago",
  },
  {
    id: "cybersecurity-enterprise",
    query: "Cybersecurity with enterprise clients > 500",
    reason:
      "Rising cyber threats increasing demand for security solutions. Zero-trust architecture adoption and compliance requirements driving enterprise spending on cybersecurity platforms.",
    dealCount: "1,156",
    avgValuation: "$67.8M",
    growth: "+27%",
    timeAgo: "18m ago",
  },
]

export function TrendingQueriesTicker({ onSearch }: TrendingQueriesTickerProps) {
  const [isPaused, setIsPaused] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [hoveredQuery, setHoveredQuery] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const [isMounted, setIsMounted] = useState(false)
  const controls = useAnimation()
  const x = useMotionValue(0)
  const animationStartTime = useRef<number>(0)
  const pausedPosition = useRef<number>(0)
  const tickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])

  useEffect(() => {
    const startAnimation = async () => {
      if (isPaused || isHovered) {
        controls.stop()
        pausedPosition.current = x.get()
        return
      }

      const currentPosition = pausedPosition.current
      const targetPosition = -400
      const totalDistance = Math.abs(targetPosition)
      const remainingDistance = Math.abs(targetPosition - currentPosition)
      const progress = (totalDistance - remainingDistance) / totalDistance
      const remainingDuration = 20 * (remainingDistance / totalDistance)

      await controls.start({
        x: [currentPosition, targetPosition],
        transition: {
          duration: remainingDuration,
          ease: "linear",
        },
      })

      x.set(0)
      pausedPosition.current = 0
      startAnimation()
    }

    startAnimation()
  }, [isPaused, isHovered, controls, x])

  const handleQueryEnter = useCallback((queryId: string, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const tickerRect = tickerRef.current?.getBoundingClientRect()

    let left = rect.left
    let top = rect.bottom + 8

    const tooltipWidth = 320 // w-80 = 320px
    if (left + tooltipWidth > window.innerWidth - 20) {
      left = window.innerWidth - tooltipWidth - 20
    }
    if (left < 20) {
      left = 20
    }

    const tooltipHeight = 400 // approximate height
    if (top + tooltipHeight > window.innerHeight - 20) {
      top = rect.top - tooltipHeight - 8
    }

    setTooltipPosition({ top, left })
    setHoveredQuery(queryId)
  }, [])

  const handleQueryLeave = useCallback(() => {
    setHoveredQuery(null)
  }, [])

  const handleQueryClick = (query: string) => {
    console.log(`[v0] Ticker query clicked: ${query}`)

    if (onSearch) {
      onSearch({
        searchQuery: query,
        filters: {}, // Empty filters object, will be populated by AI parsing
      })
    }

    setHoveredQuery(null)
  }

  return (
    <div className="relative w-full" ref={tickerRef}>
      <div className="flex items-center border-border max-w-full bg-[rgba(129,129,129,0)] border-b-0 h-9 mb-0">
        <div className="flex-shrink-0 pl-2 pr-1">
          <button className="flex items-center justify-center h-5 px-2 text-xs font-medium border border-border rounded-full hover:bg-accent transition-colors text-foreground">
            All
          </button>
        </div>

        <div className="w-px h-4 bg-border mx-1" />

        <div className="flex-shrink-0 px-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Trending</span>
        </div>

        <div className="flex-1 overflow-visible min-w-0 relative">
          <div className="overflow-hidden">
            <motion.div
              className="flex items-center h-4 space-x-2"
              animate={controls}
              style={{ width: "800px", x }}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {trendingQueries.map((query) => (
                <div key={`first-${query.id}`} className="relative flex-shrink-0">
                  <button
                    className="flex items-center gap-1 text-foreground text-xs h-5 leading-4 py-0.5 pl-1 pr-1.5 border border-border/60 border-dashed rounded-full bg-secondary/80 hover:bg-secondary transition-colors"
                    onClick={() => handleQueryClick(query.query)}
                    onMouseEnter={(e) => handleQueryEnter(query.id, e)}
                    onMouseLeave={handleQueryLeave}
                  >
                    <Sparkles className="h-2.5 w-2.5 text-primary flex-shrink-0" />
                    <span className="whitespace-nowrap leading-7 font-normal font-sans text-xs">{query.query}</span>
                    {query.isHot && <div className="w-1 h-1 bg-orange-500 rounded-full flex-shrink-0" />}
                  </button>
                </div>
              ))}

              {trendingQueries.map((query) => (
                <div key={`second-${query.id}`} className="relative flex-shrink-0">
                  <button
                    className="flex items-center gap-1 text-foreground text-xs h-5 leading-4 py-0.5 pl-1 pr-1.5 border border-border/60 border-dashed rounded-full bg-secondary/80 hover:bg-secondary transition-colors"
                    onClick={() => handleQueryClick(query.query)}
                    onMouseEnter={(e) => handleQueryEnter(query.id, e)}
                    onMouseLeave={handleQueryLeave}
                  >
                    <Sparkles className="h-2.5 w-2.5 text-primary flex-shrink-0" />
                    <span className="font-medium whitespace-nowrap text-xs">{query.query}</span>
                    {query.isHot && <div className="w-1 h-1 bg-orange-500 rounded-full flex-shrink-0" />}
                  </button>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>

      {isMounted &&
        createPortal(
          <AnimatePresence>
            {hoveredQuery && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="fixed z-[9999] bg-card border border-border rounded-lg shadow-xl pointer-events-auto cursor-default w-72"
                style={{
                  top: `${tooltipPosition.top}px`,
                  left: `${tooltipPosition.left}px`,
                }}
                onMouseEnter={() => setHoveredQuery(hoveredQuery)}
                onMouseLeave={handleQueryLeave}
              >
                {(() => {
                  const query = trendingQueries.find((q) => q.id === hoveredQuery)
                  if (!query) return null

                  return (
                    <>
                      <div className="p-4 border-b border-border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Sparkles className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <div className="font-medium text-sm text-foreground leading-tight">
                                {query.query.split(" ").slice(0, 3).join(" ")}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                            {query.dealCount}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div>
                            <div className="text-lg font-semibold text-foreground">{query.avgValuation}</div>
                            <div className="flex items-center gap-1 text-xs">
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium">{query.growth}</span>
                              <span className="text-muted-foreground">avg growth</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-5 h-5 bg-secondary rounded flex items-center justify-center">
                            <Sparkles className="w-3 h-3 text-muted-foreground" />
                          </div>
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Why trending
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-4">{query.reason}</p>

                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12,6 12,12 16,14" />
                            </svg>
                            {query.timeAgo}
                          </div>
                        </div>

                        <button
                          className="w-full bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                          onClick={() => handleQueryClick(query.query)}
                        >
                          Search Deals
                        </button>
                      </div>
                    </>
                  )
                })()}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </div>
  )
}
