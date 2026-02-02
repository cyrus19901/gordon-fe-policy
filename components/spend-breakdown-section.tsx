"use client"

import React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import {
  Cloud,
  Plane,
  Cpu,
  Database,
  ShoppingCart,
  Code2,
  Globe,
  Server,
  Bot,
} from "lucide-react"

type TransactionType = "all" | "agent-to-agent" | "agent-to-merchant"

interface SpendCategory {
  id: string
  name: string
  icon: React.ElementType
  color: string
  agentToAgent: number
  agentToMerchant: number
}

const spendCategories: SpendCategory[] = [
  {
    id: "cloud",
    name: "Cloud Computing",
    icon: Cloud,
    color: "#3b82f6",
    agentToAgent: 45230,
    agentToMerchant: 128450,
  },
  {
    id: "ai",
    name: "AI/ML Models",
    icon: Cpu,
    color: "#8b5cf6",
    agentToAgent: 67890,
    agentToMerchant: 89320,
  },
  {
    id: "storage",
    name: "Data Storage",
    icon: Database,
    color: "#10b981",
    agentToAgent: 23450,
    agentToMerchant: 34560,
  },
  {
    id: "software",
    name: "Software & APIs",
    icon: Code2,
    color: "#f97316",
    agentToAgent: 12340,
    agentToMerchant: 56780,
  },
  {
    id: "infra",
    name: "Infrastructure",
    icon: Server,
    color: "#64748b",
    agentToAgent: 8920,
    agentToMerchant: 45670,
  },
  {
    id: "travel",
    name: "Travel & Logistics",
    icon: Plane,
    color: "#0ea5e9",
    agentToAgent: 0,
    agentToMerchant: 23450,
  },
  {
    id: "saas",
    name: "SaaS Subscriptions",
    icon: Globe,
    color: "#ec4899",
    agentToAgent: 5670,
    agentToMerchant: 67890,
  },
  {
    id: "supplies",
    name: "Office & Supplies",
    icon: ShoppingCart,
    color: "#f59e0b",
    agentToAgent: 0,
    agentToMerchant: 12340,
  },
]

