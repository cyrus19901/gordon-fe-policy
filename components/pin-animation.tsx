"use client"

import React from "react"
import { motion } from "framer-motion"

interface PinAnimationProps {
  children?: React.ReactNode
  [key: string]: any
}

export function PinAnimation({ children, ...props }: PinAnimationProps) {
  return <motion.div {...props}>{children}</motion.div>
}
