"use client"

import type React from "react"
import { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ChevronRight, ArrowLeft } from "lucide-react"
import { getSectorByName, type SubSector } from "@/lib/sector-hierarchy"

// Mock analytics data based on the existing deal structure
const dealsOverTimeData = [
  { month: "Jan", deals: 12, value: 45.2 },
  { month: "Feb", deals: 18, value: 62.8 },
  { month: "Mar", deals: 15, value: 58.1 },
  { month: "Apr", deals: 22, value: 78.4 },
  { month: "May", deals: 28, value: 95.6 },
  { month: "Jun", deals: 24, value: 87.3 },
  { month: "Jul", deals: 31, value: 112.7 },
  { month: "Aug", deals: 35, value: 128.9 },
  { month: "Sep", deals: 29, value: 105.2 },
  { month: "Oct", deals: 38, value: 142.6 },
  { month: "Nov", deals: 42, value: 156.8 },
  { month: "Dec", deals: 45, value: 168.4 },
]

const industryTrendData: Record<string, any[]> = {
  Technology: [
    { month: "Jan", deals: 4, value: 15.2 },
    { month: "Feb", deals: 6, value: 22.8 },
    { month: "Mar", deals: 5, value: 19.1 },
    { month: "Apr", deals: 7, value: 28.4 },
    { month: "May", deals: 9, value: 35.6 },
    { month: "Jun", deals: 8, value: 31.3 },
    { month: "Jul", deals: 10, value: 42.7 },
    { month: "Aug", deals: 12, value: 48.9 },
    { month: "Sep", deals: 10, value: 40.2 },
    { month: "Oct", deals: 13, value: 52.6 },
    { month: "Nov", deals: 14, value: 58.8 },
    { month: "Dec", deals: 15, value: 65.4 },
  ],
  Healthcare: [
    { month: "Jan", deals: 3, value: 12.2 },
    { month: "Feb", deals: 4, value: 16.8 },
    { month: "Mar", deals: 4, value: 15.1 },
    { month: "Apr", deals: 5, value: 20.4 },
    { month: "May", deals: 6, value: 25.6 },
    { month: "Jun", deals: 6, value: 23.3 },
    { month: "Jul", deals: 7, value: 30.7 },
    { month: "Aug", deals: 8, value: 35.9 },
    { month: "Sep", deals: 7, value: 28.2 },
    { month: "Oct", deals: 9, value: 38.6 },
    { month: "Nov", deals: 10, value: 42.8 },
    { month: "Dec", deals: 11, value: 48.4 },
  ],
  Manufacturing: [
    { month: "Jan", deals: 2, value: 8.2 },
    { month: "Feb", deals: 3, value: 11.8 },
    { month: "Mar", deals: 3, value: 10.1 },
    { month: "Apr", deals: 4, value: 14.4 },
    { month: "May", deals: 5, value: 18.6 },
    { month: "Jun", deals: 4, value: 16.3 },
    { month: "Jul", deals: 6, value: 22.7 },
    { month: "Aug", deals: 7, value: 26.9 },
    { month: "Sep", deals: 6, value: 21.2 },
    { month: "Oct", deals: 8, value: 28.6 },
    { month: "Nov", deals: 9, value: 32.8 },
    { month: "Dec", deals: 10, value: 36.4 },
  ],
  "Financial Services": [
    { month: "Jan", deals: 2, value: 6.2 },
    { month: "Feb", deals: 3, value: 8.8 },
    { month: "Mar", deals: 2, value: 7.1 },
    { month: "Apr", deals: 3, value: 10.4 },
    { month: "May", deals: 4, value: 13.6 },
    { month: "Jun", deals: 4, value: 12.3 },
    { month: "Jul", deals: 5, value: 16.7 },
    { month: "Aug", deals: 6, value: 19.9 },
    { month: "Sep", deals: 5, value: 15.2 },
    { month: "Oct", deals: 6, value: 20.6 },
    { month: "Nov", deals: 7, value: 23.8 },
    { month: "Dec", deals: 8, value: 27.4 },
  ],
  Energy: [
    { month: "Jan", deals: 1, value: 3.2 },
    { month: "Feb", deals: 2, value: 5.8 },
    { month: "Mar", deals: 1, value: 4.1 },
    { month: "Apr", deals: 2, value: 6.4 },
    { month: "May", deals: 3, value: 8.6 },
    { month: "Jun", deals: 2, value: 7.3 },
    { month: "Jul", deals: 3, value: 10.7 },
    { month: "Aug", deals: 4, value: 12.9 },
    { month: "Sep", deals: 3, value: 9.2 },
    { month: "Oct", deals: 4, value: 13.6 },
    { month: "Nov", deals: 5, value: 15.8 },
    { month: "Dec", deals: 6, value: 18.4 },
  ],
  "Real Estate": [
    { month: "Jan", deals: 1, value: 2.2 },
    { month: "Feb", deals: 1, value: 3.8 },
    { month: "Mar", deals: 1, value: 3.1 },
    { month: "Apr", deals: 2, value: 4.4 },
    { month: "May", deals: 2, value: 5.6 },
    { month: "Jun", deals: 2, value: 5.3 },
    { month: "Jul", deals: 3, value: 7.7 },
    { month: "Aug", deals: 3, value: 8.9 },
    { month: "Sep", deals: 3, value: 7.2 },
    { month: "Oct", deals: 4, value: 9.6 },
    { month: "Nov", deals: 4, value: 10.8 },
    { month: "Dec", deals: 5, value: 12.4 },
  ],
}

