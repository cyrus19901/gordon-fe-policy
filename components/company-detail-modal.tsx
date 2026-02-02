"use client"
import { createPortal } from "react-dom"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Building2, CheckCircle2, Mail, Phone, Sparkles, Send, Search, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface CompanyDetailModalProps {
  isOpen: boolean
  onClose: () => void
  company: {
    id: string
    name: string
    industry: string
    revenue: string
    employees: string
    location: string
    website: string
    description: string
    pipelineStage: string
    probability: number
    dealValue?: string
    lastContactDate?: string | null
    savedDate: string
  } | null
  onChatModeChange?: (companyId: string, companyName: string) => void
  onAddToCampaign?: (company: any) => void
  onSearchSimilar?: (company: any) => void
}

export function CompanyDetailModal({
  isOpen,
  onClose,
  company,
  onChatModeChange,
  onAddToCampaign,
  onSearchSimilar,
}: CompanyDetailModalProps) {
  if (!company) return null

  const getPipelineStageInfo = (stage: string) => {
    const stages = {
      saved: { label: "Saved", step: 1 },
      contacted: { label: "Contacted", step: 2 },
      interested: { label: "Interested", step: 3 },
      not_interested: { label: "Not Interested", step: 0 },
    }
    return stages[stage as keyof typeof stages] || stages.saved
  }

  const stageInfo = getPipelineStageInfo(company.pipelineStage)

  const dealStages = [
    { label: "Saved", step: 1 },
    { label: "Contacted", step: 2 },
    { label: "Interested", step: 3 },
  ]

  const handleAskAboutCompany = () => {
    onChatModeChange?.(company.id, company.name)
    onClose()
  }

  const handleAddToCampaign = () => {
    onAddToCampaign?.(company)
    onClose()
  }

  const handleSearchSimilar = () => {
    onSearchSimilar?.(company)
    onClose()
  }

  const communications = [
    {
      id: 1,
      type: "email",
      direction: "outbound",
      subject: "Introduction to Gordon AI",
      preview: "Hi John, I wanted to reach out regarding potential investment opportunities...",
      date: "2025-01-10T10:30:00",
      status: "sent",
      aiGenerated: true,
    },
    {
      id: 2,
      type: "email",
      direction: "inbound",
      subject: "Re: Introduction to Gordon AI",
      preview: "Thanks for reaching out! We'd be interested in learning more about your investment thesis...",
      date: "2025-01-11T14:20:00",
      status: "received",
      aiGenerated: false,
    },
    {
      id: 3,
      type: "call",
      direction: "outbound",
      subject: "Discovery Call",
      preview: "45-minute call discussing company metrics and growth strategy",
      date: "2025-01-12T15:00:00",
      status: "completed",
      aiGenerated: false,
    },
  ]

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-8 bg-background border border-border/30 rounded-xl shadow-xl z-[100] overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <h1 className="font-semibold text-foreground text-base">{company.name}</h1>
                  <p className="text-muted-foreground text-xs">{company.industry}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {onSearchSimilar && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSearchSimilar}
                    className="h-8 text-xs bg-transparent"
                  >
                    <Search className="h-3.5 w-3.5 mr-1.5" />
                    Search Similar
                  </Button>
                )}
                {onAddToCampaign && (
                  <Button variant="default" size="sm" onClick={handleAddToCampaign} className="h-8 text-xs">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add to Campaign
                  </Button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex">
              <div className="w-56 border-r border-border/30 p-5 space-y-6">
                <div>
                  <h3 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-4">
                    Progress
                  </h3>
                  <div className="space-y-2.5">
                    {dealStages.map((stage, index) => {
                      const isActive = stage.step === stageInfo.step
                      const isComplete = stage.step < stageInfo.step
                      return (
                        <div key={stage.step} className="flex items-start space-x-2.5">
                          <div className="flex flex-col items-center">
                            <div
                              className={cn(
                                "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium transition-colors",
                                isActive
                                  ? "bg-foreground text-background"
                                  : isComplete
                                    ? "bg-muted text-foreground"
                                    : "bg-muted/50 text-muted-foreground",
                              )}
                            >
                              {isComplete ? <CheckCircle2 className="h-3 w-3" /> : stage.step}
                            </div>
                            {index < dealStages.length - 1 && (
                              <div className={cn("w-px h-6 mt-1", isComplete ? "bg-border" : "bg-border/30")} />
                            )}
                          </div>
                          <div className="flex-1 pt-0.5">
                            <p
                              className={cn(
                                "text-xs",
                                isActive ? "text-foreground font-medium" : "text-muted-foreground",
                              )}
                            >
                              {stage.label}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="flex-1 flex flex-col">
                <ScrollArea className="flex-1">
                  <div className="p-6">
                    <div className="space-y-3">
                      {communications.map((comm) => (
                        <div
                          key={comm.id}
                          className="p-4 rounded-lg border border-border/30 hover:bg-muted/20 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
                                {comm.type === "email" ? (
                                  <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                ) : (
                                  <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center space-x-1.5">
                                  <p className="text-sm font-medium text-foreground">{comm.subject}</p>
                                  {comm.aiGenerated && (
                                    <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-muted text-muted-foreground">
                                      AI
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                  {new Date(comm.date).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })}
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="h-7 text-xs">
                              View
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground ml-9">{comm.preview}</p>
                          {comm.direction === "inbound" && (
                            <div className="mt-3 ml-9">
                              <Button variant="ghost" size="sm" className="h-7 text-xs">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Draft Reply
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}

                      <Button variant="ghost" className="w-full h-9 text-sm" onClick={handleAskAboutCompany}>
                        <Send className="h-3.5 w-3.5 mr-2" />
                        New Message
                      </Button>
                    </div>
                  </div>
                </ScrollArea>

                <div className="border-t border-border/30 p-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 flex items-center space-x-2 px-3 py-2 rounded-lg border border-border/30 bg-muted/20">
                      <Sparkles className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <input
                        type="text"
                        placeholder={`Ask about ${company.name}...`}
                        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                        onFocus={handleAskAboutCompany}
                      />
                    </div>
                    <Button size="sm" className="h-8 px-3" onClick={handleAskAboutCompany}>
                      Ask
                    </Button>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2">
                      Draft email
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2">
                      Schedule call
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 text-[11px] px-2">
                      Generate report
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  // Render modal at document body level to avoid container constraints
  return typeof window !== "undefined" ? createPortal(modalContent, document.body) : null
}
