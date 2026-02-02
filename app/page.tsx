"use client"

import React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Plus, Search, X, Bookmark, List, Inbox } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { AppHeader } from "@/components/app-header"
import Image from "next/image"
import { useBulkActions } from "@/lib/bulk-actions-context"
import { useSavedDeals } from "@/lib/saved-deals-context"
import { useInbox } from "@/lib/inbox-context"
import { InboxProvider } from "@/lib/inbox-context"
import { SavedDealsProvider } from "@/lib/saved-deals-context"
import { BulkActionsProvider } from "@/lib/bulk-actions-context"
import { Badge } from "@/components/ui/badge"
import { ProfileMenu } from "@/components/profile-menu"

import { initialDeals, marketDeals } from "@/lib/mock-data"
import { LinearStyleFilters } from "@/components/linear-style-filters"
import { calculateAdjustedHealthScore } from "@/lib/deal-utils"
import { DealsAnalyticsVisualizer } from "@/components/deals-analytics-visualizer"
import { TrendingQueriesTicker } from "@/components/trending-queries-ticker"
import { FindDealsSearchView } from "@/components/find-deals-search-view"
import { PolicyHomeView } from "@/components/policy-home-view"
import { PolicyBuilderView } from "@/components/policy-builder-view"
import { SavedDealsView } from "@/components/saved-deals-view"
import { SavedQueriesView } from "@/components/saved-queries-view"
import { InboxView } from "@/components/inbox-view"
import { SettingsView } from "@/components/settings-view"
import { BookmarkedListsPanel } from "@/components/bookmarked-lists-panel"
import { BulkEmailComposer } from "@/components/bulk-email-composer"
import { FloatingChatInput } from "@/components/floating-chat-input"
import { toast } from "sonner"
import { ThemeToggle } from "@/components/theme-toggle"
import { InvoicesView } from "@/components/invoices-view"
import { CampaignsViewPage } from "@/components/campaigns-view-page"
import { ConversationalResultsView } from "@/components/conversational-results-view"

// Mock activity feed data - replace with actual data fetching
const activityFeedData = [
  {
    id: 1,
    title: "New deal added",
    description: "Acme Corp. - SaaS - $10M ARR",
    timestamp: "2 hours ago",
  },
  {
    id: 2,
    title: "Contacted by investor",
    description: "Beta Solutions - Fintech - $5M ARR",
    timestamp: "5 hours ago",
  },
  {
    id: 3,
    title: "Deal stage updated",
    description: "Gamma Industries - Manufacturing - $25M ARR",
    timestamp: "Yesterday",
  },
]