function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`
  }
  return `$${amount}`
}

function formatFullCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function SpendBreakdownSection() {
  const [filter, setFilter] = useState<TransactionType>("all")
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null)

  // Calculate totals
  const totalAgentToAgent = spendCategories.reduce((sum, cat) => sum + cat.agentToAgent, 0)
  const totalAgentToMerchant = spendCategories.reduce((sum, cat) => sum + cat.agentToMerchant, 0)
  const totalBudget = totalAgentToAgent + totalAgentToMerchant

  // Get filtered categories with their amounts
  const getFilteredAmount = (cat: SpendCategory) => {
    if (filter === "agent-to-agent") return cat.agentToAgent
    if (filter === "agent-to-merchant") return cat.agentToMerchant
    return cat.agentToAgent + cat.agentToMerchant
  }

  const filteredCategories = spendCategories
    .map((cat) => ({ ...cat, amount: getFilteredAmount(cat) }))
    .filter((cat) => cat.amount > 0)
    .sort((a, b) => b.amount - a.amount)

  const filteredTotal =
    filter === "agent-to-agent"
      ? totalAgentToAgent
      : filter === "agent-to-merchant"
        ? totalAgentToMerchant
        : totalBudget

  // SVG dimensions
  const svgWidth = 900
  const svgHeight = 400
  const nodeWidth = 20
  const leftX = 80
  const middleX = svgWidth / 2 - nodeWidth / 2
  const rightX = svgWidth - 180

  // Node heights based on proportions
  const budgetNodeHeight = 280
  const budgetNodeY = (svgHeight - budgetNodeHeight) / 2

  const a2aHeight = (totalAgentToAgent / totalBudget) * budgetNodeHeight
  const a2mHeight = (totalAgentToMerchant / totalBudget) * budgetNodeHeight

  // Calculate right side category positions
  const categoryGap = 6
  const totalCategoryHeight = budgetNodeHeight
  const availableHeight = totalCategoryHeight - (filteredCategories.length - 1) * categoryGap

  let currentY = budgetNodeY
  const categoryNodes = filteredCategories.map((cat) => {
    const height = Math.max(20, (cat.amount / filteredTotal) * availableHeight)
    const node = { ...cat, y: currentY, height }
    currentY += height + categoryGap
    return node
  })

  // Generate curved paths for Sankey flows
  const generatePath = (
    startX: number,
    startY: number,
    startHeight: number,
    endX: number,
    endY: number,
    endHeight: number
  ) => {
    const midX = (startX + endX) / 2
    return `
      M ${startX} ${startY}
      C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}
      L ${endX} ${endY + endHeight}
      C ${midX} ${endY + endHeight}, ${midX} ${startY + startHeight}, ${startX} ${startY + startHeight}
      Z
    `
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <Card className="border border-border shadow-sm bg-card">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Spend Flow</h2>
              <p className="text-sm text-muted-foreground">
                Visualize how budget flows through transaction types to spending categories
              </p>
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center bg-muted/50 rounded-lg p-1 border border-border">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  filter === "all"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilter("agent-to-merchant")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  filter === "agent-to-merchant"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <ShoppingCart className="h-3.5 w-3.5" />
                Merchant
              </button>
              <button
                type="button"
                onClick={() => setFilter("agent-to-agent")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  filter === "agent-to-agent"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Bot className="h-3.5 w-3.5" />
                Agent
              </button>
            </div>
          </div>

          {/* Sankey Diagram */}
          <div className="relative overflow-hidden">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto min-h-[350px]"
            >
              <defs>
                {categoryNodes.map((cat) => (
                  <linearGradient
                    key={`grad-${cat.id}`}
                    id={`grad-${cat.id}`}
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="0%"
                  >
                    <stop offset="0%" stopColor={filter === "all" ? "#22c55e" : filter === "agent-to-merchant" ? "#3b82f6" : "#8b5cf6"} stopOpacity={0.7} />
                    <stop offset="100%" stopColor={cat.color} stopOpacity={0.7} />
                  </linearGradient>
                ))}
              </defs>

              {/* Left Node - Total Budget */}
              <g>
                <rect
                  x={leftX}
                  y={budgetNodeY}
                  width={nodeWidth}
                  height={budgetNodeHeight}
                  fill="#22c55e"
                  rx={4}
                />
                <text
                  x={leftX - 10}
                  y={budgetNodeY + budgetNodeHeight / 2}
                  textAnchor="end"
                  className="fill-foreground text-sm font-medium"
                  dominantBaseline="middle"
                >
                  Total Budget
                </text>
                <text
                  x={leftX - 10}
                  y={budgetNodeY + budgetNodeHeight / 2 + 18}
                  textAnchor="end"
                  className="fill-muted-foreground text-xs"
                  dominantBaseline="middle"
                >
                  {formatFullCurrency(totalBudget)}
                </text>
              </g>

              {/* Middle Nodes - Transaction Types (only show when filter is "all") */}
              {filter === "all" && (
                <g>
                  {/* Agent to Merchant */}
                  <rect
                    x={middleX}
                    y={budgetNodeY}
                    width={nodeWidth}
                    height={a2mHeight}
                    fill="#3b82f6"
                    rx={4}
                  />
                  <text
                    x={middleX + nodeWidth + 10}
                    y={budgetNodeY + a2mHeight / 2 - 8}
                    className="fill-foreground text-xs font-medium"
                    dominantBaseline="middle"
                  >
                    Agent to Merchant
                  </text>
                  <text
                    x={middleX + nodeWidth + 10}
                    y={budgetNodeY + a2mHeight / 2 + 8}
                    className="fill-muted-foreground text-xs"
                    dominantBaseline="middle"
                  >
                    {formatFullCurrency(totalAgentToMerchant)}
                  </text>

                  {/* Agent to Agent */}
                  <rect
                    x={middleX}
                    y={budgetNodeY + a2mHeight + 10}
                    width={nodeWidth}
                    height={a2aHeight}
                    fill="#8b5cf6"
                    rx={4}
                  />
                  <text
                    x={middleX + nodeWidth + 10}
                    y={budgetNodeY + a2mHeight + 10 + a2aHeight / 2 - 8}
                    className="fill-foreground text-xs font-medium"
                    dominantBaseline="middle"
                  >
                    Agent to Agent
                  </text>
                  <text
                    x={middleX + nodeWidth + 10}
                    y={budgetNodeY + a2mHeight + 10 + a2aHeight / 2 + 8}
                    className="fill-muted-foreground text-xs"
                    dominantBaseline="middle"
                  >
                    {formatFullCurrency(totalAgentToAgent)}
                  </text>

                  {/* Flow from Budget to Transaction Types */}
                  <path
                    d={generatePath(
                      leftX + nodeWidth,
                      budgetNodeY,
                      a2mHeight,
                      middleX,
                      budgetNodeY,
                      a2mHeight
                    )}
                    fill="#3b82f6"
                    fillOpacity={0.3}
                  />
                  <path
                    d={generatePath(
                      leftX + nodeWidth,
                      budgetNodeY + a2mHeight,
                      a2aHeight,
                      middleX,
                      budgetNodeY + a2mHeight + 10,
                      a2aHeight
                    )}
                    fill="#8b5cf6"
                    fillOpacity={0.3}
                  />
                </g>
              )}

              {/* Flows to Categories */}
              {categoryNodes.map((cat, index) => {
                const sourceX = filter === "all" ? middleX + nodeWidth : leftX + nodeWidth
                const sourceY = filter === "all" 
                  ? (cat.agentToMerchant > 0 ? budgetNodeY : budgetNodeY + a2mHeight + 10)
                  : budgetNodeY + (index * (budgetNodeHeight / categoryNodes.length))
                const sourceHeight = filter === "all"
                  ? (cat.agentToMerchant > 0 ? (cat.amount / totalAgentToMerchant) * a2mHeight : (cat.amount / totalAgentToAgent) * a2aHeight)
                  : (cat.amount / filteredTotal) * (budgetNodeHeight / categoryNodes.length)

                return (
                  <g key={cat.id}>
                    <path
                      d={generatePath(
                        sourceX,
                        sourceY,
                        Math.max(8, sourceHeight),
                        rightX,
                        cat.y,
                        cat.height
                      )}
                      fill={`url(#grad-${cat.id})`}
                      opacity={hoveredCategory === null || hoveredCategory === cat.id ? 0.6 : 0.15}
                      className="transition-opacity duration-200"
                      onMouseEnter={() => setHoveredCategory(cat.id)}
                      onMouseLeave={() => setHoveredCategory(null)}
                    />
                  </g>
                )
              })}

              {/* Right Nodes - Categories */}
              {categoryNodes.map((cat) => (
                <g
                  key={`node-${cat.id}`}
                  onMouseEnter={() => setHoveredCategory(cat.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  className="cursor-pointer"
                >
                  <rect
                    x={rightX}
                    y={cat.y}
                    width={nodeWidth}
                    height={cat.height}
                    fill={cat.color}
                    rx={4}
                    opacity={hoveredCategory === null || hoveredCategory === cat.id ? 1 : 0.4}
                    className="transition-opacity duration-200"
                  />
                  <text
                    x={rightX + nodeWidth + 10}
                    y={cat.y + cat.height / 2 - 8}
                    className={`text-xs font-medium transition-opacity duration-200 ${
                      hoveredCategory === null || hoveredCategory === cat.id
                        ? "fill-foreground"
                        : "fill-muted-foreground/50"
                    }`}
                    dominantBaseline="middle"
                  >
                    {cat.name}
                  </text>
                  <text
                    x={rightX + nodeWidth + 10}
                    y={cat.y + cat.height / 2 + 8}
                    className={`text-xs transition-opacity duration-200 ${
                      hoveredCategory === null || hoveredCategory === cat.id
                        ? "fill-muted-foreground"
                        : "fill-muted-foreground/30"
                    }`}
                    dominantBaseline="middle"
                  >
                    {formatFullCurrency(cat.amount)}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-[#22c55e]" />
              <span className="text-xs text-muted-foreground">Total Budget</span>
            </div>
            {filter === "all" && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[#3b82f6]" />
                  <span className="text-xs text-muted-foreground">Agent to Merchant</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-[#8b5cf6]" />
                  <span className="text-xs text-muted-foreground">Agent to Agent</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.section>
  )
}

export default SpendBreakdownSection
