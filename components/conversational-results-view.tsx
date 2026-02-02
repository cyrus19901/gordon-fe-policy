"use client"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bot, Sparkles } from "lucide-react"

interface ConversationalResultsViewProps {
  deals: any[]
  searchQuery: string
  onDealSelect: (deal: any) => void
  onBookmarkDeal?: (deal: any) => void
}

export function ConversationalResultsView({
  deals,
  searchQuery,
  onDealSelect,
  onBookmarkDeal,
}: ConversationalResultsViewProps) {
  const getAIIntroMessage = () => {
    if (deals.length === 0) {
      return "I couldn't find any companies matching your criteria. Try adjusting your search parameters."
    }

    const industries = [...new Set(deals.map((d) => d.industry))].slice(0, 3)
    const avgRevenue =
      deals.reduce((sum, d) => sum + Number.parseFloat(d.revenue?.replace(/[^0-9.]/g, "") || "0"), 0) / deals.length

    return `I found ${deals.length} ${deals.length === 1 ? "company" : "companies"} that match your search${searchQuery ? ` for "${searchQuery}"` : ""}. ${industries.length > 0 ? `The results include companies in ${industries.join(", ")}.` : ""} ${avgRevenue > 0 ? `Average revenue is around $${avgRevenue.toFixed(1)}M.` : ""} Let me show you the top matches:`
  }

  return (
    <div className="space-y-6 py-6">
      {/* AI Introduction */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start gap-3 p-4 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border border-primary/20"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg">
          <Bot className="h-4 w-4 text-primary-foreground" />
        </div>
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm text-foreground">Gordon AI</h3>
            <Badge variant="secondary" className="text-xs h-5">
              <Sparkles className="h-2.5 w-2.5 mr-1" />
              AI Analysis
            </Badge>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{getAIIntroMessage()}</p>
        </div>
      </motion.div>

      {/* AI Follow-up Suggestions */}
      {deals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 bg-secondary/20 rounded-xl border border-border/30"
        >
          <div className="flex items-start gap-3">
            <Bot className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <p className="text-xs font-medium text-foreground">Want to refine your search?</p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="h-7 text-xs bg-transparent">
                  Show similar companies
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs bg-transparent">
                  Filter by higher revenue
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs bg-transparent">
                  Different industry
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
