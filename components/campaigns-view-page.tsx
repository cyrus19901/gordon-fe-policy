"use client"
import { motion } from "framer-motion"
import { useSavedDeals } from "@/lib/saved-deals-context"
import { DealsPortfolioView } from "./deals-portfolio-view"

export function CampaignsViewPage() {
  const { state } = useSavedDeals()

  return (
    <div className="w-full h-full flex flex-col relative min-h-0">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col space-y-4 w-full flex-1 min-h-0"
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 min-h-0 flex flex-col"
        >
          <DealsPortfolioView viewMode="campaigns" />
        </motion.div>
      </motion.div>
    </div>
  )
}
