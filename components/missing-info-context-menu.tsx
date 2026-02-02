"use client"

import React from "react"

interface MissingInfoContextMenuProps {
  children?: React.ReactNode
  [key: string]: any
}

export function MissingInfoContextMenu({ children, ...props }: MissingInfoContextMenuProps) {
  return <>{children}</>
}