function HomePageContent() {
  const [isNewDealFlow, setIsNewDealFlow] = useState(false)
  const [isNewCampaignFlow, setIsNewCampaignFlow] = useState(false)
  const [deals, setDeals] = useState(initialDeals)
  const [activeTab, setActiveTab] = useState<
    "your-deals" | "find-deals" | "saved-queries" | "inbox" | "settings" | "watchlist" | "campaigns"
  >("your-deals")
  const [savedDealsActiveView, setSavedDealsActiveView] = useState<"watchlist" | "campaigns" | "inbox">("watchlist")
  const [selectedMarketDeal, setSelectedMarketDeal] = useState<any>(null)
  const [isSearchFilterFlow, setIsSearchFilterFlow] = useState(false)
  const [selectedPendingDeal, setSelectedPendingDeal] = useState<any>(null)
  const [activeFilters, setActiveFilters] = useState<any>(null)
  const router = useRouter()
  const [hasPerformedSearch, setHasPerformedSearch] = useState(false)
  const [isMorphing, setIsMorphing] = useState(false)
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null)
  const [hoveredDeal, setHoveredDeal] = useState<string | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [filteredMarketDeals, setFilteredMarketDeals] = useState(marketDeals)
  const [triggerSearchFilter, setTriggerSearchFilter] = useState(false)
  const [currentSection, setCurrentSection] = useState<string>("home")
  const [showLinearFilters, setShowLinearFilters] = useState(false)
  const [showBulkEmailComposer, setShowBulkEmailComposer] = useState(false)
  const [showBookmarkedListsPanel, setShowBookmarkedListsPanel] = useState(false)
  const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"table" | "conversational">("conversational")

  const { state, dispatch } = useBulkActions()
  const { state: savedDealsState, dispatch: savedDealsDispatch } = useSavedDeals()
  const savedDeals = savedDealsState.savedDeals
  const { state: inboxState } = useInbox()
  const inboxMessages = inboxState.messages

  const unreadCount = savedDealsState.communications.filter((c) => c.status === "unread").length

  const handleBulkEmail = () => {
    setShowBulkEmailComposer(true)
  }

  const handleBulkSave = () => {
    console.log("[v0] Bulk save to list:", state.selectedDeals)

    if (state.selectedDeals.length > 0) {
      const dealsToSave = [...state.selectedDeals]
      const dealCount = dealsToSave.length

      const isWatchlistContext = activeTab === "watchlist" && savedDealsActiveView === "watchlist"

      if (isWatchlistContext) {
        // Remove from watchlist
        console.log("[v0] Removing deals from watchlist:", dealsToSave)
        dealsToSave.forEach((deal) => {
          // Find the saved deal by matching the original deal ID
          const savedDeal = savedDeals.find((sd) => sd.id === deal.id)
          if (savedDeal) {
            savedDealsDispatch({ type: "UNSAVE_DEAL", payload: savedDeal.id })
          }
        })

        toast.success(`Removed ${dealCount} ${dealCount === 1 ? "deal" : "deals"} from Watchlist`)
      } else {
        // Add to watchlist
        console.log("[v0] About to save deals:", dealsToSave)

        dealsToSave.forEach((deal) => {
          console.log(`[v0] Dispatching deal:`, deal)
          console.log(`[v0] Deal name:`, deal?.name)
          console.log(`[v0] Deal object keys:`, Object.keys(deal || {}))

          savedDealsDispatch({ type: "SAVE_DEAL", payload: deal })
        })

        toast.custom(
          (t) =>
            renderWatchlistToast(t, `Added ${dealCount} ${dealCount === 1 ? "deal" : "deals"} to Watchlist`, () => {
              dealsToSave.forEach((deal) => {
                const savedDeal = savedDeals.find((sd) => sd.originalDeal.id === deal.id)
                if (savedDeal) {
                  savedDealsDispatch({ type: "UNSAVE_DEAL", payload: savedDeal.id })
                }
              })
            }),
          {
            duration: 5000,
          },
        )
      }

      dispatch({ type: "CLEAR_SELECTION" })
    }
  }

  const handleBulkExport = () => {
    // TODO: Implement bulk export functionality
    console.log("Bulk export")
  }

  const handleBulkEmailSent = (deals: any[]) => {
    setShowBulkEmailComposer(false)
    // TODO: Show success notification
    console.log(`Bulk email sent to ${deals.length} companies`)
  }

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc"
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const sortedMarketDeals = React.useMemo(() => {
    if (!sortConfig) return filteredMarketDeals

    return [...filteredMarketDeals].sort((a, b) => {
      const key = sortConfig.key as keyof typeof a
      let aValue: any = a[key]
      let bValue: any = b[key]

      if (sortConfig.key === "health") {
        aValue = calculateAdjustedHealthScore(a.health, a.industry)
        bValue = calculateAdjustedHealthScore(b.health, b.industry)
      }

      if (sortConfig.direction === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
  }, [filteredMarketDeals, sortConfig])

  useEffect(() => {
    if (activeTab !== "find-deals") {
      setHasPerformedSearch(false)
      setActiveFilters(null)
      setFilteredMarketDeals(marketDeals)
    } else {
      setHasPerformedSearch(true)
      setActiveFilters(null)
      setFilteredMarketDeals(marketDeals)
    }
  }, [activeTab])

  const handleCreateDeal = (dealData: { name: string; type: "buy" | "sell" }) => {
    const newDealId = dealData.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")

    const newDeal = {
      id: newDealId,
      name: dealData.name,
      type: dealData.type,
      stage: "Sourcing",
      health: 75,
      lastActivity: "Created just now",
    }

    setDeals((prevDeals) => [newDeal, ...prevDeals])
    setIsNewDealFlow(false)
    router.push(`/deal/${newDealId}?name=${encodeURIComponent(dealData.name)}`)
  }

  const handleMarketDealSelect = (deal: any) => {
    setSelectedMarketDeal(deal)
  }

  const handleAddToMyDeals = (marketDeal: any) => {
    const newDealId = marketDeal.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")

    const newDeal = {
      id: newDealId,
      name: marketDeal.name,
      type: "buy" as const,
      stage: "Initial Review",
      health: marketDeal.health,
      lastActivity: "Added from marketplace",
    }

    setDeals((prevDeals) => [newDeal, ...prevDeals])
    setSelectedMarketDeal(null)
    setActiveTab("your-deals")
    router.push(`/deal/${newDealId}?name=${encodeURIComponent(marketDeal.name)}`)
  }

  const handleReachOut = (marketDeal: any) => {
    const newDealId = marketDeal.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")

    const newDeal = {
      id: newDealId,
      name: marketDeal.name,
      type: "buy" as const,
      stage: "Pending LOI",
      health: marketDeal.health,
      lastActivity: "Outreach email sent",
    }

    setDeals((prevDeals) => [newDeal, ...prevDeals])
    setSelectedMarketDeal(null)
    setActiveTab("your-deals")
  }

  const handlePendingDealClick = (deal: any) => {
    setSelectedPendingDeal(deal)
  }

  const applyFilters = (filters: any) => {
    if (!filters) {
      setActiveFilters(null)
      setFilteredMarketDeals(marketDeals)
      return
    }

    setActiveFilters(filters)

    const filtered = marketDeals.filter((deal) => {
      if (filters.searchQuery && filters.searchQuery.trim()) {
        const query = filters.searchQuery.toLowerCase()
        const matchesName = deal.name?.toLowerCase().includes(query) || false
        const matchesDescription = deal.description?.toLowerCase().includes(query) || false
        const matchesIndustry = deal.industry?.toLowerCase().includes(query) || false
        const matchesLocation = deal.location?.toLowerCase().includes(query) || false

        const matchesKeywords =
          (query.includes("saas") && deal.industry === "SaaS") ||
          (query.includes("manufacturing") && deal.industry === "Manufacturing") ||
          (query.includes("healthcare") && deal.industry === "Healthcare") ||
          (query.includes("texas") && deal.location?.includes("TX")) ||
          (query.includes("growth") &&
            deal.keyMetrics?.growth &&
            Number.parseInt(deal.keyMetrics.growth.replace(/[^0-9]/g, "")) > 50) ||
          (query.includes("margins") &&
            deal.keyMetrics?.margins &&
            Number.parseInt(deal.keyMetrics.margins.replace(/[^0-9]/g, "")) > 30)

        if (!matchesName && !matchesDescription && !matchesIndustry && !matchesLocation && !matchesKeywords) {
          return false
        }
      }

      if (filters.industry && Array.isArray(filters.industry) && filters.industry.length > 0) {
        if (!filters.industry.includes(deal.industry)) {
          return false
        }
      }

      if (filters.location && Array.isArray(filters.location) && filters.location.length > 0) {
        if (!filters.location.includes(deal.location)) {
          return false
        }
      }

      if (filters.revenue && (filters.revenue.min !== undefined || filters.revenue.max !== undefined)) {
        const revenueValue = Number.parseFloat(deal.revenue?.replace(/[^0-9.]/g, "") || "0")
        if (filters.revenue.min !== undefined && revenueValue < filters.revenue.min) return false
        if (filters.revenue.max !== undefined && revenueValue > filters.revenue.max) return false
      }

      if (filters.employees && (filters.employees.min !== undefined || filters.employees.max !== undefined)) {
        const employeesValue = Number.parseInt(String(deal.employees || 0).replace(/[^0-9]/g, "") || "0")
        if (filters.employees.min !== undefined && employeesValue < filters.employees.min) return false
        if (filters.employees.max !== undefined && employeesValue > filters.employees.max) return false
      }

      if (filters.founded && (filters.founded.min !== undefined || filters.founded.max !== undefined)) {
        const foundedValue = Number.parseInt(String(deal.founded || 0))
        if (filters.founded.min !== undefined && foundedValue < filters.founded.min) return false
        if (filters.founded.max !== undefined && foundedValue > filters.founded.max) return false
      }

      if (filters.peRollupScore && Array.isArray(filters.peRollupScore) && filters.peRollupScore.length > 0) {
        if (!filters.peRollupScore.includes(deal.peRollupScore)) {
          return false
        }
      }
      // </CHANGE>

      if (filters.industries && filters.industries.length > 0) {
        if (!filters.industries.includes(deal.industry)) {
          return false
        }
      }

      if (filters.locations && filters.locations.length > 0) {
        if (!filters.locations.includes(deal.location)) {
          return false
        }
      }

      if (filters.revenueRange) {
        const revenueValue = Number.parseFloat(deal.revenue?.replace(/[^0-9.]/g, "") || "0")
        if (revenueValue < filters.revenueRange[0] || revenueValue > filters.revenueRange[1]) {
          return false
        }
      }

      if (filters.multipleRange) {
        const multipleValue = Number.parseFloat(deal.multiple?.replace("x", "") || "0")
        if (multipleValue < filters.multipleRange[0] || multipleValue > filters.multipleRange[1]) {
          return false
        }
      }

      if (filters.minHealthScore) {
        const adjustedHealth = calculateAdjustedHealthScore(deal.health, deal.industry)
        if (adjustedHealth < filters.minHealthScore) {
          return false
        }
      }

      return true
    })

    setFilteredMarketDeals(filtered)
  }

  const clearFilters = () => {
    setActiveFilters(null)
    setFilteredMarketDeals(marketDeals)
  }

  const getFilterSummary = () => {
    if (!activeFilters) return null

    const parts = []

    if (activeFilters.searchQuery && activeFilters.searchQuery.trim()) {
      const query = activeFilters.searchQuery.trim()
      parts.push(query.length > 30 ? `"${query.substring(0, 30)}..."` : `"${query}"`)
    }

    if (activeFilters.industry && Array.isArray(activeFilters.industry) && activeFilters.industry.length > 0) {
      if (activeFilters.industry.length === 1) {
        parts.push(activeFilters.industry[0])
      } else {
        parts.push(`${activeFilters.industry.length} industries`)
      }
    }

    if (activeFilters.location && Array.isArray(activeFilters.location) && activeFilters.location.length > 0) {
      if (activeFilters.location.length === 1) {
        parts.push(activeFilters.location[0])
      } else {
        parts.push(`${activeFilters.location.length} locations`)
      }
    }

    if (activeFilters.revenue && activeFilters.revenue.max !== undefined && activeFilters.revenue.max < 50) {
      parts.push(`Revenue ≤$${activeFilters.revenue.max}M`)
    }

    if (activeFilters.employees && activeFilters.employees.max !== undefined && activeFilters.employees.max < 1000) {
      parts.push(`Employees ≤${activeFilters.employees.max}`)
    }

    if (activeFilters.founded && activeFilters.founded.max !== undefined && activeFilters.founded.max < 2000) {
      parts.push(`Founded ≤${activeFilters.founded.max}`)
    }

    if (activeFilters.peRollupScore && activeFilters.peRollupScore.length > 0) {
      if (activeFilters.peRollupScore.length === 1) {
        parts.push(`${activeFilters.peRollupScore[0]} PE Score`)
      } else {
        parts.push(`${activeFilters.peRollupScore.length} PE Score levels`)
      }
    }
    // </CHANGE>

    if (activeFilters.industries && activeFilters.industries.length > 0) {
      if (activeFilters.industries.length === 1) {
        parts.push(activeFilters.industries[0])
      } else {
        parts.push(`${activeFilters.industries.length} industries`)
      }
    }

    if (activeFilters.locations && activeFilters.locations.length > 0) {
      if (activeFilters.locations.length === 1) {
        parts.push(activeFilters.locations[0])
      } else {
        parts.push(`${activeFilters.locations.length} locations`)
      }
    }

    if (activeFilters.revenueRange && activeFilters.revenueRange[1] < 50) {
      parts.push(`Revenue ≤$${activeFilters.revenueRange[1]}M`)
    }

    if (activeFilters.multipleRange && activeFilters.multipleRange[1] < 20) {
      parts.push(`Multiple ≤${activeFilters.multipleRange[1]}x`)
    }

    if (activeFilters.minHealthScore && activeFilters.minHealthScore > 0) {
      parts.push(`Health ≥${activeFilters.minHealthScore}%`)
    }

    return parts.length > 0 ? parts.join(", ") : null
  }

  const handleSearchSubmit = async (filters: any) => {
    setIsMorphing(true)

    applyFilters(filters)

    await new Promise((resolve) => setTimeout(resolve, 800))

    setHasPerformedSearch(true)
    setIsMorphing(false)
    setTriggerSearchFilter(false)
  }

  const handleSearchButtonClick = () => {
    console.log("[v0] Refine Search clicked - expanding natural language search")
  }

  const handleNavigate = (section: string) => {
    setCurrentSection(section)

    switch (section) {
      case "home":
        setActiveTab("your-deals")
        break
      case "find-deals":
        setActiveTab("find-deals")
        break
      case "watchlist":
        setActiveTab("watchlist")
        break
      case "saved-queries":
        setActiveTab("saved-queries")
        break
      case "inbox":
        setActiveTab("inbox")
        break
      case "settings":
        setActiveTab("settings")
        break
      case "campaigns":
        setActiveTab("campaigns")
        break
      default:
        setActiveTab("your-deals")
    }
  }

const getHeaderTitle = () => {
  switch (activeTab) {
  case "your-deals":
  return "Spend Overview"
  case "find-deals":
  return "Policy Builder"
  case "watchlist":
  return "Invoices"
  case "saved-queries":
  return "Reports"
  case "inbox":
  return "Inbox"
  case "settings":
  return "Settings"
  case "campaigns":
  return "Integrations"
      default:
        return "Policy"
    }
  }

const getHeaderDescription = () => {
  switch (activeTab) {
  case "your-deals":
  return "Monitor agent spending and policy compliance"
  case "find-deals":
  return "Create and manage spending policies for agent transactions"
  case "watchlist":
  return "View invoices and sync with your ERP systems"
  case "saved-queries":
  return "Analytics and spending reports"
  case "inbox":
  return "Notifications and alerts"
  case "settings":
  return "Configure your preferences"
  case "campaigns":
  return "Connect payment providers and tools"
      default:
        return "Manage agent spend policies and controls"
    }
  }

  const handleApplySavedQuery = (query: any) => {
    setActiveTab("find-deals")
    setCurrentSection("find-deals") // Ensure navigation bar also updates
    applyFilters({
      searchQuery: query.searchQuery,
      ...query.filters,
    })
    setHasPerformedSearch(true)
    setShowBookmarkedListsPanel(false)
  }

  const handleBookmarkDeal = (deal: any) => {
    console.log("[v0] handleBookmarkDeal called with deal:", Array.isArray(deal) ? `${deal.length} deals` : deal.name)

    if (!Array.isArray(deal)) {
      savedDealsDispatch({ type: "SAVE_DEAL", payload: deal })

      toast.custom(
        (t) =>
          renderWatchlistToast(t, `Added ${deal.name} to Watchlist`, () => {
            const savedDeal = savedDeals.find((sd) => sd.originalDeal.id === deal.id)
            if (savedDeal) {
              savedDealsDispatch({ type: "UNSAVE_DEAL", payload: savedDeal.id })
            }
          }),
        {
          duration: 5000,
        },
      )
    }
  }

  const handleDealSaved = (deal: any) => {
    dispatch({ type: "CLEAR_SELECTION" })
  }

  const handleBookmarkedPanelClose = () => {
    setShowBookmarkedListsPanel(false)
  }

  const renderWatchlistToast = (t: string | number, message: string, onUndo: () => void) => (
    <div
      onClick={() => {
        setShowBookmarkedListsPanel(true)
        toast.dismiss(t)
      }}
      className="bg-background border border-border rounded-lg shadow-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors flex items-center justify-between gap-4 min-w-[300px]"
    >
      <div className="flex items-center gap-3">
        <div className="w-2 h-2 bg-green-500 rounded-full" />
        <p className="text-sm font-medium">{message}</p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={(e) => {
          e.stopPropagation()
          onUndo()
          toast.dismiss(t)
          toast.success("Removed from Watchlist")
        }}
        className="h-8 px-3 text-xs flex-shrink-0"
      >
        Undo
      </Button>
    </div>
  )

  const handleIndustrySelect = (industry: string | null) => {
    console.log("[v0] Industry selected:", industry)
    setSelectedIndustry(industry === selectedIndustry ? null : industry)
  }

  const handleNewCampaign = () => {
    setIsNewCampaignFlow(true)
  }

  useEffect(() => {
    const handleTriggerNewCampaign = () => {
      handleNewCampaign()
    }

    window.addEventListener("trigger-new-campaign", handleTriggerNewCampaign)
    return () => window.removeEventListener("trigger-new-campaign", handleTriggerNewCampaign)
  }, [])

  const handleAddToCampaignFromModal = (company: any) => {
    // Add the company to bulk selection
    dispatch({ type: "TOGGLE_DEAL_SELECTION", payload: company })
    // Close the modal (already handled in modal component)
    setSelectedMarketDeal(null)
    // Show success message
    toast.success(`${company.name} added to selection`)
  }

  const handleSearchSimilarFromModal = (company: any) => {
    // Create filters based on the company's attributes
    const similarFilters = {
      searchQuery: `${company.industry} companies similar to ${company.name}`,
      industry: [company.industry],
      location: company.location ? [company.location] : undefined,
      // Add revenue range based on the company's revenue
      revenue: company.revenue
        ? {
            min: Math.max(0, Number.parseFloat(company.revenue.replace(/[^0-9.]/g, "")) * 0.5),
            max: Number.parseFloat(company.revenue.replace(/[^0-9.]/g, "")) * 1.5,
          }
        : undefined,
    }

    // Apply the filters and trigger search
    setActiveTab("find-deals")
    setCurrentSection("find-deals")
    handleSearchSubmit(similarFilters)
    setSelectedMarketDeal(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        className="p-0 rounded-lg border-border/50 border-0 bg-transparent"
        animate={{
          filter:
            isNewDealFlow ||
            selectedMarketDeal ||
            selectedPendingDeal ||
            isSearchFilterFlow ||
            isMorphing ||
            triggerSearchFilter ||
            showBulkEmailComposer ||
            showBookmarkedListsPanel
              ? "blur(4px)"
              : "blur(0px)",
        }}
        transition={{ duration: 0.3 }}
      >
        <header className="z-10 bg-background">
          <div className="max-w-7xl mx-auto px-6 my-0 pt-4">
            <div className="relative flex items-center justify-between leading-7 py-2">
              <div className="flex items-center space-x-0">
                <Image
                  src="/glogo.svg"
                  alt="Gordon AI Logo"
                  width={24}
                  height={24}
                  className="rounded-none mx-3.5 px-px dark:invert"
                />
                <h1 className="text-primary font-semibold tracking-tighter font-serif leading-6 text-xl">
                  Agentic Commerce Platform
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                {activeTab === "find-deals" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowBookmarkedListsPanel(true)}
                    className="flex items-center gap-2"
                  >
                    <Bookmark className="h-4 w-4" />
                    <span className="hidden sm:inline">Lists</span>
                  </Button>
                )}
                {activeTab === "watchlist" && (
                  <div className="flex items-center space-x-1 mr-4">
                    <Button
                      variant={savedDealsActiveView === "watchlist" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSavedDealsActiveView("watchlist")}
                      className="h-8 px-4"
                    >
                      <List className="h-4 w-4 mr-2" />
                      Watchlist
                    </Button>
                    <Button
                      variant={savedDealsActiveView === "inbox" ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setSavedDealsActiveView("inbox")}
                      className="h-8 px-4 relative"
                    >
                      <Inbox className="h-4 w-4 mr-2" />
                      Inbox
                      {unreadCount > 0 && (
                        <Badge className="ml-2 h-5 px-1.5 text-xs bg-red-500 text-white border-0">{unreadCount}</Badge>
                      )}
                    </Button>
                  </div>
                )}
                <ThemeToggle />
                <ProfileMenu onNavigateToSettings={() => setActiveTab("settings")} />
              </div>
            </div>
          </div>
        </header>

{/* Trending ticker removed for spend management platform */}

        <main className="max-w-7xl mx-auto px-6 py-0 mt-2">
<AppHeader title={getHeaderTitle()} description={getHeaderDescription()}>
                            {activeTab === "campaigns" && (
                              <Button size="sm" onClick={handleNewCampaign} className="bg-black text-white hover:bg-black/90">
                                <Plus className="h-4 w-4 mr-2" />
                                New Integration
                              </Button>
                            )}
                          </AppHeader>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-12 gap-y-6">
            <div className="lg:col-span-12 relative">
              <AnimatePresence mode="wait">
{activeTab === "your-deals" && (
                                  <motion.div
                                    key="your-deals-view"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                                  >
                                    <PolicyHomeView onNavigate={handleNavigate} />
                                  </motion.div>
                                )}

                {activeTab === "find-deals" && (
                  <motion.div
                    key="policy-builder-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className="h-[calc(100vh-120px)] -mx-6"
                  >
                    <PolicyBuilderView />
                  </motion.div>
                )}

                {activeTab === "saved-queries" && (
                  <motion.div
                    key="saved-queries-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <Card className="relative overflow-hidden">
                      <CardHeader>
                        <div className="flex items-center justify-between gap-4"></div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="min-h-[calc(100vh-150px)] overflow-y-auto">
                          <SavedQueriesView onApplyQuery={handleApplySavedQuery} />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {activeTab === "inbox" && (
                  <motion.div
                    key="inbox-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <Card className="relative overflow-hidden">
                      <CardHeader>
                        <div className="flex items-center justify-between gap-4"></div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="min-h-[calc(100vh-150px)] overflow-y-auto">
                          <InboxView />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {activeTab === "settings" && (
                  <motion.div
                    key="settings-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <Card className="relative overflow-hidden">
                      <CardHeader>
                        <div className="flex items-center justify-between gap-4"></div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="min-h-[calc(100vh-150px)] overflow-y-auto">
                          <SettingsView />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {activeTab === "watchlist" && (
                  <motion.div
                    key="invoices-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <InvoicesView />
                  </motion.div>
                )}

                {activeTab === "campaigns" && (
                  <motion.div
                    key="campaigns-view"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <Card className="relative overflow-hidden">
                      <CardHeader>
                        <div className="flex items-center justify-between gap-4"></div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="min-h-[calc(100vh-150px)] overflow-y-auto">
                          <CampaignsViewPage />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </motion.div>

      <BookmarkedListsPanel
        isOpen={showBookmarkedListsPanel}
        onClose={handleBookmarkedPanelClose}
        onApplyQuery={handleApplySavedQuery}
        selectionMode={state.isSelectionMode}
        selectedDeal={state.selectedDeals}
        onDealSaved={handleDealSaved}
      />

      <AnimatePresence>
        {showBulkEmailComposer && (
          <BulkEmailComposer onClose={() => setShowBulkEmailComposer(false)} onSent={handleBulkEmailSent} />
        )}
      </AnimatePresence>

      <FloatingChatInput
        triggerNewDeal={isNewDealFlow}
        onNewDealClose={() => setIsNewDealFlow(false)}
        onDealCreated={handleCreateDeal}
        selectedMarketDeal={selectedMarketDeal}
        onMarketDealClose={() => setSelectedMarketDeal(null)}
        onAddToMyDeals={handleAddToMyDeals}
        onReachOut={handleReachOut}
        selectedPendingDeal={selectedPendingDeal}
        onPendingDealClose={() => setSelectedPendingDeal(null)}
        triggerSearchFilter={triggerSearchFilter}
        onSearchFilterClose={() => setTriggerSearchFilter(false)}
        onApplyFilters={applyFilters}
        activeFilters={activeFilters}
        isInFindDealsView={activeTab === "find-deals"}
        hasPerformedSearch={hasPerformedSearch}
        onNavigate={handleNavigate}
        currentSection={currentSection}
        onBookmarkDeal={handleBookmarkDeal}
        isWatchlistContext={activeTab === "watchlist" && savedDealsActiveView === "watchlist"}
        triggerNewCampaign={isNewCampaignFlow}
        onNewCampaignClose={() => setIsNewCampaignFlow(false)}
        onNewCampaignTrigger={handleNewCampaign}
        onAddToCampaignFromModal={handleAddToCampaignFromModal}
        onSearchSimilarFromModal={handleSearchSimilarFromModal}
      />
    </div>
  )
}

export default function HomePage() {
  return (
    <BulkActionsProvider>
      <SavedDealsProvider>
        <InboxProvider>
          <HomePageContent />
        </InboxProvider>
      </SavedDealsProvider>
    </BulkActionsProvider>
  )
}
