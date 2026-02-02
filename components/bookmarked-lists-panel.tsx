"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence, Reorder } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { X, Search, Filter, History, Clock, BookmarkCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSavedDeals } from "@/lib/saved-deals-context"
import { toast } from "sonner"

interface BookmarkedListsPanelProps {
  isOpen: boolean
  onClose: () => void
  onApplyQuery?: (query: any) => void
  selectionMode?: boolean
  selectedDeal?: any
  onDealSaved?: (deal: any) => void
}

const categorizeDealsByTime = (deals: any[]) => {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
  const fourteenDaysAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)

  const categories = {
    today: [] as any[],
    lastSevenDays: [] as any[],
    lastWeek: [] as any[],
    lastMonth: [] as any[],
    older: [] as any[],
  }

  deals.forEach((deal) => {
    const savedDate = new Date(deal.savedDate)

    if (savedDate >= today) {
      categories.today.push(deal)
    } else if (savedDate >= sevenDaysAgo) {
      categories.lastSevenDays.push(deal)
    } else if (savedDate >= fourteenDaysAgo) {
      categories.lastWeek.push(deal)
    } else if (savedDate >= thirtyDaysAgo) {
      categories.lastMonth.push(deal)
    } else {
      categories.older.push(deal)
    }
  })

  return categories
}