const timeRanges = ["2023", "2024", "YTD", "3M"]

interface DealsAnalyticsVisualizerProps {
  selectedIndustry?: string | null
  onIndustrySelect?: (industry: string) => void
}

export function DealsAnalyticsVisualizer({ selectedIndustry, onIndustrySelect }: DealsAnalyticsVisualizerProps) {
  const [selectedTimeRange, setSelectedTimeRange] = useState("YTD")
  const [hoveredIndustry, setHoveredIndustry] = useState<string | null>(null)
  const [drillDownSector, setDrillDownSector] = useState<string | null>(null)
  const [selectedSubSector, setSelectedSubSector] = useState<SubSector | null>(null)

  const chartData = useMemo(() => {
    const baseData =
      selectedIndustry && industryTrendData[selectedIndustry] ? industryTrendData[selectedIndustry] : dealsOverTimeData

    // Filter data based on selected time range
    switch (selectedTimeRange) {
      case "3M":
        // Show last 3 months
        return baseData.slice(-3)
      case "YTD":
        // Show year-to-date (Jan to current month, simulating Oct as current)
        return baseData.slice(0, 10)
      case "2024":
        // Show all 12 months of 2024
        return baseData
      case "2023":
        // Show all 12 months of 2023 (using same data structure for demo)
        return baseData.map((item) => ({
          ...item,
          deals: Math.floor(item.deals * 0.7), // Simulate lower 2023 numbers
          value: item.value * 0.7,
        }))
      default:
        return baseData
    }
  }, [selectedIndustry, selectedTimeRange])

  const filteredIndustryData = useMemo(() => {
    // Helper function to get data slice based on time range
    const getDataSlice = (data: any[]) => {
      switch (selectedTimeRange) {
        case "3M":
          return data.slice(-3)
        case "YTD":
          return data.slice(0, 10)
        case "2024":
          return data
        case "2023":
          return data.map((item) => ({
            ...item,
            deals: Math.floor(item.deals * 0.7),
            value: item.value * 0.7,
          }))
        default:
          return data
      }
    }

    // Calculate totals for each industry based on time range
    const calculatedIndustryData = Object.keys(industryTrendData).map((industry) => {
      const data = getDataSlice(industryTrendData[industry])
      const totalDeals = data.reduce((sum, item) => sum + item.deals, 0)
      const totalValue = data.reduce((sum, item) => sum + item.value, 0)

      // Calculate growth (comparing first and last data points)
      const firstValue = data[0]?.value || 0
      const lastValue = data[data.length - 1]?.value || 0
      const growthPercent = firstValue > 0 ? Math.round(((lastValue - firstValue) / firstValue) * 100) : 0

      return {
        industry,
        deals: totalDeals,
        value: totalValue,
        growth: `${growthPercent > 0 ? "+" : ""}${growthPercent}%`,
      }
    })

    // Sort by deals count descending
    calculatedIndustryData.sort((a, b) => b.deals - a.deals)

    // Calculate percentages based on total deals
    const totalDeals = calculatedIndustryData.reduce((sum, item) => sum + item.deals, 0)
    return calculatedIndustryData.map((item) => ({
      ...item,
      percentage: totalDeals > 0 ? (item.deals / totalDeals) * 100 : 0,
    }))
  }, [selectedTimeRange])

  const { totalDeals, totalValue, avgGrowth } = useMemo(() => {
    if (selectedIndustry) {
      const industryInfo = filteredIndustryData.find((i) => i.industry === selectedIndustry)
      if (industryInfo) {
        return {
          totalDeals: industryInfo.deals,
          totalValue: industryInfo.value,
          avgGrowth: industryInfo.growth,
        }
      }
    }
    return {
      totalDeals: filteredIndustryData.reduce((sum, item) => sum + item.deals, 0),
      totalValue: filteredIndustryData.reduce((sum, item) => sum + item.value, 0),
      avgGrowth:
        filteredIndustryData.length > 0
          ? `+${Math.round(
              filteredIndustryData.reduce((sum, item) => sum + Number.parseInt(item.growth), 0) /
                filteredIndustryData.length,
            )}%`
          : "+0%",
    }
  }, [selectedIndustry, filteredIndustryData])

  const handleIndustryClick = (industry: string) => {
    console.log("[v0] Industry clicked in visualizer:", industry)
    const sectorData = getSectorByName(industry)
    if (sectorData && sectorData.subSectors.length > 0) {
      setDrillDownSector(industry)
      setSelectedSubSector(null)
    }
    onIndustrySelect?.(industry)
  }

  const handleBackToSectors = () => {
    setDrillDownSector(null)
    setSelectedSubSector(null)
  }

  const handleSubSectorClick = (subSector: SubSector) => {
    setSelectedSubSector(subSector)
    console.log("[v0] Sub-sector selected:", subSector.name)
  }

  const handleClearIndustry = (e: React.MouseEvent) => {
    e.stopPropagation()
    console.log("[v0] Clearing industry selection")
    setDrillDownSector(null)
    setSelectedSubSector(null)
    onIndustrySelect?.(null as any)
  }

  const currentSectorData = drillDownSector ? getSectorByName(drillDownSector) : null

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="bg-card border-0 rounded-2xl overflow-hidden shadow-sm">
        <CardHeader className="px-8 pt-8 pb-6">
          <div className="flex items-center justify-between">
            {/* M&A Trends pill on the left */}
            <div
              className="flex items-center gap-[3px] h-6 px-3 text-sm font-normal border-transparent text-neutral-200 border-0 rounded-xl"
              style={{
                boxShadow: `
                  rgba(0, 0, 0, 0.45) 0px 51px 85px 0px,
                  rgba(0, 0, 0, 0.33) 0px 30.029px 44.336px 0px,
                  rgba(0, 0, 0, 0.25) 0px 15.422px 20.808px 0px,
                  rgba(0, 0, 0, 0.12) 0px 1.387px 3.944px 0px
                `,
                background: `
                  linear-gradient(rgb(20, 20, 25), rgb(20, 20, 25)) padding-box,
                  conic-gradient(from 180deg,
                    rgba(255, 255, 255, 0.1) -0.45deg,
                    rgba(255, 255, 255, 0.04) 39.67deg,
                    rgba(255, 255, 255, 0.03) 72.85deg,
                    rgba(255, 255, 255, 0.14) 150.13deg,
                    rgba(255, 255, 255, 0.08) 193.06deg,
                    rgba(255, 255, 255, 0.04) 225.01deg,
                    rgba(255, 255, 255, 0.02) 304.51deg,
                    rgba(255, 255, 255, 0.1) 359.55deg,
                    rgba(255, 255, 255, 0.04) 399.67deg
                  ) border-box
                `,
                borderWidth: "0.63px",
                fontWeight: 500,
                lineHeight: "19.6px",
                cursor: "default",
                fontSize: "8pt",
                boxSizing: "border-box",
              }}
            >
              <span className="font-sans">{selectedIndustry ? `${selectedIndustry} trends` : "Mid-market trends"}</span>
              {selectedIndustry && (
                <button
                  onClick={handleClearIndustry}
                  className="ml-1 hover:bg-white/10 rounded-full p-0.5 transition-colors"
                  aria-label="Clear industry filter"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="opacity-60 hover:opacity-100"
                  >
                    <path
                      d="M9 3L3 9M3 3L9 9"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}
            </div>

            {/* Numbers moved to the right */}
            <div className="flex items-end gap-8">
              <div className="flex flex-col">
                <div className="text-foreground mb-1 tracking-tight font-semibold text-xl">{totalDeals}</div>
                <div className="text-muted-foreground font-medium text-xs">Tracked Deals</div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-baseline gap-2">
                  <span className="text-foreground tracking-tight font-semibold text-xl">
                    ${totalValue.toFixed(1)}M
                  </span>
                  <div className="text-emerald-600 dark:text-emerald-400 text-sm font-medium px-2 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50">
                    {avgGrowth}
                  </div>
                </div>
                <div className="text-muted-foreground font-medium text-xs">Tracked Value</div>
              </div>
            </div>
          </div>
        </CardHeader>

        <div className="relative h-64 mb-6 px-8">
          <ChartContainer
            config={{
              deals: {
                label: "Deals",
                color: "hsl(var(--primary))",
              },
              value: {
                label: "Value ($M)",
                color: "hsl(var(--muted-foreground))",
              },
            }}
            className="h-full w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  className="text-xs"
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                  className="text-xs"
                />
                <ChartTooltip
                  content={<ChartTooltipContent />}
                  cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                />
                <Line
                  type="monotone"
                  dataKey="deals"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, stroke: "hsl(var(--primary))", strokeWidth: 2, fill: "hsl(var(--background))" }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="hsl(var(--muted-foreground))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  activeDot={{
                    r: 4,
                    stroke: "hsl(var(--muted-foreground))",
                    strokeWidth: 2,
                    fill: "hsl(var(--background))",
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <div className="flex items-center justify-between px-8 pb-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-primary rounded-full" />
              <span className="text-muted-foreground text-xs">Deals</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-0.5 bg-muted-foreground rounded-full opacity-60"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(to right, hsl(var(--muted-foreground)) 0, hsl(var(--muted-foreground)) 3px, transparent 3px, transparent 8px)",
                }}
              />
              <span className="text-muted-foreground text-xs">Value</span>
            </div>
          </div>
          <div className="flex items-center bg-muted/50 rounded-lg p-1">
            {timeRanges.map((range) => (
              <button
                key={range}
                onClick={() => setSelectedTimeRange(range)}
                className={`px-3 py-1.5 rounded-md transition-all duration-200 text-xs font-medium ${
                  selectedTimeRange === range
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <CardContent className="px-8 pb-8">
          <AnimatePresence mode="wait">
            {drillDownSector && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 flex items-center gap-2"
              >
                <button
                  onClick={handleBackToSectors}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>All Sectors</span>
                </button>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{drillDownSector}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {!drillDownSector ? (
              <motion.div
                key="main-sectors"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {filteredIndustryData.map((industry, index) => {
                  const sectorData = getSectorByName(industry.industry)
                  const hasSubSectors = sectorData && sectorData.subSectors.length > 0

                  return (
                    <motion.div
                      key={industry.industry}
                      className={`flex items-center justify-between rounded-lg transition-colors cursor-pointer group py-1 px-1 ${
                        selectedIndustry === industry.industry
                          ? "bg-primary/10 hover:bg-primary/15"
                          : "hover:bg-muted/30"
                      }`}
                      onClick={() => handleIndustryClick(industry.industry)}
                      onHoverStart={() => setHoveredIndustry(industry.industry)}
                      onHoverEnd={() => setHoveredIndustry(null)}
                      whileHover={{ scale: 1.01 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            selectedIndustry === industry.industry ? "bg-primary" : "bg-primary/80"
                          }`}
                        />
                        <span
                          className={`font-medium text-xs ${
                            selectedIndustry === industry.industry ? "text-primary" : "text-foreground"
                          }`}
                        >
                          {industry.industry}
                        </span>
                        {hasSubSectors && (
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground font-mono">{industry.deals} deals</span>
                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 min-w-[60px] text-right">
                          {industry.growth}
                        </span>

                        <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${
                              selectedIndustry === industry.industry ? "bg-primary" : "bg-primary/80"
                            }`}
                            initial={{ width: 0 }}
                            animate={{ width: `${industry.percentage}%` }}
                            transition={{ duration: 0.8, delay: index * 0.1 }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            ) : (
              <motion.div
                key="sub-sectors"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                {currentSectorData?.subSectors.map((subSector, index) => (
                  <motion.div
                    key={subSector.id}
                    className={`flex items-center justify-between rounded-lg transition-colors cursor-pointer group py-1 px-1 ${
                      selectedSubSector?.id === subSector.id ? "bg-primary/10 hover:bg-primary/15" : "hover:bg-muted/30"
                    }`}
                    onClick={() => handleSubSectorClick(subSector)}
                    whileHover={{ scale: 1.01 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          selectedSubSector?.id === subSector.id ? "bg-primary" : "bg-primary/60"
                        }`}
                      />
                      <span
                        className={`font-medium text-xs ${
                          selectedSubSector?.id === subSector.id ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {subSector.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm text-muted-foreground font-mono">{subSector.deals} deals</span>
                      <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400 min-w-[60px] text-right">
                        {subSector.growth}
                      </span>

                      <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            selectedSubSector?.id === subSector.id ? "bg-primary" : "bg-primary/60"
                          }`}
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(subSector.deals / (currentSectorData?.subSectors.reduce((sum, s) => sum + s.deals, 0) || 1)) * 100}%`,
                          }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  )
}
