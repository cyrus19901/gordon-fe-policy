"use client"

import { useState, useEffect } from "react"
import {
  Mail,
  MailOpen,
  Reply,
  ThumbsUp,
  ChevronDown,
  User,
  Layers,
  X,
  Clock,
  Zap,
  Edit2,
  Trash2,
  Plus,
  Save,
  ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface CampaignWorkflowFlowchartProps {
  campaign: any
}

interface WorkflowBlock {
  id: string
  step: number
  type: string
  title: string
  description: string
  delay: string
  template: {
    subject: string
    body: string
  }
  icon: any
  color: string
}

// Mock reply data - in a real app, this would come from the campaign data
const getMockReplies = (status: string, count: number) => {
  const templates = {
    sent: Array.from({ length: count }, (_, i) => ({
      id: `sent-${i}`,
      recipient: `contact${i + 1}@company.com`,
      company: `Company ${String.fromCharCode(65 + i)}`,
      companyId: `company-${i}`,
      subject: "Partnership Opportunity",
      sentAt: new Date(Date.now() - i * 86400000).toISOString(),
    })),
    opened: Array.from({ length: count }, (_, i) => ({
      id: `opened-${i}`,
      recipient: `contact${i + 1}@company.com`,
      company: `Company ${String.fromCharCode(65 + i)}`,
      companyId: `company-${i}`,
      subject: "Partnership Opportunity",
      openedAt: new Date(Date.now() - i * 43200000).toISOString(),
      opens: Math.floor(Math.random() * 3) + 1,
    })),
    replied: Array.from({ length: count }, (_, i) => ({
      id: `replied-${i}`,
      recipient: `contact${i + 1}@company.com`,
      company: `Company ${String.fromCharCode(65 + i)}`,
      companyId: `company-${i}`,
      subject: "Re: Partnership Opportunity",
      repliedAt: new Date(Date.now() - i * 21600000).toISOString(),
      preview: "Thanks for reaching out. I'd be interested in learning more about...",
    })),
    interested: Array.from({ length: count }, (_, i) => ({
      id: `interested-${i}`,
      recipient: `contact${i + 1}@company.com`,
      company: `Company ${String.fromCharCode(65 + i)}`,
      companyId: `company-${i}`,
      subject: "Re: Partnership Opportunity",
      sentiment: "positive",
      repliedAt: new Date(Date.now() - i * 10800000).toISOString(),
      preview: "This sounds like a great opportunity. Let's schedule a call to discuss...",
    })),
  }
  return templates[status as keyof typeof templates] || []
}

const defaultWorkflowBlocks: WorkflowBlock[] = [
  {
    id: "block-1",
    step: 1,
    type: "initial_outreach",
    title: "Initial Outreach",
    description: "First contact email to introduce partnership opportunity",
    delay: "Immediate",
    template: {
      subject: "Partnership Opportunity with {{company_name}}",
      body: `Hi {{first_name}},

I hope this email finds you well. I'm reaching out because I believe there's a strong synergy between our companies.

We specialize in {{our_service}} and have helped companies like {{social_proof}} achieve {{results}}.

Would you be open to a brief call next week to explore how we might work together?

Best regards,
{{sender_name}}`,
    },
    icon: Mail,
    color: "bg-blue-50 dark:bg-blue-950/20",
  },
  {
    id: "block-2",
    step: 2,
    type: "follow_up_1",
    title: "Follow-up #1",
    description: "Gentle reminder if no response after 3 days",
    delay: "3 days after send",
    template: {
      subject: "Re: Partnership Opportunity with {{company_name}}",
      body: `Hi {{first_name}},

I wanted to follow up on my previous email about a potential partnership.

I understand you're busy, but I believe this could be valuable for {{their_company}}.

Would you have 15 minutes this week for a quick call?

Best,
{{sender_name}}`,
    },
    icon: MailOpen,
    color: "bg-purple-50 dark:bg-purple-950/20",
  },
  {
    id: "block-3",
    step: 3,
    type: "value_proposition",
    title: "Value Proposition",
    description: "Share case study if email was opened but no reply",
    delay: "5 days after open",
    template: {
      subject: "Case Study: How {{case_study_company}} Increased Revenue by 40%",
      body: `Hi {{first_name}},

I noticed you opened my previous email, so I thought you might find this case study interesting.

{{case_study_company}} was facing similar challenges to {{their_company}}. After implementing our solution, they:
- Increased revenue by 40%
- Reduced costs by 25%
- Improved efficiency by 60%

I'd love to discuss how we could achieve similar results for you.

Best,
{{sender_name}}`,
    },
    icon: Zap,
    color: "bg-amber-50 dark:bg-amber-950/20",
  },
  {
    id: "block-4",
    step: 4,
    type: "final_attempt",
    title: "Final Attempt",
    description: "Last touchpoint before closing the sequence",
    delay: "7 days after last email",
    template: {
      subject: "Should I close your file?",
      body: `Hi {{first_name}},

I haven't heard back from you, so I wanted to check in one last time.

If now isn't the right time, I completely understand. Should I close your file, or would you like me to follow up in a few months?

Just let me know either way.

Best,
{{sender_name}}`,
    },
    icon: Clock,
    color: "bg-red-50 dark:bg-red-950/20",
  },
]

const TEMPLATES_STORAGE_KEY = "workflow_templates"

const saveTemplate = (name: string, blocks: WorkflowBlock[]) => {
  const templates = getTemplates()
  templates[name] = blocks
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates))
}

