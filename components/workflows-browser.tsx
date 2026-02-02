"use client"

import React from "react"

interface WorkflowsBrowserProps {
  onRunWorkflow?: (workflowId: string) => void
  filterText?: string
  category?: string
}

export function WorkflowsBrowser({ onRunWorkflow, filterText, category }: WorkflowsBrowserProps) {
  return (
    <div className="p-4 text-center text-muted-foreground">
      <p>Workflows Browser</p>
    </div>
  )
}
