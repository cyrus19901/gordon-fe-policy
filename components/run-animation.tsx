"use client"
import { motion } from "framer-motion"
export function RunAnimation({ children, ...props }: any) {
  return <motion.div {...props}>{children}</motion.div>
}