const getTemplates = (): Record<string, WorkflowBlock[]> => {
  if (typeof window === "undefined") return {}
  const stored = localStorage.getItem(TEMPLATES_STORAGE_KEY)
  return stored ? JSON.parse(stored) : {}
}

const deleteTemplate = (name: string) => {
  const templates = getTemplates()
  delete templates[name]
  localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates))
}

export function CampaignWorkflowFlowchart({ campaign }: CampaignWorkflowFlowchartProps) {
  const [selectedStatus, setSelectedStatus] = useState<string | null>("sent")
  const [expandedReplies, setExpandedReplies] = useState(true)
  const [showWorkflowBlocks, setShowWorkflowBlocks] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)

  const [isEditMode, setIsEditMode] = useState(false)
  const [workflowBlocks, setWorkflowBlocks] = useState<WorkflowBlock[]>(defaultWorkflowBlocks)
  const [editingBlock, setEditingBlock] = useState<WorkflowBlock | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isSaveTemplateDialogOpen, setIsSaveTemplateDialogOpen] = useState(false)
  const [templateName, setTemplateName] = useState("")
  const [savedTemplates, setSavedTemplates] = useState<Record<string, WorkflowBlock[]>>({})
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    setSavedTemplates(getTemplates())
  }, [])

  const stats = [
    {
      id: "sent",
      label: "Sent",
      value: campaign.outreachStats.sent,
      icon: Mail,
      color: "bg-slate-100 dark:bg-slate-900",
      iconColor: "text-slate-600 dark:text-slate-400",
      textColor: "text-slate-900 dark:text-slate-100",
      borderColor: "border-slate-200 dark:border-slate-800",
    },
    {
      id: "opened",
      label: "Opened",
      value: campaign.outreachStats.received,
      icon: MailOpen,
      color: "bg-blue-50 dark:bg-blue-950/20",
      iconColor: "text-blue-600 dark:text-blue-400",
      textColor: "text-blue-900 dark:text-blue-100",
      borderColor: "border-blue-200 dark:border-blue-900",
    },
    {
      id: "replied",
      label: "Replied",
      value: campaign.outreachStats.replied,
      icon: Reply,
      color: "bg-green-50 dark:bg-green-950/20",
      iconColor: "text-green-600 dark:text-green-400",
      textColor: "text-green-900 dark:text-green-100",
      borderColor: "border-green-200 dark:border-green-900",
    },
    {
      id: "interested",
      label: "Interested",
      value: campaign.outreachStats.interested,
      icon: ThumbsUp,
      color: "bg-emerald-50 dark:bg-emerald-950/20",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      textColor: "text-emerald-900 dark:text-emerald-100",
      borderColor: "border-emerald-200 dark:border-emerald-900",
    },
    {
      id: "workflow",
      label: "Workflow Blocks",
      value: workflowBlocks.length,
      icon: Layers,
      color: "bg-purple-50 dark:bg-purple-950/20",
      iconColor: "text-purple-600 dark:text-purple-400",
      textColor: "text-purple-900 dark:text-purple-100",
      borderColor: "border-purple-200 dark:border-purple-900",
    },
  ]

  const handleStatusClick = (statusId: string, value: number) => {
    if (statusId === "workflow") {
      setShowWorkflowBlocks(!showWorkflowBlocks)
      setSelectedStatus(null)
      setExpandedReplies(false)
      return
    }

    if (value === 0) return
    if (selectedStatus === statusId) {
      setSelectedStatus(null)
      setExpandedReplies(false)
    } else {
      setSelectedStatus(statusId)
      setExpandedReplies(true)
      setShowWorkflowBlocks(false)
    }
  }

  const selectedStat = stats.find((s) => s.id === selectedStatus)
  const replies = selectedStat ? getMockReplies(selectedStat.id, selectedStat.value) : []

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  const handleBlockClick = (blockId: string) => {
    if (isEditMode) return
    setSelectedBlock(selectedBlock === blockId ? null : blockId)
  }

  const handleCompanyClick = (companyId: string, companyName: string) => {
    window.dispatchEvent(
      new CustomEvent("open-company-detail", {
        detail: { companyId, companyName },
      }),
    )
  }

  const handleEditBlock = (block: WorkflowBlock) => {
    setEditingBlock({ ...block })
    setIsEditDialogOpen(true)
  }

  const handleDeleteBlock = (blockId: string) => {
    const newBlocks = workflowBlocks.filter((b) => b.id !== blockId)
    // Renumber steps
    const renumberedBlocks = newBlocks.map((b, index) => ({ ...b, step: index + 1 }))
    setWorkflowBlocks(renumberedBlocks)
    setHasUnsavedChanges(true)
  }

  const handleAddBlock = () => {
    const newBlock: WorkflowBlock = {
      id: `block-${Date.now()}`,
      step: workflowBlocks.length + 1,
      type: "custom",
      title: "New Step",
      description: "Add description here",
      delay: "Immediate",
      template: {
        subject: "Subject line",
        body: "Email body",
      },
      icon: Mail,
      color: "bg-blue-50 dark:bg-blue-950/20",
    }
    setEditingBlock(newBlock)
    setIsEditDialogOpen(true)
  }

  const handleSaveBlock = () => {
    if (!editingBlock) return

    const existingIndex = workflowBlocks.findIndex((b) => b.id === editingBlock.id)
    if (existingIndex >= 0) {
      const newBlocks = [...workflowBlocks]
      newBlocks[existingIndex] = editingBlock
      setWorkflowBlocks(newBlocks)
    } else {
      setWorkflowBlocks([...workflowBlocks, editingBlock])
    }

    setHasUnsavedChanges(true)
    setIsEditDialogOpen(false)
    setEditingBlock(null)
  }

  const handleMoveBlock = (blockId: string, direction: "up" | "down") => {
    const index = workflowBlocks.findIndex((b) => b.id === blockId)
    if (index === -1) return
    if (direction === "up" && index === 0) return
    if (direction === "down" && index === workflowBlocks.length - 1) return

    const newBlocks = [...workflowBlocks]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    ;[newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]]

    // Renumber steps
    const renumberedBlocks = newBlocks.map((b, i) => ({ ...b, step: i + 1 }))
    setWorkflowBlocks(renumberedBlocks)
    setHasUnsavedChanges(true)
  }

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return
    saveTemplate(templateName, workflowBlocks)
    setSavedTemplates(getTemplates())
    setHasUnsavedChanges(false)
    setIsSaveTemplateDialogOpen(false)
    setTemplateName("")
  }

  const handleLoadTemplate = (name: string) => {
    const templates = getTemplates()
    if (templates[name]) {
      setWorkflowBlocks(templates[name])
      setHasUnsavedChanges(false)
    }
  }

  const selectedWorkflowBlock = workflowBlocks.find((b) => b.id === selectedBlock)

  return (
    <div className="w-full h-full flex flex-col space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Campaign Analytics</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Real-time performance metrics</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowWorkflowBlocks(!showWorkflowBlocks)}
          className="gap-2 h-8 text-xs font-medium"
        >
          <Layers className="h-3.5 w-3.5" />
          {workflowBlocks.length} Blocks
          <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", showWorkflowBlocks && "rotate-180")} />
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-2.5">
        {stats.map((stat) => {
          const Icon = stat.icon
          const isSelected = stat.id === "workflow" ? showWorkflowBlocks : selectedStatus === stat.id
          const isClickable = stat.id === "workflow" || stat.value > 0

          return (
            <button
              key={stat.id}
              onClick={() => handleStatusClick(stat.id, stat.value)}
              disabled={!isClickable}
              className={cn(
                "relative p-3 rounded-lg border transition-all duration-200",
                isClickable ? "cursor-pointer hover:shadow-sm" : "cursor-default opacity-50",
                isSelected ? `${stat.borderColor} ${stat.color}` : "border-border/40 bg-card hover:border-border/60",
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={cn("p-1.5 rounded-md", isSelected ? stat.color : "bg-muted/50")}>
                  <Icon className={cn("h-3.5 w-3.5", isSelected ? stat.iconColor : "text-muted-foreground")} />
                </div>
                {isClickable && <span className="text-[10px] text-muted-foreground font-medium">{stat.value}</span>}
              </div>
              <div className="text-left">
                <div className={cn("text-xl font-semibold mb-0.5", isSelected ? stat.textColor : "text-foreground")}>
                  {stat.value}
                </div>
                <div className="text-[11px] text-muted-foreground">{stat.label}</div>
              </div>
            </button>
          )
        })}
      </div>

      <AnimatePresence>
        {showWorkflowBlocks && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-border/40 bg-card overflow-hidden">
              <div className="bg-muted/20 px-3 py-2 border-b border-border/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">Email Sequence Workflow</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{workflowBlocks.length} automated steps</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {Object.keys(savedTemplates).length > 0 && !isEditMode && (
                      <Select onValueChange={handleLoadTemplate}>
                        <SelectTrigger className="h-7 w-32 text-xs">
                          <SelectValue placeholder="Load template" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(savedTemplates).map((name) => (
                            <SelectItem key={name} value={name} className="text-xs">
                              {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {hasUnsavedChanges && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsSaveTemplateDialogOpen(true)}
                        className="h-7 gap-1.5 text-xs"
                      >
                        <Save className="h-3 w-3" />
                        Save Template
                      </Button>
                    )}

                    <Button
                      variant={isEditMode ? "default" : "outline"}
                      size="sm"
                      onClick={() => setIsEditMode(!isEditMode)}
                      className="h-7 gap-1.5 text-xs"
                    >
                      <Edit2 className="h-3 w-3" />
                      {isEditMode ? "Done" : "Edit"}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowWorkflowBlocks(false)}
                      className="h-7 w-7 p-0"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-2.5 space-y-1.5 max-h-96 overflow-y-auto">
                {workflowBlocks.map((block, index) => {
                  const Icon = block.icon
                  const isSelected = selectedBlock === block.id
                  const isLast = index === workflowBlocks.length - 1

                  return (
                    <div key={block.id} className="relative">
                      <button
                        onClick={() => handleBlockClick(block.id)}
                        className={cn(
                          "w-full text-left rounded-md border transition-all duration-150",
                          !isEditMode && "hover:bg-muted/30",
                          isSelected
                            ? "border-primary/40 bg-primary/5"
                            : "border-border/30 bg-card hover:border-border/50",
                        )}
                      >
                        <div className="p-2.5">
                          <div className="flex items-start gap-2">
                            <div
                              className={cn(
                                "p-1.5 rounded-md flex-shrink-0",
                                block.color.replace(/from-|to-/g, "bg-").split(" ")[0],
                              )}
                            >
                              <Icon className="h-3 w-3 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[10px] text-muted-foreground font-medium">Step {block.step}</span>
                                <span className="text-xs font-medium text-foreground">{block.title}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mb-1">{block.description}</p>
                              <div className="flex items-center gap-1">
                                <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground">{block.delay}</span>
                              </div>
                            </div>

                            {isEditMode ? (
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleMoveBlock(block.id, "up")
                                  }}
                                  disabled={index === 0}
                                  className="h-6 w-6 p-0"
                                >
                                  <ChevronUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleMoveBlock(block.id, "down")
                                  }}
                                  disabled={index === workflowBlocks.length - 1}
                                  className="h-6 w-6 p-0"
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEditBlock(block)
                                  }}
                                  className="h-6 w-6 p-0"
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteBlock(block.id)
                                  }}
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <ChevronDown
                                className={cn(
                                  "h-3 w-3 text-muted-foreground transition-transform flex-shrink-0 mt-0.5",
                                  isSelected && "rotate-180",
                                )}
                              />
                            )}
                          </div>
                        </div>

                        <AnimatePresence>
                          {isSelected && !isEditMode && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.15 }}
                              className="overflow-hidden"
                            >
                              <div className="px-2.5 pb-2.5 pt-1.5 border-t border-border/20 bg-muted/10">
                                <div className="space-y-2">
                                  <div>
                                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                                      Subject
                                    </label>
                                    <div className="px-2 py-1.5 rounded bg-background/50 border border-border/30 text-xs text-foreground">
                                      {block.template.subject}
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                                      Body
                                    </label>
                                    <div className="px-2 py-1.5 rounded bg-background/50 border border-border/30 text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                                      {block.template.body}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>

                      {!isLast && (
                        <div className="flex justify-center py-0.5">
                          <div className="w-px h-2 bg-border/30" />
                        </div>
                      )}
                    </div>
                  )
                })}

                {isEditMode && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddBlock}
                    className="w-full h-9 gap-2 text-xs border-dashed bg-transparent"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Workflow Block
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedStatus && expandedReplies && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="rounded-lg border border-border/40 bg-card overflow-hidden">
              <div
                className={cn(
                  "flex items-center justify-between px-3 py-2 border-b border-border/30",
                  selectedStat?.color,
                )}
              >
                <div className="flex items-center space-x-2">
                  <div className={cn("p-1 rounded-md", selectedStat?.color)}>
                    {selectedStat && <selectedStat.icon className={cn("h-3.5 w-3.5", selectedStat.iconColor)} />}
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-foreground">
                      {selectedStat?.label} ({replies.length})
                    </h3>
                    <p className="text-[10px] text-muted-foreground">Click company to view details</p>
                  </div>
                </div>
                <button
                  onClick={() => setExpandedReplies(!expandedReplies)}
                  className="p-1 hover:bg-background/50 rounded transition-colors"
                >
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 text-muted-foreground transition-transform",
                      !expandedReplies && "-rotate-90",
                    )}
                  />
                </button>
              </div>

              <div className="max-h-64 overflow-y-auto">
                {replies.map((reply: any) => (
                  <div
                    key={reply.id}
                    className="px-3 py-2.5 hover:bg-muted/20 transition-colors border-b border-border/20 last:border-b-0"
                  >
                    <div className="flex items-start justify-between space-x-2">
                      <div className="flex items-start space-x-2 flex-1 min-w-0">
                        <div className="p-1 rounded-full bg-muted/50 flex-shrink-0 mt-0.5">
                          <User className="h-2.5 w-2.5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-1.5 mb-0.5">
                            <button
                              onClick={() => handleCompanyClick(reply.companyId, reply.company)}
                              className="text-xs font-medium text-primary hover:underline"
                            >
                              {reply.company}
                            </button>
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground truncate">{reply.recipient}</span>
                            {reply.opens && (
                              <span className="text-[10px] text-muted-foreground">{reply.opens} opens</span>
                            )}
                            {reply.sentiment && (
                              <span className="text-[10px] text-green-600 dark:text-green-400">{reply.sentiment}</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mb-0.5">{reply.subject}</p>
                          {reply.preview && (
                            <p className="text-xs text-muted-foreground/70 line-clamp-1">{reply.preview}</p>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap flex-shrink-0">
                        {formatTimeAgo(reply.sentAt || reply.openedAt || reply.repliedAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Workflow Block</DialogTitle>
            <DialogDescription>Customize the email template and timing for this workflow step.</DialogDescription>
          </DialogHeader>

          {editingBlock && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-xs">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={editingBlock.title}
                    onChange={(e) => setEditingBlock({ ...editingBlock, title: e.target.value })}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="delay" className="text-xs">
                    Delay
                  </Label>
                  <Input
                    id="delay"
                    value={editingBlock.delay}
                    onChange={(e) => setEditingBlock({ ...editingBlock, delay: e.target.value })}
                    placeholder="e.g., 3 days after send"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-xs">
                  Description
                </Label>
                <Input
                  id="description"
                  value={editingBlock.description}
                  onChange={(e) => setEditingBlock({ ...editingBlock, description: e.target.value })}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="text-xs">
                  Email Subject
                </Label>
                <Input
                  id="subject"
                  value={editingBlock.template.subject}
                  onChange={(e) =>
                    setEditingBlock({
                      ...editingBlock,
                      template: { ...editingBlock.template, subject: e.target.value },
                    })
                  }
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body" className="text-xs">
                  Email Body
                </Label>
                <Textarea
                  id="body"
                  value={editingBlock.template.body}
                  onChange={(e) =>
                    setEditingBlock({
                      ...editingBlock,
                      template: { ...editingBlock.template, body: e.target.value },
                    })
                  }
                  rows={10}
                  className="text-sm font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Use variables like {`{{first_name}}`}, {`{{company_name}}`}, {`{{our_service}}`}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBlock}>Save Block</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isSaveTemplateDialogOpen} onOpenChange={setIsSaveTemplateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Workflow Template</DialogTitle>
            <DialogDescription>Give your workflow template a name to save it for future use.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="templateName">Template Name</Label>
              <Input
                id="templateName"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Partnership Outreach"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSaveTemplateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={!templateName.trim()}>
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