export function BookmarkedListsPanel({
  isOpen,
  onClose,
  onApplyQuery,
  selectionMode = false,
  selectedDeal,
  onDealSaved,
}: BookmarkedListsPanelProps) {
  const { state, dispatch } = useSavedDeals()
  const [activeTab, setActiveTab] = useState<"watchlist" | "recent">("watchlist")
  const [isAnimatingBack, setIsAnimatingBack] = useState(false)
  const [searchHistory, setSearchHistory] = useState<any[]>([])

  useEffect(() => {
    if (isOpen) {
      const history = JSON.parse(localStorage.getItem("searchHistory") || "[]")
      setSearchHistory(history)
    }
  }, [isOpen])

  const selectedDeals = Array.isArray(selectedDeal) ? selectedDeal : selectedDeal ? [selectedDeal] : []
  const isMultipleDeals = selectedDeals.length > 1

  const handleAddToWatchlist = () => {
    if (selectionMode && selectedDeals.length > 0) {
      selectedDeals.forEach((deal) => {
        dispatch({
          type: "SAVE_DEAL",
          payload: { deal },
        })
      })

      onClose()
      onDealSaved?.(selectedDeals[0])

      const dealCount = selectedDeals.length
      const dealNames = selectedDeals.map((d) => d.name)

      toast.success(
        dealCount === 1 ? `Added "${dealNames[0]}" to Watchlist` : `Added ${dealCount} deals to Watchlist`,
        {
          action: {
            label: "Undo",
            onClick: () => {
              selectedDeals.forEach((deal) => {
                dispatch({
                  type: "UNSAVE_DEAL",
                  payload: deal.id,
                })
              })
              toast.success("Removed from Watchlist")
            },
          },
          duration: 5000,
        },
      )
    }
  }

  const recentDeals = state.savedDeals
    .sort((a, b) => new Date(b.savedDate).getTime() - new Date(a.savedDate).getTime())
    .slice(0, 8)

  const categorizedDeals = categorizeDealsByTime(state.savedDeals)

  const getHealthColor = (health: number) => {
    if (health >= 80) return "bg-emerald-500"
    if (health >= 60) return "bg-amber-500"
    return "bg-rose-500"
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const searchTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - searchTime.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`

    return searchTime.toLocaleDateString()
  }

  const handleHistoryItemClick = (historyItem: any) => {
    console.log("[v0] Search history item clicked:", historyItem)
    console.log("[v0] Calling onApplyQuery with:", {
      searchQuery: historyItem.query,
      filters: historyItem.filters || {},
    })

    onApplyQuery?.({
      searchQuery: historyItem.query,
      filters: historyItem.filters || {},
    })
  }

  const clearSearchHistory = () => {
    localStorage.removeItem("searchHistory")
    setSearchHistory([])
  }

  const handleReorderDeals = (newOrder: any[]) => {
    dispatch({ type: "REORDER_DEALS", payload: newOrder })
  }

  const renderDealGroup = (title: string, deals: any[]) => {
    if (deals.length === 0) return null

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{title}</span>
          <span className="text-[10px] text-muted-foreground/60">{deals.length}</span>
        </div>
        <Reorder.Group
          as="div"
          axis="y"
          values={deals}
          onReorder={(newOrder) => {
            // Merge the reordered group with other deals
            const otherDeals = state.savedDeals.filter((d) => !deals.find((deal) => deal.id === d.id))
            const allDeals = [...newOrder, ...otherDeals]
            handleReorderDeals(allDeals)
          }}
          className="space-y-1"
        >
          {deals.map((deal) => (
            <Reorder.Item
              key={deal.id}
              value={deal}
              as="div"
              whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }}
              whileDrag={{
                scale: 1.05,
                boxShadow: "0 5px 15px rgba(0,0,0,0.2)",
                zIndex: 1000,
              }}
              className="flex items-center justify-between p-2 rounded-md transition-colors hover:bg-secondary/50 cursor-grab active:cursor-grabbing"
            >
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {/* Ticker */}
                <div className="w-5 h-5 bg-secondary rounded-md flex items-center justify-center flex-shrink-0">
                  <span className="text-[8px] font-semibold text-foreground">
                    {deal.name.substring(0, 2).toUpperCase()}
                  </span>
                </div>

                {/* Name and Industry */}
                <div className="flex-1 min-w-0">
                  <div className="text-foreground font-semibold text-xs truncate">{deal.name}</div>
                  <div className="text-muted-foreground text-[10px] truncate">
                    {deal.industry} • {deal.location}
                  </div>
                </div>

                {/* Revenue */}
                <div className="text-foreground/70 text-[10px] font-medium flex-shrink-0">{deal.revenue}</div>
              </div>

              {/* Health Score */}
              <div className="flex items-center space-x-1.5 flex-shrink-0 ml-2">
                <div className={cn("w-1.5 h-1.5 rounded-full", getHealthColor(deal.health))} />
                <div className="text-[10px] font-medium text-foreground/70">{deal.health}%</div>
              </div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      </div>
    )
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, x: 384 }}
            animate={{
              opacity: 1,
              x: 0,
              scale: selectionMode ? 1.02 : 1,
            }}
            exit={{ opacity: 0, x: 384 }}
            transition={{
              duration: isAnimatingBack ? 0.6 : 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
            className={cn(
              "fixed top-6 right-6 bottom-6 w-96 bg-card text-foreground border rounded-xl overflow-hidden z-50 flex flex-col shadow-xl",
              selectionMode ? "border-blue-500/30 shadow-blue-500/20" : "border-border",
            )}
          >
            {/* Header */}
            <div className="h-12 flex items-center justify-between px-5 border-b border-border/50">
              {selectionMode && selectedDeals.length > 0 ? (
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-foreground">Add to Watchlist</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {isMultipleDeals ? `${selectedDeals.length} deals selected` : selectedDeals[0]?.name}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setActiveTab("watchlist")}
                    className={cn(
                      "text-sm font-medium transition-all",
                      activeTab === "watchlist" ? "text-foreground" : "text-muted-foreground hover:text-foreground/80",
                    )}
                  >
                    Watchlist
                  </button>
                  <button
                    onClick={() => setActiveTab("recent")}
                    className={cn(
                      "text-sm font-medium transition-all",
                      activeTab === "recent" ? "text-foreground" : "text-muted-foreground hover:text-foreground/80",
                    )}
                  >
                    Recent
                  </button>
                </div>
              )}

              <div className="flex items-center gap-1">
                {!selectionMode && (
                  <>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-secondary text-muted-foreground">
                      <Filter className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-secondary text-muted-foreground">
                      <Search className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-6 w-6 p-0 hover:bg-secondary text-muted-foreground ml-1"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              <AnimatePresence mode="wait">
                {(activeTab === "watchlist" || selectionMode) && (
                  <motion.div
                    key="watchlist"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="p-4 space-y-6"
                  >
                    {selectionMode && selectedDeals.length > 0 && (
                      <div className="space-y-3">
                        <Button
                          onClick={handleAddToWatchlist}
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          <BookmarkCheck className="h-4 w-4 mr-2" />
                          Add to Watchlist
                        </Button>
                      </div>
                    )}

                    {!selectionMode && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-xs text-muted-foreground uppercase tracking-wide font-normal">
                            Watchlist
                          </span>
                          <div className="text-xs text-muted-foreground/60">{state.savedDeals.length} deals</div>
                        </div>

                        <div className="space-y-4">
                          {renderDealGroup("Today", categorizedDeals.today)}
                          {renderDealGroup("Last 7 Days", categorizedDeals.lastSevenDays)}
                          {renderDealGroup("Last Week", categorizedDeals.lastWeek)}
                          {renderDealGroup("Last Month", categorizedDeals.lastMonth)}
                          {renderDealGroup("Older", categorizedDeals.older)}

                          {state.savedDeals.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground text-sm">No deals in watchlist</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Saved Queries Section */}
                    {!selectionMode && (
                      <>
                        <Separator className="bg-border" />
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Saved Searches
                            </span>
                            <div className="text-xs text-muted-foreground/60">{state.savedQueries.length} queries</div>
                          </div>

                          <div className="space-y-1">
                            {state.savedQueries.map((query) => (
                              <motion.button
                                key={query.id}
                                whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }}
                                onClick={() => onApplyQuery?.(query)}
                                className="w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors hover:bg-secondary/50"
                              >
                                <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                                  <div className={cn("w-1.5 h-1.5 rounded-full", `bg-${query.color}-500`)} />
                                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                                  <div className="flex-1 min-w-0">
                                    <div className="text-foreground font-medium truncate text-xs">{query.name}</div>
                                    <div className="text-muted-foreground text-xs truncate mt-0.5">
                                      "{query.searchQuery}"
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  {query.resultCount && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs bg-secondary text-foreground/80 border-0 h-5"
                                    >
                                      {query.resultCount}
                                    </Badge>
                                  )}
                                </div>
                              </motion.button>
                            ))}
                          </div>
                        </div>

                        <Separator className="bg-border" />

                        {/* Search History Section */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Search History
                            </span>
                            <div className="flex items-center gap-2">
                              <div className="text-xs text-muted-foreground/60">{searchHistory.length} searches</div>
                              {searchHistory.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={clearSearchHistory}
                                  className="h-5 px-2 text-xs text-muted-foreground hover:text-foreground"
                                >
                                  Clear
                                </Button>
                              )}
                            </div>
                          </div>

                          <div className="space-y-1">
                            {searchHistory.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-6 px-4">
                                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center mb-2">
                                  <History className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="text-center">
                                  <div className="text-xs font-medium text-foreground mb-1">No search history</div>
                                  <div className="text-xs text-muted-foreground">
                                    Your recent searches will appear here
                                  </div>
                                </div>
                              </div>
                            ) : (
                              searchHistory.slice(0, 5).map((historyItem) => (
                                <motion.button
                                  key={historyItem.id}
                                  whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }}
                                  onClick={() => handleHistoryItemClick(historyItem)}
                                  className="w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors hover:bg-secondary/50"
                                >
                                  <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                                    <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
                                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-foreground font-medium truncate text-xs">
                                        {historyItem.query}
                                      </div>
                                      <div className="text-muted-foreground text-xs truncate mt-0.5">
                                        {formatTimeAgo(historyItem.timestamp)}
                                      </div>
                                    </div>
                                  </div>
                                </motion.button>
                              ))
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {!selectionMode && activeTab === "recent" && (
                  <motion.div
                    key="recent"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Recent Saves
                      </span>
                      <div className="text-xs text-muted-foreground/60">Last 30 days</div>
                    </div>

                    <div className="space-y-1">
                      {recentDeals.map((deal) => (
                        <motion.div
                          key={deal.id}
                          whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }}
                          className="flex items-center justify-between p-2.5 rounded-lg transition-colors hover:bg-secondary/50"
                        >
                          <div className="flex items-center space-x-2 flex-1 min-w-0">
                            {/* Ticker */}
                            <div className="w-5 h-5 bg-secondary rounded-md flex items-center justify-center flex-shrink-0">
                              <span className="text-[8px] font-semibold text-foreground">
                                {deal.name.substring(0, 2).toUpperCase()}
                              </span>
                            </div>

                            {/* Name and Industry */}
                            <div className="flex-1 min-w-0">
                              <div className="text-foreground font-semibold text-xs truncate">{deal.name}</div>
                              <div className="text-muted-foreground text-[10px] truncate">
                                {deal.industry} • {deal.location}
                              </div>
                            </div>

                            {/* Revenue */}
                            <div className="text-foreground/70 text-[10px] font-medium flex-shrink-0">
                              {deal.revenue}
                            </div>
                          </div>

                          {/* Health Score */}
                          <div className="flex items-center space-x-1.5 flex-shrink-0 ml-2">
                            <div className={cn("w-1.5 h-1.5 rounded-full", getHealthColor(deal.health))} />
                            <div className="text-[10px] font-medium text-foreground/70">{deal.health}%</div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
