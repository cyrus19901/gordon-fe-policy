"use client"

import React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface DealHealthOverviewCardProps {
  deal?: any
}

export function DealHealthOverviewCard({ deal }: DealHealthOverviewCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Deal Health Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Deal health metrics will appear here</p>
      </CardContent>
    </Card>
  )
}
