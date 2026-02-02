"use client"
import { motion } from "framer-motion"
export function InsightAnimation({ children, ...props }: any) {
  return <motion.div {...props}>{children}</motion.div>
}
