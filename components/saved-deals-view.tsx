"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useSavedDeals } from "@/lib/saved-deals-context"
import { useBulkActions } from "@/lib/bulk-actions-context"
import { DealsPortfolioView } from "./deals-portfolio-view"
import { InboxView } from "./inbox-view"

interface SavedDealsViewProps {
  deals?: any[]
  activeView?: "watchlist" | "campaigns" | "inbox"
}

export function SavedDealsView({ activeView: externalActiveView = "watchlist" }: SavedDealsViewProps) {
  const { state } = useSavedDeals()
  const { dispatch: bulkDispatch } = useBulkActions()
  const activeView = externalActiveView
  const [showCreateCampaignDialog, setShowCreateCampaignDialog] = useState(false)
  const [preSelectedDeals, setPreSelectedDeals] = useState<any[]>([])
  const [previousCampaignCount, setPreviousCampaignCount] = useState(state.campaigns.length)

  useEffect(() => {
    if (state.campaigns.length > previousCampaignCount) {
      // Note: Navigation to campaigns view is now handled by parent component
    }
    setPreviousCampaignCount(state.campaigns.length)
  }, [state.campaigns.length])

  return (
    <div className="w-full h-full flex flex-col relative min-h-0">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col space-y-4 w-full flex-1 min-h-0"
      >
        <AnimatePresence mode="wait">
          {(activeView === "watchlist" || activeView === "campaigns") && (
            <motion.div
              key="watchlist"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 min-h-0 flex flex-col"
            >
              <DealsPortfolioView />
            </motion.div>
          )}

          {activeView === "inbox" && (
            <motion.div
              key="inbox"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
              className="flex-1 min-h-0"
            >
              <InboxView />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
