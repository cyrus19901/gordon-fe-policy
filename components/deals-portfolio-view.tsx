"use client"

import type React from "react"

import { useState, useMemo, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { X, Search, ChevronDown, ChevronRight, Pause, Play, Trash2 } from "lucide-react"
import { useSavedDeals } from "@/lib/saved-deals-context"
import { useBulkActions } from "@/lib/bulk-actions-context"
import { cn } from "@/lib/utils"
import { CompanyDetailModal } from "@/components/company-detail-modal"

// Define Campaign and OutreachStats types if they are not globally available
type CampaignStatus = "active" | "paused" | "completed"
interface OutreachStats {
  sent: number
  received: number
  replied: number
  interested: number
}
interface Campaign {
  id: string
  name: string
  description: string
  status: CampaignStatus
  createdAt: string
  tags: string[]
  outreachStats: OutreachStats
}

// Define the prop types for DealsPortfolioView
interface DealsPortfolioViewProps {
  viewMode?: "all" | "watchlist" | "campaigns"
}

const getStageInfo = (stage: string) => {
  const stageMap: Record<
    string,
    {
      label: string
      dotColor: string
    }
  > = {
    saved: {
      label: "Saved",
      dotColor: "bg-slate-500",
    },
    contacted: {
      label: "Contacted",
      dotColor: "bg-blue-500",
    },
    interested: {
      label: "Interested",
      dotColor: "bg-green-500",
    },
    not_interested: {
      label: "Not Interested",
      dotColor: "bg-red-500",
    },
    negotiating: {
      label: "Negotiating",
      dotColor: "bg-amber-500",
    },
    due_diligence: {
      label: "Due Diligence",
      dotColor: "bg-purple-500",
    },
    closed_won: {
      label: "Closed Won",
      dotColor: "bg-emerald-500",
    },
    closed_lost: {
      label: "Closed Lost",
      dotColor: "bg-gray-400",
    },
  }

  return (
    stageMap[stage] || {
      label: stage,
      dotColor: "bg-gray-400",
    }
  )
}
// </CHANGE>

const MetricCard = ({
  title,
  value,
  change,
}: {
  title: string
  value: React.ReactNode
  change?: string
}) => (
  <div className="p-4 rounded-lg bg-transparent">
    <p className="text-xs text-muted-foreground mb-1">{title}</p>
    <div className="flex items-baseline gap-2">
      <p className="text-foreground text-xl font-semibold">{value}</p>
      {change && <p className="text-sm font-semibold text-green-600">{change}</p>}
    </div>
  </div>
)

export function DealsPortfolioView({ viewMode = "all" }: DealsPortfolioViewProps) {
  const { state, dispatch } = useSavedDeals()
  const { state: bulkState, dispatch: bulkDispatch } = useBulkActions()
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set())
  const [hoveredCell, setHoveredCell] = useState<{ date: string; count: number; stages: any } | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [filters, setFilters] = useState<{
    stages?: string[]
    industries?: string[]
    dateRange?: { start: string; end: string; label?: string } // Added label for display
    metric?: "saved" | "interested" | "not_reached"
    locations?: string[] // Added location filter
    lastContacted?: string // Added lastContacted filter
  }>({})
  const [weekOffset, setWeekOffset] = useState(0)
  const [activeFilters, setActiveFilters] = useState<Set<string>>(new Set())
  const [showFilterMenu, setShowFilterMenu] = useState(false)
  const stageDropdownRef = useRef<HTMLDivElement>(null)
  const industryDropdownRef = useRef<HTMLDivElement>(null)
  const locationDropdownRef = useRef<HTMLDivElement>(null) // Ref for location dropdown
  const filterMenuRef = useRef<HTMLDivElement>(null)

  const [campaignSort, setCampaignSort] = useState<"recent" | "performance" | "name">("recent")
  const [campaignStatusFilter, setCampaignStatusFilter] = useState<"all" | "active" | "paused" | "completed">("all")

  const [showAISuggestions, setShowAISuggestions] = useState(false)
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set())

  const [selectedCompany, setSelectedCompany] = useState<any | null>(null)
  const [showCompanyDetail, setShowCompanyDetail] = useState(false)

  const [selectedMetric, setSelectedMetric] = useState<"saved" | "interested" | "not_reached" | null>(null)

  const [groupBy, setGroupBy] = useState<"dateAdded" | "campaign" | "stage" | "industry" | "location">("dateAdded")

  const [monthOffset, setMonthOffset] = useState(0)

  const aiSuggestedCompanies = useMemo(
    () => [
      { id: "ai-1", name: "Quantum Analytics Inc", industry: "SaaS", reason: "High growth potential in AI analytics" },
      { id: "ai-2", name: "NeuralTech Solutions", industry: "Technology", reason: "Strong fit for your portfolio" },
      { id: "ai-3", name: "DataFlow Systems", industry: "SaaS", reason: "Similar to your successful deals" },
      { id: "ai-4", name: "CloudScale Ventures", industry: "Technology", reason: "Trending in your target market" },
      { id: "ai-5", name: "EdgeCompute Labs", industry: "Technology", reason: "Matches your investment criteria" },
    ],
    [],
  )

  useEffect(() => {
    const allCampaignIds = new Set(state.campaigns.map((c) => c.id))
    setExpandedCampaigns(allCampaignIds)
  }, [state.campaigns])

  const sortedAndFilteredCampaigns = useMemo(() => {
    let campaigns = [...state.campaigns]

    // Filter by status
    if (campaignStatusFilter !== "all") {
      campaigns = campaigns.filter((c) => c.status === campaignStatusFilter)
    }

    // Sort campaigns
    campaigns.sort((a, b) => {
      switch (campaignSort) {
        case "recent":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case "performance":
          const aPerformance = a.outreachStats.interested / Math.max(a.outreachStats.sent, 1)
          const bPerformance = b.outreachStats.interested / Math.max(b.outreachStats.sent, 1)
          return bPerformance - aPerformance
        case "name":
          return a.name.localeCompare(b.name)
        default:
          return 0
      }
    })

    return campaigns
  }, [state.campaigns, campaignSort, campaignStatusFilter])

  const getCampaignPerformance = (campaign: Campaign) => {
    const { sent, received, replied, interested } = campaign.outreachStats
    if (sent === 0) return { openRate: 0, replyRate: 0, interestRate: 0 }

    return {
      openRate: Math.round((received / sent) * 100),
      replyRate: Math.round((replied / sent) * 100),
      interestRate: Math.round((interested / sent) * 100),
    }
  }

  const getPerformanceColor = (rate: number) => {
    if (rate >= 70) return "text-green-600 dark:text-green-400"
    if (rate >= 40) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  const isClickOutsideRefs = (target: any, refs: React.RefObject<HTMLDivElement>[]) => {
    if (!(target instanceof Node)) return true
    return refs.every((ref) => ref.current && !ref.current.contains(target))
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside dropdown refs
      if (
        isClickOutsideRefs(event.target, [stageDropdownRef, industryDropdownRef, locationDropdownRef, filterMenuRef])
      ) {
        setOpenDropdown(null)
        setShowFilterMenu(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const [searchQuery, setSearchQuery] = useState("")

  const filteredDeals = useMemo(() => {
    let deals = [...state.savedDeals]

    if (searchQuery) {
      deals = deals.filter(
        (d) =>
          d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
          d.location.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    // Apply filters
    if (filters.stages?.length) {
      deals = deals.filter((d) => filters.stages!.includes(d.pipelineStage))
    }
    if (filters.industries?.length) {
      deals = deals.filter((d) => filters.industries!.includes(d.industry))
    }
    if (filters.locations?.length) {
      deals = deals.filter((d) => filters.locations!.some((loc) => d.location.includes(loc)))
    }
    if (filters.dateRange) {
      deals = deals.filter((d) => {
        const dealDate = new Date(d.savedDate)
        return dealDate >= new Date(filters.dateRange!.start) && dealDate <= new Date(filters.dateRange!.end)
      })
    }
    if (filters.lastContacted) {
      const now = new Date()
      deals = deals.filter((d) => {
        if (!d.lastContactDate) return filters.lastContacted === "never"
        const lastContact = new Date(d.lastContactDate)
        const daysDiff = Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24))

        switch (filters.lastContacted) {
          case "last7days":
            return daysDiff <= 7
          case "last30days":
            return daysDiff <= 30
          case "last90days":
            return daysDiff <= 90
          case "never":
            return false
          default:
            return true
        }
      })
    }

    return deals
  }, [state.savedDeals, filters, searchQuery])

  const sortedAndGroupedDeals = useMemo(() => {
    const deals = [...filteredDeals]

    if (groupBy === "dateAdded") {
      deals.sort((a, b) => new Date(b.savedDate).getTime() - new Date(a.savedDate).getTime())

      const groups: { [key: string]: typeof deals } = {}
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const sevenDaysAgo = new Date(today)
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      deals.forEach((deal) => {
        const dealDate = new Date(deal.savedDate)
        dealDate.setHours(0, 0, 0, 0)

        let groupKey: string
        if (dealDate.getTime() === today.getTime()) {
          groupKey = "Today"
        } else if (dealDate >= sevenDaysAgo) {
          groupKey = "Last 7 Days"
        } else {
          groupKey = dealDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })
        }

        if (!groups[groupKey]) groups[groupKey] = []
        groups[groupKey].push(deal)
      })

      return groups
    } else if (groupBy === "campaign") {
      deals.sort((a, b) => {
        if (!a.campaignId && !b.campaignId) return 0
        if (!a.campaignId) return 1
        if (!b.campaignId) return -1

        const campaignA = state.campaigns.find((c) => c.id === a.campaignId)
        const campaignB = state.campaigns.find((c) => c.id === b.campaignId)

        return (campaignA?.name || "").localeCompare(campaignB?.name || "")
      })

      const groups: { [key: string]: typeof deals } = {}
      deals.forEach((deal) => {
        const campaign = state.campaigns.find((c) => c.id === deal.campaignId)
        const groupKey = campaign?.name || "No Campaign"
        if (!groups[groupKey]) groups[groupKey] = []
        groups[groupKey].push(deal)
      })

      return groups
    } else if (groupBy === "stage") {
      const groups: { [key: string]: typeof deals } = {}
      deals.forEach((deal) => {
        const groupKey = deal.pipelineStage || "Unknown"
        if (!groups[groupKey]) groups[groupKey] = []
        groups[groupKey].push(deal)
      })
      return groups
    } else if (groupBy === "industry") {
      const groups: { [key: string]: typeof deals } = {}
      deals.forEach((deal) => {
        const groupKey = deal.industry || "Unknown"
        if (!groups[groupKey]) groups[groupKey] = []
        groups[groupKey].push(deal)
      })
      return groups
    } else if (groupBy === "location") {
      const groups: { [key: string]: typeof deals } = {}
      deals.forEach((deal) => {
        const groupKey = deal.location || "Unknown"
        if (!groups[groupKey]) groups[groupKey] = []
        groups[groupKey].push(deal)
      })
      return groups
    }

    return {}
  }, [filteredDeals, groupBy, state.campaigns])

  const areAllDealsInGroupSelected = (deals: typeof filteredDeals) => {
    return deals.every((deal) => bulkState.selectedDeals.some((selected) => selected.id === deal.id))
  }

  const toggleAllDealsInGroup = (deals: typeof filteredDeals) => {
    const allSelected = areAllDealsInGroupSelected(deals)
    deals.forEach((deal) => {
      const isSelected = bulkState.selectedDeals.some((selected) => selected.id === deal.id)
      if (allSelected && isSelected) {
        bulkDispatch({ type: "TOGGLE_DEAL_SELECTION", payload: deal })
      } else if (!allSelected && !isSelected) {
        bulkDispatch({ type: "TOGGLE_DEAL_SELECTION", payload: deal })
      }
    })
  }

  const watchlistMetrics = useMemo(() => {
    const totalCompanies = filteredDeals.length
    const contacted = filteredDeals.filter((d) =>
      ["contacted", "interested", "not_interested", "negotiating", "due_diligence"].includes(d.pipelineStage),
    ).length
    const interested = filteredDeals.filter((d) => d.pipelineStage === "interested").length
    const activeCampaigns = state.campaigns.filter((c) => c.status === "active").length
    const avgResponseRate = contacted > 0 ? Math.round((interested / contacted) * 100) : 0

    return {
      totalCompanies,
      contacted,
      interested,
      activeCampaigns,
      avgResponseRate,
    }
  }, [filteredDeals, state.campaigns])

  const getCellColorFromStages = (stageCounts: Record<string, number>, totalCount: number) => {
    if (totalCount === 0) return "bg-muted/60 border-border/40 hover:border-border/60 hover:bg-muted/70"

    // Calculate percentages for each stage
    const stagePercentages = Object.entries(stageCounts).map(([stage, count]) => ({
      stage,
      percentage: count / totalCount,
      count,
    }))

    // Sort by count to find dominant stage
    stagePercentages.sort((a, b) => b.count - a.count)
    const dominantStage = stagePercentages[0]

    // Define stage colors with intensity levels
    const stageColors: Record<string, { light: string[]; dark: string[] }> = {
      saved: {
        light: ["bg-slate-100", "bg-slate-200", "bg-slate-300"],
        dark: ["dark:bg-slate-900/30", "dark:bg-slate-800/50", "dark:bg-slate-700/70"],
      },
      contacted: {
        light: ["bg-blue-100", "bg-blue-200", "bg-blue-300"],
        dark: ["dark:bg-blue-900/30", "dark:bg-blue-800/50", "dark:bg-blue-700/70"],
      },
      interested: {
        light: ["bg-green-100", "bg-green-200", "bg-green-400"],
        dark: ["dark:bg-green-900/30", "dark:bg-green-800/50", "dark:bg-green-700"],
      },
      not_interested: {
        light: ["bg-red-100", "bg-red-200", "bg-red-300"],
        dark: ["dark:bg-red-900/30", "dark:bg-red-800/50", "dark:bg-red-700/70"],
      },
      negotiating: {
        light: ["bg-amber-100", "bg-amber-200", "bg-amber-300"],
        dark: ["dark:bg-amber-900/30", "dark:bg-amber-800/50", "dark:bg-amber-700/70"],
      },
      due_diligence: {
        light: ["bg-purple-100", "bg-purple-200", "bg-purple-300"],
        dark: ["dark:bg-purple-900/30", "dark:bg-purple-800/50", "dark:bg-purple-700/70"],
      },
    }

    // Get intensity level based on count
    let intensityIndex = 0
    if (totalCount > 5) intensityIndex = 2
    else if (totalCount > 2) intensityIndex = 1

    const colors = stageColors[dominantStage.stage] || stageColors.saved
    const borderColors: Record<string, string[]> = {
      saved: ["border-slate-200", "border-slate-300", "border-slate-400"],
      contacted: ["border-blue-200", "border-blue-300", "border-blue-400"],
      interested: ["border-green-200", "border-green-300", "border-green-500"],
      not_interested: ["border-red-200", "border-red-300", "border-red-400"],
      negotiating: ["border-amber-200", "border-amber-300", "border-amber-400"],
      due_diligence: ["border-purple-200", "border-purple-300", "border-purple-400"],
    }

    const darkBorderColors: Record<string, string[]> = {
      saved: ["dark:border-slate-800/50", "dark:border-slate-700/70", "dark:border-slate-600"],
      contacted: ["dark:border-blue-800/50", "dark:border-blue-700/70", "dark:border-blue-600"],
      interested: ["dark:border-green-800/50", "dark:border-green-700/70", "dark:border-green-600"],
      not_interested: ["dark:border-red-800/50", "dark:border-red-700/70", "dark:border-red-600"],
      negotiating: ["dark:border-amber-800/50", "dark:border-amber-700/70", "dark:border-amber-600"],
      due_diligence: ["dark:border-purple-800/50", "dark:border-purple-700/70", "dark:border-purple-600"],
    }

    const border = borderColors[dominantStage.stage] || borderColors.saved
    const darkBorder = darkBorderColors[dominantStage.stage] || darkBorderColors.saved

    return cn(
      colors.light[intensityIndex],
      colors.dark[intensityIndex],
      border[intensityIndex],
      darkBorder[intensityIndex],
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Watchlist View */}
      {(viewMode === "all" || viewMode === "watchlist") && viewMode === "watchlist" && (
        <>
          <div className="mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-3">
              <div className="bg-gradient-to-br from-card to-card/50 border border-border/60 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-300">
                {/* Header with title and navigation */}

                {/* Month labels */}
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 3 }).map((_, monthIndex) => {
                    const monthDate = new Date()
                    monthDate.setMonth(monthDate.getMonth() - (2 - monthIndex) - monthOffset * 3)
                    const monthName = monthDate.toLocaleDateString("en-US", { month: "short" })

                    return (
                      <div key={monthIndex} className="flex-1 text-center">
                        <span className="text-[10px] font-semibold text-foreground/70 uppercase tracking-wider">
                          {monthName}
                        </span>
                      </div>
                    )
                  })}
                </div>

                {/* Activity Calendar Grid */}
                <div className="space-y-1.5">
                  {Array.from({ length: 5 }).map((_, dayIndex) => (
                    <div key={dayIndex} className="flex gap-1.5">
                      {Array.from({ length: 13 }).map((_, weekIndex) => {
                        const date = new Date()
                        date.setDate(date.getDate() - (12 - weekIndex) * 7 - dayIndex - monthOffset * 91)
                        const dateStr = date.toISOString().split("T")[0]

                        const dayDeals = filteredDeals.filter((d) => {
                          const dealDate = new Date(d.savedDate).toISOString().split("T")[0]
                          return dealDate === dateStr
                        })

                        const count = dayDeals.length
                        const stageCounts = dayDeals.reduce(
                          (acc, deal) => {
                            acc[deal.pipelineStage] = (acc[deal.pipelineStage] || 0) + 1
                            return acc
                          },
                          {} as Record<string, number>,
                        )

                        const isInDateRange =
                          filters.dateRange &&
                          new Date(dateStr) >= new Date(filters.dateRange.start) &&
                          new Date(dateStr) <= new Date(filters.dateRange.end)

                        const cellColor = getCellColorFromStages(stageCounts, count)

                        return (
                          <div
                            key={weekIndex}
                            className={cn(
                              "w-[16px] h-[16px] rounded-md cursor-pointer transition-all duration-200 border",
                              cellColor,
                              "hover:scale-125 hover:shadow-md hover:z-10 relative",
                              isInDateRange && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                            )}
                            onMouseEnter={(e) => {
                              if (count > 0) {
                                setHoveredCell({ date: dateStr, count, stages: stageCounts })
                                setMousePos({ x: e.clientX, y: e.clientY })
                              }
                            }}
                            onMouseMove={(e) => {
                              if (count > 0) {
                                setMousePos({ x: e.clientX, y: e.clientY })
                              }
                            }}
                            onMouseLeave={() => setHoveredCell(null)}
                            onClick={() => {
                              if (count > 0) {
                                setFilters((prev) => ({
                                  ...prev,
                                  dateRange: {
                                    start: dateStr,
                                    end: dateStr,
                                    label: new Date(dateStr).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                    }),
                                  },
                                }))
                              }
                            }}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>

                {/* Legend */}
              </div>
              {/* </CHANGE> */}

              {/* Metrics - Minimal and Balanced */}
              <div className="bg-card border border-border/40 rounded-lg p-4 shadow-sm hover:shadow transition-shadow">
                <div className="flex justify-between h-full gap-6 items-center flex-row px-6">
                  {/* Total Companies */}
                  <div className="flex flex-col justify-center flex-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Total Companies
                    </p>
                    <p className="text-xl font-semibold text-foreground">{watchlistMetrics.totalCompanies}</p>
                  </div>

                  {/* Divider */}
                  <div className="h-12 w-px bg-border/40" />

                  {/* Contacted */}
                  <div className="flex flex-col justify-center flex-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Contacted
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-xl font-semibold text-foreground">{watchlistMetrics.contacted}</p>
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                        {watchlistMetrics.totalCompanies > 0
                          ? Math.round((watchlistMetrics.contacted / watchlistMetrics.totalCompanies) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-12 w-px bg-border/40" />

                  {/* Interested */}
                  <div className="flex flex-col justify-center flex-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Interested
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-xl font-semibold text-foreground">{watchlistMetrics.interested}</p>
                      <span className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                        {watchlistMetrics.contacted > 0
                          ? Math.round((watchlistMetrics.interested / watchlistMetrics.contacted) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-12 w-px bg-border/40" />

                  {/* Active Campaigns */}
                  <div className="flex flex-col justify-center flex-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Active Campaigns
                    </p>
                    <p className="text-xl font-semibold text-foreground">{watchlistMetrics.activeCampaigns}</p>
                  </div>

                  {/* Divider */}
                  <div className="h-12 w-px bg-border/40" />

                  {/* Response Rate */}
                  <div className="flex flex-col justify-center flex-1">
                    <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                      Response Rate
                    </p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-xl font-semibold text-foreground">{watchlistMetrics.avgResponseRate}%</p>
                      {watchlistMetrics.avgResponseRate > 0 && (
                        <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">
                          +{watchlistMetrics.avgResponseRate}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grouping segmented control and search */}
          <div className="flex items-center gap-4 mb-9 justify-between">
            {/* Grouping segmented control with label */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">View by</span>
              <div className="inline-flex rounded-lg border border-border bg-muted/30 p-1">
                <button
                  onClick={() => setGroupBy("dateAdded")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    groupBy === "dateAdded"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Date
                </button>
                <button
                  onClick={() => setGroupBy("campaign")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    groupBy === "campaign"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Campaign
                </button>
                <button
                  onClick={() => setGroupBy("stage")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    groupBy === "stage"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Stage
                </button>
                <button
                  onClick={() => setGroupBy("industry")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    groupBy === "industry"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Industry
                </button>
                <button
                  onClick={() => setGroupBy("location")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    groupBy === "location"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Location
                </button>
              </div>
            </div>

            <div className="relative w-56 focus-within:w-96 transition-all duration-300 ease-out">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
              <Input
                type="text"
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-8 h-9 text-sm bg-muted/30 border-border/50 focus:bg-background focus:border-border transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-sm transition-colors z-10"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* Grouped table rendering */}
          <div className="flex-1 overflow-auto">
            {Object.entries(sortedAndGroupedDeals).map(([groupName, deals], groupIndex) => (
              <div key={groupName} className={cn("mb-6", groupIndex > 0 && "mt-8")}>
                {/* Group Header */}
                <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-border/50 px-4 mb-2 border-b-0 py-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-foreground text-xs font-semibold tracking-tight">{groupName}</h3>
                    <Badge variant="secondary" className="h-4 px-1.5 text-[10px] font-medium">
                      {deals.length}
                    </Badge>
                  </div>
                </div>

                {/* Table for this group */}
                <div className="bg-secondary/30 dark:bg-zinc-950/60 border border-border/50 dark:border-white/[0.05] rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50 dark:border-white/[0.05] bg-muted/30">
                        <th className="w-10 px-4 py-2">
                          <Checkbox
                            checked={areAllDealsInGroupSelected(deals)}
                            onCheckedChange={() => toggleAllDealsInGroup(deals)}
                          />
                        </th>
                        <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground/80 tracking-tight">
                          Company
                        </th>
                        <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground/80 tracking-tight">
                          Industry
                        </th>
                        <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground/80 tracking-tight">
                          Stage
                        </th>
                        <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground/80 tracking-tight">
                          Last Contacted
                        </th>
                        <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground/80 tracking-tight">
                          Revenue
                        </th>
                        <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground/80 tracking-tight">
                          Location
                        </th>
                        <th className="text-left px-4 py-2 text-[11px] font-medium text-muted-foreground/80 tracking-tight">
                          Campaign
                        </th>
                        <th className="w-10 px-4 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {deals.map((deal) => {
                        const campaign = state.campaigns.find((c) => c.id === deal.campaignId)
                        const isSelected = bulkState.selectedDeals.some((selected) => selected.id === deal.id)
                        const stageInfo = getStageInfo(deal.pipelineStage)

                        return (
                          <tr
                            key={deal.id}
                            className="border-b border-border/50 dark:border-white/[0.05] last:border-b-0 h-10 hover:bg-secondary/50 dark:hover:bg-zinc-900/60 transition-colors group cursor-pointer"
                            onClick={(e) => {
                              const target = e.target as HTMLElement
                              if (
                                !target.closest("button") &&
                                !target.closest('[role="checkbox"]') &&
                                !target.closest("input")
                              ) {
                                setSelectedCompany(deal)
                              }
                              // </CHANGE>
                            }}
                          >
                            <td className="px-4 py-1" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => {
                                  bulkDispatch({ type: "TOGGLE_DEAL_SELECTION", payload: deal })
                                }}
                              />
                            </td>
                            <td className="px-4 py-1">
                              <span className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                                {deal.name}
                              </span>
                              {/* </CHANGE> */}
                            </td>
                            <td className="px-4 py-1">
                              <span className="text-[10px] text-muted-foreground">{deal.industry}</span>
                            </td>
                            <td className="px-4 py-1">
                              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 border border-border/50">
                                <div className={cn("w-1.5 h-1.5 rounded-full", stageInfo.dotColor)} />
                                <span className="text-[10px] font-medium text-foreground/80">{stageInfo.label}</span>
                              </div>
                            </td>
                            <td className="px-4 py-1">
                              <span className="text-[10px] text-muted-foreground">
                                {deal.lastContactDate ? new Date(deal.lastContactDate).toLocaleDateString() : "Never"}
                              </span>
                            </td>
                            <td className="px-4 py-1">
                              <span className="text-[10px] text-muted-foreground">{deal.revenue || "N/A"}</span>
                            </td>
                            <td className="px-4 py-1">
                              <span className="text-[10px] text-muted-foreground">{deal.location}</span>
                            </td>
                            <td className="px-4 py-1" onClick={(e) => e.stopPropagation()}>
                              {campaign ? (
                                <button
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 hover:bg-primary/20 border border-primary/20 hover:border-primary/30 transition-all text-xs font-medium text-primary"
                                  onClick={() => {
                                    window.dispatchEvent(
                                      new CustomEvent("show-campaign-details", {
                                        detail: { campaign },
                                      }),
                                    )
                                  }}
                                >
                                  {campaign.name}
                                </button>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2.5 text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
                                  onClick={() => {
                                    bulkDispatch({ type: "TOGGLE_DEAL_SELECTION", payload: deal })
                                    bulkDispatch({ type: "OPEN_BULK_CAMPAIGN" })
                                  }}
                                >
                                  Add to campaign
                                </Button>
                              )}
                              {/* </CHANGE> */}
                            </td>
                            <td className="px-4 py-1" onClick={(e) => e.stopPropagation()}>
                              {deal.campaignId ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-muted transition-colors"
                                  onClick={() => {
                                    const campaignName = state.campaigns.find((c) => c.id === deal.campaignId)?.name
                                    if (
                                      confirm(
                                        `Remove ${deal.name} from ${campaignName}? The company will remain in your watchlist.`,
                                      )
                                    ) {
                                      dispatch({
                                        type: "UPDATE_DEAL",
                                        payload: {
                                          dealId: deal.id,
                                          updates: { campaignId: undefined },
                                        },
                                      })
                                    }
                                  }}
                                  title="Remove from campaign"
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                                </Button>
                              ) : (
                                <div className="h-6 w-6" />
                              )}
                              {/* </CHANGE> */}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          {/* Activity Tooltip */}
          {hoveredCell && (
            <div
              className="fixed z-[9999] bg-background border border-border rounded-lg shadow-xl p-3 pointer-events-none"
              style={{
                left: mousePos.x + 10,
                top: mousePos.y + 10,
              }}
            >
              <div className="text-xs font-semibold mb-2">
                {new Date(hoveredCell.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
              <div className="space-y-1">
                {Object.entries(hoveredCell.stages).map(([stage, count]) => (
                  <div key={stage} className="flex items-center gap-2 text-xs">
                    <div className={cn("w-2 h-2 rounded-full", getStageInfo(stage).dotColor)} />
                    <span className="text-muted-foreground">{stage}:</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
                <div className="pt-1 mt-1 border-t border-border flex items-center gap-2 text-xs font-semibold">
                  <span>Total:</span>
                  <span>{hoveredCell.count}</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Saved Deals View - keeping existing implementation */}

      {/* Campaigns View */}
      {(viewMode === "all" || viewMode === "campaigns") && viewMode === "campaigns" && (
        <>
          <div className="mb-6">
            <div className="bg-card border border-border/40 rounded-lg p-4 shadow-sm hover:shadow transition-shadow">
              <div className="flex justify-between h-full gap-6 items-center flex-row px-6">
                {/* Total Campaigns */}
                <div className="flex flex-col justify-center flex-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Total Campaigns
                  </p>
                  <p className="text-xl font-semibold text-foreground">{sortedAndFilteredCampaigns.length}</p>
                </div>

                {/* Divider */}
                <div className="h-12 w-px bg-border/40" />

                {/* Active Campaigns */}
                <div className="flex flex-col justify-center flex-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Active</p>
                  <p className="text-xl font-semibold text-green-600 dark:text-green-400">
                    {sortedAndFilteredCampaigns.filter((c) => c.status === "active").length}
                  </p>
                </div>

                {/* Divider */}
                <div className="h-12 w-px bg-border/40" />

                {/* Paused Campaigns */}
                <div className="flex flex-col justify-center flex-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Paused</p>
                  <p className="text-xl font-semibold text-yellow-600 dark:text-yellow-400">
                    {sortedAndFilteredCampaigns.filter((c) => c.status === "paused").length}
                  </p>
                </div>

                {/* Divider */}
                <div className="h-12 w-px bg-border/40" />

                {/* Total Sent */}
                <div className="flex flex-col justify-center flex-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Total Sent
                  </p>
                  <p className="text-xl font-semibold text-foreground">
                    {sortedAndFilteredCampaigns.reduce((acc, c) => acc + c.outreachStats.sent, 0)}
                  </p>
                </div>

                {/* Divider */}
                <div className="h-12 w-px bg-border/40" />

                {/* Response Rate */}
                <div className="flex flex-col justify-center flex-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">
                    Response Rate
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl font-semibold text-foreground">
                      {sortedAndFilteredCampaigns.reduce((acc, c) => acc + c.outreachStats.sent, 0) > 0
                        ? Math.round(
                            (sortedAndFilteredCampaigns.reduce((acc, c) => acc + c.outreachStats.replied, 0) /
                              sortedAndFilteredCampaigns.reduce((acc, c) => acc + c.outreachStats.sent, 0)) *
                              100,
                          )
                        : 0}
                      %
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Campaign Filters */}
          <div className="flex items-center gap-4 mb-6 justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Sort by</span>
              <div className="inline-flex rounded-lg border border-border bg-muted/30 p-1">
                <button
                  onClick={() => setCampaignSort("recent")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    campaignSort === "recent"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Recent
                </button>
                <button
                  onClick={() => setCampaignSort("performance")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    campaignSort === "performance"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Performance
                </button>
                <button
                  onClick={() => setCampaignSort("name")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    campaignSort === "name"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Name
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">Status</span>
              <div className="inline-flex rounded-lg border border-border bg-muted/30 p-1">
                <button
                  onClick={() => setCampaignStatusFilter("all")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    campaignStatusFilter === "all"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  All
                </button>
                <button
                  onClick={() => setCampaignStatusFilter("active")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    campaignStatusFilter === "active"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Active
                </button>
                <button
                  onClick={() => setCampaignStatusFilter("paused")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    campaignStatusFilter === "paused"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Paused
                </button>
                <button
                  onClick={() => setCampaignStatusFilter("completed")}
                  className={cn(
                    "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                    campaignStatusFilter === "completed"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  Completed
                </button>
              </div>
            </div>
          </div>

          {/* Campaign List */}
          <div className="flex-1 overflow-auto space-y-4">
            {sortedAndFilteredCampaigns.map((campaign) => {
              const isExpanded = expandedCampaigns.has(campaign.id)
              const campaignDeals = state.savedDeals.filter((deal) => deal.campaignId === campaign.id)
              const performance = getCampaignPerformance(campaign)

              return (
                <div
                  key={campaign.id}
                  className="bg-secondary/30 dark:bg-zinc-950/60 border border-border/50 dark:border-white/[0.05] rounded-xl overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start gap-4">
                      {/* Expand/Collapse Button */}
                      <button
                        onClick={() => {
                          const newExpanded = new Set(expandedCampaigns)
                          if (newExpanded.has(campaign.id)) {
                            newExpanded.delete(campaign.id)
                          } else {
                            newExpanded.add(campaign.id)
                          }
                          setExpandedCampaigns(newExpanded)
                        }}
                        className="mt-1 p-1 hover:bg-muted rounded-md transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>

                      {/* Campaign Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-sm font-semibold text-foreground">{campaign.name}</h3>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => {
                              const newStatus = campaign.status === "active" ? "paused" : "active"
                              dispatch({
                                type: "UPDATE_CAMPAIGN",
                                payload: {
                                  campaignId: campaign.id,
                                  updates: { status: newStatus as "active" | "paused" | "completed" },
                                },
                              })
                            }}
                            title={campaign.status === "active" ? "Pause campaign" : "Resume campaign"}
                          >
                            {campaign.status === "active" ? (
                              <Pause className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400" />
                            ) : (
                              <Play className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${campaign.name}"?`)) {
                                dispatch({
                                  type: "DELETE_CAMPAIGN",
                                  payload: campaign.id,
                                })
                              }
                            }}
                            title="Delete campaign"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                          </Button>
                          {/* </CHANGE> */}
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-[10px] font-medium px-2 py-0.5",
                              campaign.status === "active" &&
                                "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-800/50",
                              campaign.status === "paused" &&
                                "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-800/50",
                              campaign.status === "completed" &&
                                "bg-gray-50 dark:bg-gray-950/30 text-gray-700 dark:text-gray-400 border-gray-200/50 dark:border-gray-800/50",
                            )}
                          >
                            {campaign.status}
                          </Badge>
                          <Badge variant="outline" className="text-[10px] font-medium px-2 py-0.5">
                            {campaignDeals.length} companies
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-3">{campaign.description}</p>

                        {/* Performance Metrics */}
                        <div className="flex items-center gap-6">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Sent:</span>
                            <span className="text-xs font-semibold">{campaign.outreachStats.sent}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Open Rate:</span>
                            <span className={cn("text-xs font-semibold", getPerformanceColor(performance.openRate))}>
                              {performance.openRate}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Reply Rate:</span>
                            <span className={cn("text-xs font-semibold", getPerformanceColor(performance.replyRate))}>
                              {performance.replyRate}%
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Interest Rate:</span>
                            <span
                              className={cn("text-xs font-semibold", getPerformanceColor(performance.interestRate))}
                            >
                              {performance.interestRate}%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* </CHANGE> */}
                    </div>

                    {/* Expanded Campaign Details */}
                    {isExpanded && campaignDeals.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <h4 className="text-xs font-semibold mb-3">Campaign Companies</h4>
                        <div className="space-y-2">
                          {campaignDeals.slice(0, 5).map((deal) => {
                            const stageInfo = getStageInfo(deal.pipelineStage)
                            return (
                              <div
                                key={deal.id}
                                className="flex items-center justify-between p-2 rounded-lg bg-background/50 hover:bg-background transition-colors group"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <span className="text-xs font-semibold truncate">{deal.name}</span>
                                  <span className="text-[10px] text-muted-foreground">{deal.industry}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 border border-border/50">
                                    <div className={cn("w-1.5 h-1.5 rounded-full", stageInfo.dotColor)} />
                                    <span className="text-[10px] font-medium text-foreground/80">
                                      {stageInfo.label}
                                    </span>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
                                    onClick={() => {
                                      if (
                                        confirm(
                                          `Remove ${deal.name} from ${campaign.name}? The company will remain in your watchlist.`,
                                        )
                                      ) {
                                        dispatch({
                                          type: "UPDATE_DEAL",
                                          payload: {
                                            dealId: deal.id,
                                            updates: { campaignId: undefined },
                                          },
                                        })
                                      }
                                    }}
                                    title="Remove from campaign"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                                  </Button>
                                  {/* </CHANGE> */}
                                </div>
                              </div>
                            )
                          })}
                          {campaignDeals.length > 5 && (
                            <p className="text-xs text-muted-foreground text-center pt-2">
                              +{campaignDeals.length - 5} more companies
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}

            {/* Empty State */}
            {sortedAndFilteredCampaigns.length === 0 && (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground mb-1">No campaigns found</p>
                  <p className="text-xs text-muted-foreground">
                    {campaignStatusFilter !== "all"
                      ? `No ${campaignStatusFilter} campaigns`
                      : "Create a campaign to get started"}
                  </p>
                </div>
              </div>
            )}
          </div>
          {/* </CHANGE> */}
        </>
      )}

      <CompanyDetailModal
        isOpen={!!selectedCompany}
        onClose={() => setSelectedCompany(null)}
        company={selectedCompany}
        onChatModeChange={(companyId, companyName) => {
          // Handle chat mode change - open floating chat with company context
          window.dispatchEvent(
            new CustomEvent("open-company-chat", {
              detail: { companyId, companyName },
            }),
          )
        }}
      />
    </div>
  )
}
