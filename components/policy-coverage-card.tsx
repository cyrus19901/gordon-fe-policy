"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface PolicyCoverageMetric {
  label: string
  percentage: number
  color: string
}

interface PolicyCoverageCardProps {
  autoResolvedPercentage?: number
  trendPercentage?: string
  metrics?: PolicyCoverageMetric[]
}

export function PolicyCoverageCard({
  autoResolvedPercentage = 87,
  trendPercentage = "+4.1% this month",
  metrics = [
    { label: "Auto-approved", percentage: 62, color: "bg-green-500" },
    { label: "Approved with justification", percentage: 25, color: "bg-blue-500" },
    { label: "Escalated to approver", percentage: 10, color: "bg-amber-500" },
    { label: "Blocked", percentage: 3, color: "bg-red-500" },
  ],
}: PolicyCoverageCardProps) {
  return (
    <Card className="bg-card border border-border shadow-sm">
      <CardContent className="p-0">
        <div className="p-4 border-b border-border/50 flex items-center justify-between">
          <span className="text-sm text-muted-foreground font-medium">Policy coverage</span>
          <Badge 
            variant="outline" 
            className="text-xs font-normal text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400"
          >
            {trendPercentage}
          </Badge>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-semibold text-foreground">{autoResolvedPercentage}%</span>
            <span className="text-sm text-muted-foreground">auto-resolved</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Decisions made without human intervention this month. {100 - autoResolvedPercentage}% escalated to approvers.
          </p>
          <div className="space-y-2.5">
            {metrics.map((metric, index) => (
              <div key={index} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{metric.label}</span>
                  <span className="font-medium text-foreground">{metric.percentage}%</span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${metric.color} rounded-full transition-all duration-300`}
                    style={{ width: `${metric.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
