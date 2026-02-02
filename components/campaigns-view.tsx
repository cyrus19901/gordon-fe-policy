"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CampaignCreationDrawer } from "@/components/campaign-creation-drawer"
import {
  Plus,
  Send,
  Eye,
  Pause,
  Play,
  MoreHorizontal,
  TrendingUp,
  Mail,
  Target,
  ChevronDown,
  ChevronRight,
  Trash2,
} from "lucide-react"
import { useSavedDeals } from "@/lib/saved-deals-context"
import { cn } from "@/lib/utils"

interface CampaignsViewProps {
  preSelectedDeals?: any[]
  showCreateDialog?: boolean
  onCreateDialogChange?: (open: boolean) => void
}

export function CampaignsView({
  preSelectedDeals = [],
  showCreateDialog = false,
  onCreateDialogChange,
}: CampaignsViewProps = {}) {
  const { state, dispatch } = useSavedDeals()
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set())
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [newCampaign, setNewCampaign] = useState({ name: "", description: "", template: "cold-outreach", tags: [] })

  useEffect(() => {
    if (showCreateDialog) {
      setIsDrawerOpen(true)
    }
  }, [showCreateDialog])

  const handleDrawerChange = (open: boolean) => {
    setIsDrawerOpen(open)
    onCreateDialogChange?.(open)
  }

  const totalStats = state.campaigns.reduce(
    (acc, campaign) => ({
      sent: acc.sent + campaign.outreachStats.sent,
      received: acc.received + campaign.outreachStats.received,
      replied: acc.replied + campaign.outreachStats.replied,
      interested: acc.interested + campaign.outreachStats.interested,
    }),
    { sent: 0, received: 0, replied: 0, interested: 0 },
  )

  const activeCampaigns = state.campaigns.filter((c) => c.status === "active").length

  const toggleCampaign = (campaignId: string) => {
    const newExpanded = new Set(expandedCampaigns)
    if (newExpanded.has(campaignId)) {
      newExpanded.delete(campaignId)
    } else {
      newExpanded.add(campaignId)
    }
    setExpandedCampaigns(newExpanded)
  }

  const getCampaignDeals = (campaignId: string) => {
    return state.savedDeals.filter((deal) => deal.campaignId === campaignId)
  }

  const handleCreateCampaign = () => {
    if (!newCampaign.name.trim()) return

    const dealIds = preSelectedDeals.map((deal) => deal.id)

    dispatch({
      type: "CREATE_CAMPAIGN",
      payload: {
        name: newCampaign.name,
        description: newCampaign.description,
        dealIds,
        tags: newCampaign.tags,
      },
    })

    setNewCampaign({ name: "", description: "", template: "cold-outreach", tags: [] })
    handleDrawerChange(false)
  }

  const handleToggleCampaignStatus = (campaignId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "paused" : "active"
    dispatch({
      type: "UPDATE_CAMPAIGN",
      payload: {
        campaignId,
        updates: { status: newStatus as "active" | "paused" | "completed" },
      },
    })
  }

  const handleDeleteCampaign = (campaignId: string) => {
    if (confirm(`Are you sure you want to delete this campaign? This action cannot be undone.`)) {
      dispatch({
        type: "DELETE_CAMPAIGN",
        payload: campaignId,
      })
    }
  }

  return (
    <div className="flex h-full w-full gap-8 px-6">
      <div className="w-[320px] flex-shrink-0 space-y-6">
        {/* Performance Summary Card */}
        <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold tracking-tight">Campaign Performance</h3>
            <Badge variant="secondary" className="text-xs font-medium px-2.5 py-0.5">
              {activeCampaigns} Active
            </Badge>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="rounded-xl bg-muted/40 p-4 border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <Send className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground">Sent</span>
              </div>
              <p className="text-2xl font-bold tracking-tight">{totalStats.sent}</p>
            </div>
            <div className="rounded-xl bg-blue-50/50 dark:bg-blue-950/20 p-4 border border-blue-200/30 dark:border-blue-800/30">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Opened</span>
              </div>
              <p className="text-2xl font-bold tracking-tight text-blue-900 dark:text-blue-100">
                {totalStats.received}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">
                {totalStats.sent > 0 ? Math.round((totalStats.received / totalStats.sent) * 100) : 0}%
              </p>
            </div>
            <div className="rounded-xl bg-green-50/50 dark:bg-green-950/20 p-4 border border-green-200/30 dark:border-green-800/30">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                <span className="text-xs font-medium text-green-700 dark:text-green-300">Replied</span>
              </div>
              <p className="text-2xl font-bold tracking-tight text-green-900 dark:text-green-100">
                {totalStats.replied}
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-1">
                {totalStats.sent > 0 ? Math.round((totalStats.replied / totalStats.sent) * 100) : 0}%
              </p>
            </div>
            <div className="rounded-xl bg-purple-50/50 dark:bg-purple-950/20 p-4 border border-purple-200/30 dark:border-purple-800/30">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Interested</span>
              </div>
              <p className="text-2xl font-bold tracking-tight text-purple-900 dark:text-purple-100">
                {totalStats.interested}
              </p>
              <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-1">
                {totalStats.sent > 0 ? Math.round((totalStats.interested / totalStats.sent) * 100) : 0}%
              </p>
            </div>
          </div>

          {/* Campaign Analytics */}
          <div className="rounded-xl bg-primary/5 dark:bg-primary/10 p-4 border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-xs font-semibold text-primary">Campaign Analytics</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Response rates trending up <span className="text-green-600 dark:text-green-400 font-bold">12%</span>
            </p>
          </div>
        </div>

        {/* Campaign Types */}
        <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-sm">
          <h3 className="text-sm font-semibold tracking-tight mb-4">Campaign Types</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center border border-blue-200/50 dark:border-blue-800/50">
                  <Mail className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Email Campaigns</p>
                  <p className="text-xs text-muted-foreground">
                    {state.campaigns.filter((c) => c.status === "active").length} active
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-bold">67%</span>
                <div className="flex gap-1">
                  <div className="w-1.5 h-5 rounded-full bg-primary" />
                  <div className="w-1.5 h-5 rounded-full bg-primary" />
                  <div className="w-1.5 h-5 rounded-full bg-primary/20" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold tracking-tight mb-1.5">Outreach Campaigns</h2>
            <p className="text-sm text-muted-foreground">
              {state.campaigns.length} campaigns • {totalStats.sent} messages sent
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="shadow-sm" onClick={() => setIsDrawerOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          <AnimatePresence>
            {state.campaigns.map((campaign, index) => {
              const isExpanded = expandedCampaigns.has(campaign.id)
              const campaignDeals = getCampaignDeals(campaign.id)
              const completionRate =
                campaign.outreachStats.sent > 0
                  ? Math.round((campaign.outreachStats.replied / campaign.outreachStats.sent) * 100)
                  : 0

              return (
                <motion.div
                  key={campaign.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm hover:shadow-md hover:border-border transition-all duration-200"
                >
                  {/* Campaign Header */}
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Expand/Collapse Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 mt-0.5 hover:bg-muted/60"
                        onClick={() => toggleCampaign(campaign.id)}
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4.5 w-4.5" />
                        ) : (
                          <ChevronRight className="h-4.5 w-4.5" />
                        )}
                      </Button>

                      {/* Campaign Icon */}
                      <div className="w-11 h-11 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0 border border-primary/20">
                        <Mail className="h-5.5 w-5.5 text-primary" />
                      </div>

                      {/* Campaign Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-2">
                          <h3 className="text-base font-bold tracking-tight">{campaign.name}</h3>
                          <Badge
                            variant="secondary"
                            className={cn(
                              "text-xs font-medium px-2.5 py-0.5",
                              campaign.status === "active" &&
                                "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border-green-200/50 dark:border-green-800/50",
                              campaign.status === "paused" &&
                                "bg-yellow-50 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-400 border-yellow-200/50 dark:border-yellow-800/50",
                              campaign.status === "completed" &&
                                "bg-gray-50 dark:bg-gray-950/30 text-gray-700 dark:text-gray-400 border-gray-200/50 dark:border-gray-800/50",
                            )}
                          >
                            {campaign.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs font-medium px-2.5 py-0.5">
                            {campaignDeals.length} deals
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{campaign.description}</p>

                        {campaign.tags && campaign.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-5">
                            {campaign.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs font-medium px-2.5 py-1">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Progress Bar */}
                        <div className="mb-5">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-muted-foreground">Campaign Progress</span>
                            <span className="text-xs font-bold">
                              {campaign.outreachStats.replied}/{campaign.outreachStats.sent}
                            </span>
                          </div>
                          <div className="h-2 bg-muted/60 rounded-full overflow-hidden border border-border/30">
                            <div
                              className="h-full bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
                              style={{ width: `${completionRate}%` }}
                            />
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-8">
                          <div className="flex items-center gap-2.5">
                            <Send className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-bold">{campaign.outreachStats.sent}</span>
                            <span className="text-xs text-muted-foreground font-medium">Sent</span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <Eye className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                              {campaign.outreachStats.received}
                            </span>
                            <span className="text-xs text-muted-foreground font-medium">
                              {campaign.outreachStats.sent > 0
                                ? Math.round((campaign.outreachStats.received / campaign.outreachStats.sent) * 100)
                                : 0}
                              % opened
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <Mail className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-bold text-green-600 dark:text-green-400">
                              {campaign.outreachStats.replied}
                            </span>
                            <span className="text-xs text-muted-foreground font-medium">
                              {campaign.outreachStats.sent > 0
                                ? Math.round((campaign.outreachStats.replied / campaign.outreachStats.sent) * 100)
                                : 0}
                              % replied
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <TrendingUp className="h-4 w-4 text-purple-500" />
                            <span className="text-sm font-bold text-purple-600 dark:text-purple-400">
                              {campaign.outreachStats.interested}
                            </span>
                            <span className="text-xs text-muted-foreground font-medium">interested</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 hover:bg-muted/60"
                          onClick={() => handleToggleCampaignStatus(campaign.id, campaign.status)}
                          title={campaign.status === "active" ? "Pause campaign" : "Resume campaign"}
                        >
                          {campaign.status === "active" ? (
                            <Pause className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          ) : (
                            <Play className="h-4 w-4 text-green-600 dark:text-green-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 p-0 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          onClick={() => handleDeleteCampaign(campaign.id)}
                          title="Delete campaign"
                        >
                          <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 hover:bg-muted/60">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Section */}
                  <AnimatePresence>
                    {isExpanded && campaignDeals.length > 0 && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-t border-border/50 bg-muted/30"
                      >
                        <div className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold">Campaign Deals</h4>
                            <Button variant="outline" size="sm" className="h-8 text-xs shadow-sm bg-transparent">
                              <Plus className="h-3.5 w-3.5 mr-1.5" />
                              Add Deals
                            </Button>
                          </div>
                          <div className="space-y-2.5">
                            {campaignDeals.map((deal) => (
                              <div
                                key={deal.id}
                                className="flex items-center justify-between p-4 rounded-xl bg-background border border-border/50 hover:border-primary/50 hover:shadow-sm transition-all duration-200"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="w-9 h-9 rounded-lg bg-muted/60 flex items-center justify-center flex-shrink-0 border border-border/30">
                                    <span className="text-xs font-bold">{deal.name.substring(0, 2).toUpperCase()}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold truncate">{deal.name}</p>
                                    <p className="text-xs text-muted-foreground">{deal.industry}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2.5">
                                  <Badge variant="secondary" className="text-xs font-medium px-2.5 py-0.5">
                                    {deal.pipelineStage}
                                  </Badge>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted/60">
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Empty State */}
          {state.campaigns.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center h-full"
            >
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-primary/20">
                  <Mail className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">No campaigns yet</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
                  Create your first campaign to start organizing and tracking your outreach efforts
                </p>
                <Button onClick={() => setIsDrawerOpen(true)} className="shadow-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      <CampaignCreationDrawer
        open={isDrawerOpen}
        onOpenChange={handleDrawerChange}
        preSelectedDeals={preSelectedDeals}
      />
    </div>
  )
}
