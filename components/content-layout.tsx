"use client"

import React from "react"

interface ContentLayoutProps {
  title?: string
  description?: string
  headerActions?: React.ReactNode
  children: React.ReactNode
}

export function ContentLayout({ title, description, headerActions, children }: ContentLayoutProps) {
  return (
    <div className="h-full flex flex-col">
      {(title || description || headerActions) && (
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            {title && <h2 className="text-lg font-semibold">{title}</h2>}
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
          {headerActions}
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
