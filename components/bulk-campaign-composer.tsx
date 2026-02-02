"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Mail,
  Sparkles,
  ChevronLeft,
  Pencil,
  ChevronDown,
  ChevronUp,
  Building2,
  Search,
  X,
  Clock,
  Trash2,
  Plus,
  GripVertical,
  Check,
  Eye,
  Users,
  Loader,
} from "lucide-react"
import { useSavedDeals } from "@/lib/saved-deals-context"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { motion } from "framer-motion"

interface BulkCampaignComposerProps {
  selectedDeals: any[]
  onClose: () => void
  onSent: () => void
  bulkDispatch?: (action: any) => void
}

interface ExecutiveRole {
  id: string
  title: string
  abbreviation: string
  description: string
}

const EXECUTIVE_ROLES: ExecutiveRole[] = [
  { id: "ceo", title: "Chief Executive Officer", abbreviation: "CEO", description: "Top executive" },
  { id: "cfo", title: "Chief Financial Officer", abbreviation: "CFO", description: "Finance lead" },
  { id: "cto", title: "Chief Technology Officer", abbreviation: "CTO", description: "Technology lead" },
  { id: "coo", title: "Chief Operating Officer", abbreviation: "COO", description: "Operations lead" },
  { id: "cmo", title: "Chief Marketing Officer", abbreviation: "CMO", description: "Marketing lead" },
  { id: "cpo", title: "Chief Product Officer", abbreviation: "CPO", description: "Product lead" },
  { id: "ciso", title: "Chief Information Security Officer", abbreviation: "CISO", description: "Security lead" },
  { id: "chro", title: "Chief Human Resources Officer", abbreviation: "CHRO", description: "HR lead" },
]

interface WorkflowBlock {
  id: string
  step: number
  title: string
  description: string
  delay: string
  emailSubject: string
  emailBody: string
  status: "pending" | "active" | "completed"
  targetExecutives?: string[]
}

const WORKFLOW_TEMPLATES = {
  cold_outreach: {
    name: "Cold Outreach",
    description: "Multi-touch sequence for new prospects",
    blocks: [
      {
        id: "1",
        step: 1,
        title: "Initial Outreach",
        description: "First contact email",
        delay: "Day 1",
        emailSubject: "Quick question about {{company}}",
        emailBody: `Hi {{firstName}},\n\nI hope this email finds you well. I came across {{company}} and was impressed by your work in {{industry}}.\n\nWe're actively looking to partner with innovative companies like yours. I'd love to schedule a brief call to explore potential opportunities for collaboration.\n\nWould you be available for a 15-minute conversation next week?\n\nBest regards,\n[Your Name]`,
        status: "active" as const,
      },
      {
        id: "2",
        step: 2,
        title: "Follow-up",
        description: "Gentle reminder if no response",
        delay: "Day 3",
        emailSubject: "Re: Quick question about {{company}}",
        emailBody: `Hi {{firstName}},\n\nI wanted to follow up on my previous email. I understand you're busy, but I believe there could be significant value in connecting.\n\nWould you have 10 minutes this week for a quick call?\n\nBest,\n[Your Name]`,
        status: "pending" as const,
      },
      {
        id: "3",
        step: 3,
        title: "Value Proposition",
        description: "Share specific benefits",
        delay: "Day 7",
        emailSubject: "How we can help {{company}}",
        emailBody: `Hi {{firstName}},\n\nI wanted to share how we've helped companies in {{industry}} achieve [specific outcome].\n\nHere are a few quick wins we could explore together:\n• [Benefit 1]\n• [Benefit 2]\n• [Benefit 3]\n\nInterested in learning more?\n\nBest,\n[Your Name]`,
        status: "pending" as const,
      },
      {
        id: "4",
        step: 4,
        title: "Final Touch",
        description: "Last attempt before closing",
        delay: "Day 14",
        emailSubject: "Closing the loop",
        emailBody: `Hi {{firstName}},\n\nI haven't heard back, so I'll assume this isn't a priority right now.\n\nIf things change, feel free to reach out. I'd be happy to reconnect.\n\nBest wishes,\n[Your Name]`,
        status: "pending" as const,
      },
    ],
  },
}

export function BulkCampaignComposer({ selectedDeals, onClose, onSent, bulkDispatch }: BulkCampaignComposerProps) {
  const { state, dispatch } = useSavedDeals()
  const [step, setStep] = useState<
    "template" | "workflow" | "add_companies" | "ai_generate" | "preview" | "confirming"
  >(selectedDeals.length === 0 ? "add_companies" : "template")
  const [selectedTemplate, setSelectedTemplate] = useState<"cold_outreach" | null>(null)
  const [workflowBlocks, setWorkflowBlocks] = useState<WorkflowBlock[]>([])
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [campaignName, setCampaignName] = useState("")
  const [isGeneratingName, setIsGeneratingName] = useState(false)
  const [localSelectedDeals, setLocalSelectedDeals] = useState(selectedDeals)
  const [isCompaniesExpanded, setIsCompaniesExpanded] = useState(false)
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<Set<string>>(new Set())
  const [companySearchQuery, setCompanySearchQuery] = useState("")
  const [aiPrompt, setAiPrompt] = useState("")
  const [isGeneratingWorkflow, setIsGeneratingWorkflow] = useState(false)
  const [selectedBlockIndex, setSelectedBlockIndex] = useState(0)
  const [editingRecipients, setEditingRecipients] = useState(false)
  const [selectedRecipientIndex, setSelectedRecipientIndex] = useState(0)
  const [selectedTone, setSelectedTone] = useState<"formal" | "personal" | "casual" | "professional">("professional")
  const [isRewritingTone, setIsRewritingTone] = useState(false)
  const [rewritingBlockId, setRewritingBlockId] = useState<string | null>(null)

  useEffect(() => {
    if (selectedDeals.length === 0) {
      setStep("add_companies")
    }
  }, [])

  useEffect(() => {
    if (selectedTemplate) {
      setWorkflowBlocks(WORKFLOW_TEMPLATES[selectedTemplate].blocks)
      generateCampaignName()
    }
  }, [selectedTemplate])

  const generateCampaignName = async () => {
    setIsGeneratingName(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const industries = [...new Set(localSelectedDeals.map((deal) => deal.industry))]
    const primaryIndustry = industries[0] || "Tech"
    const quarter = `Q${Math.ceil((new Date().getMonth() + 1) / 3)}`
    const year = new Date().getFullYear()
    const channel = selectedTemplate ? WORKFLOW_TEMPLATES[selectedTemplate].name : "Email"

    const generatedName = `${quarter} ${year} ${primaryIndustry} ${channel} Outreach`
    setCampaignName(generatedName)
    setIsGeneratingName(false)
  }

  const generateWorkflowFromAI = async () => {
    if (!aiPrompt.trim()) return

    setIsGeneratingWorkflow(true)
    console.log("[v0] Generating workflow from AI prompt:", aiPrompt)

    try {
      const response = await fetch("/api/generate-campaign-workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate workflow")
      }

      const data = await response.json()
      console.log("[v0] Generated workflow blocks:", data.blocks)

      if (data.blocks && data.blocks.length > 0) {
        setWorkflowBlocks(data.blocks)
        if (data.campaignName) {
          setCampaignName(data.campaignName)
        }
        setStep("workflow")
        toast.success("Workflow generated successfully!")
      } else {
        toast.error("Failed to generate workflow. Please try again.")
      }
    } catch (error) {
      console.error("[v0] Error generating workflow:", error)
      toast.error("Failed to generate workflow. Please try again.")
    } finally {
      setIsGeneratingWorkflow(false)
    }
  }

  const handleCreateCampaign = () => {
    if (!campaignName.trim()) return

    setStep("confirming")

    setTimeout(() => {
      const createdCampaignName = campaignName.trim()

      localSelectedDeals.forEach((deal) => {
        const isAlreadySaved = state.savedDeals.some((savedDeal) => savedDeal.name === deal.name)
        if (!isAlreadySaved) {
          dispatch({
            type: "SAVE_DEAL",
            payload: deal,
          })
        }
      })

      const dealIds = localSelectedDeals.map((deal) => deal.id)

      dispatch({
        type: "CREATE_CAMPAIGN",
        payload: {
          name: campaignName,
          description: `${selectedTemplate ? WORKFLOW_TEMPLATES[selectedTemplate].name : "Email"} campaign to ${localSelectedDeals.length} companies`,
          dealIds,
          tags: [selectedTemplate ? WORKFLOW_TEMPLATES[selectedTemplate].name : "Email"],
          workflowBlocks: workflowBlocks.map((block) => ({
            ...block,
            emailSubject: block.emailSubject
              .replace(/\{\{firstName\}\}/g, localSelectedDeals[0]?.contact?.split(" ")[0] || "there")
              .replace(/\{\{company\}\}/g, localSelectedDeals[0]?.name || "your company")
              .replace(/\{\{industry\}\}/g, localSelectedDeals[0]?.industry || "your industry"),
            emailBody: block.emailBody
              .replace(/\{\{firstName\}\}/g, localSelectedDeals[0]?.contact?.split(" ")[0] || "there")
              .replace(/\{\{company\}\}/g, localSelectedDeals[0]?.name || "your company")
              .replace(/\{\{industry\}\}/g, localSelectedDeals[0]?.industry || "your industry"),
          })),
        },
      })

      setTimeout(() => {
        onClose()

        toast.custom(
          (t) => (
            <div
              onClick={() => {
                onSent()
                toast.dismiss(t)
              }}
              className="bg-background border border-border rounded-lg shadow-lg p-4 cursor-pointer hover:bg-accent/50 transition-colors flex items-center justify-between gap-4 min-w-[320px]"
            >
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div>
                  <p className="text-sm font-semibold">{createdCampaignName}</p>
                  <p className="text-xs text-muted-foreground">Campaign created successfully</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  onSent()
                  toast.dismiss(t)
                }}
                className="h-8 px-3 text-xs flex-shrink-0"
              >
                View Campaign
              </Button>
            </div>
          ),
          {
            duration: 5000,
          },
        )
      }, 1500)
    }, 100)
  }

  const handleRemoveCompany = (dealId: string) => {
    const dealToRemove = localSelectedDeals.find((deal) => deal.id === dealId)
    setLocalSelectedDeals((prev) => prev.filter((deal) => deal.id !== dealId))

    if (dealToRemove && bulkDispatch) {
      bulkDispatch({ type: "TOGGLE_DEAL_SELECTION", payload: dealToRemove })
    }
  }

  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        e.stopPropagation()
        onClose()
      }
    }

    window.addEventListener("keydown", handleEscKey)
    return () => window.removeEventListener("keydown", handleEscKey)
  }, [onClose])

  const handleAddBlock = () => {
    const newBlock: WorkflowBlock = {
      id: Date.now().toString(),
      step: workflowBlocks.length + 1,
      title: "New Step",
      description: "Add description",
      delay: `Day ${workflowBlocks.length * 3 + 1}`,
      emailSubject: "Subject line",
      emailBody: "Email content...",
      status: "pending",
    }
    setWorkflowBlocks([...workflowBlocks, newBlock])
  }

  const handleDeleteBlock = (blockId: string) => {
    setWorkflowBlocks(workflowBlocks.filter((block) => block.id !== blockId))
  }

  const handleUpdateBlock = (blockId: string, updates: Partial<WorkflowBlock>) => {
    setWorkflowBlocks(workflowBlocks.map((block) => (block.id === blockId ? { ...block, ...updates } : block)))
  }

  const handleToggleExecutive = (blockId: string, executiveId: string) => {
    setWorkflowBlocks(
      workflowBlocks.map((block) => {
        if (block.id === blockId) {
          const currentExecutives = block.targetExecutives || EXECUTIVE_ROLES.map((role) => role.id)
          const newExecutives = currentExecutives.includes(executiveId)
            ? currentExecutives.filter((id) => id !== executiveId)
            : [...currentExecutives, executiveId]
          return { ...block, targetExecutives: newExecutives }
        }
        return block
      }),
    )
  }

  const handleSelectAllExecutives = (blockId: string) => {
    handleUpdateBlock(blockId, { targetExecutives: EXECUTIVE_ROLES.map((role) => role.id) })
  }

  const handleDeselectAllExecutives = (blockId: string) => {
    handleUpdateBlock(blockId, { targetExecutives: [] })
  }

  // Handlers for simple email and LinkedIn outreach
  const handleSimpleEmail = () => {
    const simpleEmailBlock: WorkflowBlock = {
      id: "1",
      step: 1,
      title: "Email Outreach",
      description: "Single email to prospects",
      delay: "Day 1",
      emailSubject: "Quick question about {{company}}",
      emailBody: `Hi {{firstName}},\n\nI hope this email finds you well. I came across {{company}} and was impressed by your work in {{industry}}.\n\nI'd love to connect and explore potential opportunities for collaboration.\n\nWould you be available for a brief conversation?\n\nBest regards,\n[Your Name]`,
      status: "active" as const,
    }
    setWorkflowBlocks([simpleEmailBlock])
    setSelectedTemplate(null)
    generateCampaignName()
    setStep("workflow")
  }

  const handleSimpleLinkedIn = () => {
    const simpleLinkedInBlock: WorkflowBlock = {
      id: "1",
      step: 1,
      title: "LinkedIn Message",
      description: "Single LinkedIn connection message",
      delay: "Day 1",
      emailSubject: "Connection Request",
      emailBody: `Hi {{firstName}},\n\nI noticed your work at {{company}} in the {{industry}} space and would love to connect.\n\nI think there could be some interesting synergies between what we're both working on.\n\nLooking forward to connecting!\n\nBest,\n[Your Name]`,
      status: "active" as const,
    }
    setWorkflowBlocks([simpleLinkedInBlock])
    setSelectedTemplate(null)
    generateCampaignName()
    setStep("workflow")
  }

  // Combined email + LinkedIn workflow handler
  const handleEmailPlusLinkedIn = () => {
    const combinedWorkflow: WorkflowBlock[] = [
      {
        id: "1",
        step: 1,
        title: "Email Outreach",
        description: "Initial email to prospects",
        delay: "Day 1",
        emailSubject: "Quick question about {{company}}",
        emailBody: `Hi {{firstName}},\n\nI hope this email finds you well. I came across {{company}} and was impressed by your work in {{industry}}.\n\nI'd love to connect and explore potential opportunities for collaboration.\n\nWould you be available for a brief conversation?\n\nBest regards,\n[Your Name]`,
        status: "active" as const,
      },
      {
        id: "2",
        step: 2,
        title: "LinkedIn Connection Request",
        description: "Follow up with LinkedIn connection",
        delay: "Day 2",
        emailSubject: "LinkedIn Connection Request",
        emailBody: `Hi {{firstName}},\n\nI reached out via email yesterday about {{company}}. I'd also love to connect here on LinkedIn to stay in touch.\n\nI'm impressed by your work in {{industry}} and think there could be great opportunities for us to collaborate.\n\nLooking forward to connecting!\n\nBest,\n[Your Name]`,
        status: "pending" as const,
      },
    ]
    setWorkflowBlocks(combinedWorkflow)
    setSelectedTemplate(null)
    generateCampaignName()
    setStep("workflow")
  }

  if (step === "add_companies") {
    const filteredCompanies = state.savedDeals.filter(
      (deal) =>
        deal.name.toLowerCase().includes(companySearchQuery.toLowerCase()) ||
        deal.industry.toLowerCase().includes(companySearchQuery.toLowerCase()),
    )

    const handleToggleCompany = (dealId: string) => {
      setSelectedCompanyIds((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(dealId)) {
          newSet.delete(dealId)
        } else {
          newSet.add(dealId)
        }
        return newSet
      })
    }

    const handleContinue = () => {
      const selectedCompanies = state.savedDeals.filter((deal) => selectedCompanyIds.has(deal.id))
      setLocalSelectedDeals(selectedCompanies)
      setStep("template")
      if (selectedCompanies.length > 0) {
        setTimeout(() => {
          generateCampaignName()
        }, 100)
      }
    }

    return (
      <div className="flex flex-col h-[85vh] max-h-[700px] bg-background rounded-lg overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0 p-6 border-b border-border/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Add Companies to Campaign</h3>
                <p className="text-xs text-muted-foreground">
                  Select companies from your watchlist or skip to add them later
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 flex-shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search companies..."
              value={companySearchQuery}
              onChange={(e) => setCompanySearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6 space-y-2">
            {filteredCompanies.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                {companySearchQuery ? "No companies match your search" : "No companies in watchlist"}
              </div>
            ) : (
              filteredCompanies.map((deal) => (
                <button
                  key={deal.id}
                  onClick={() => handleToggleCompany(deal.id)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
                    selectedCompanyIds.has(deal.id)
                      ? "border-primary bg-primary/5"
                      : "border-border/50 hover:border-border hover:bg-muted/30",
                  )}
                >
                  <Checkbox
                    checked={selectedCompanyIds.has(deal.id)}
                    onCheckedChange={() => handleToggleCompany(deal.id)}
                    className="flex-shrink-0"
                  />
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center flex-shrink-0 border border-primary/20">
                    <span className="text-xs font-bold text-primary">{deal.name.substring(0, 2).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{deal.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{deal.industry}</p>
                  </div>
                  <div className="text-xs text-muted-foreground flex-shrink-0">{deal.pipelineStage}</div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 border-t border-border/50 bg-background px-6 py-4 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setStep("template")}>
            Skip for now
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {selectedCompanyIds.size} {selectedCompanyIds.size === 1 ? "company" : "companies"} selected
            </span>
            <Button size="sm" onClick={handleContinue} disabled={selectedCompanyIds.size === 0}>
              Continue
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (step === "ai_generate") {
    return (
      <div className="flex flex-col h-[85vh] max-h-[700px] bg-background rounded-lg overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0 p-6 border-b border-border/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Describe Your Campaign</h3>
                <p className="text-xs text-muted-foreground">
                  Tell us what you want to achieve and we'll create a workflow for you
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 flex-shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Campaign Description</Label>
              <Textarea
                placeholder="Example: I want to reach out to SaaS companies in the Midwest. Start with a friendly introduction, follow up after 3 days if no response, then share a case study after a week, and finally send a last touch email after 2 weeks."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={8}
                className="text-sm resize-none"
                disabled={isGeneratingWorkflow}
              />
              <p className="text-xs text-muted-foreground">
                Describe your campaign goals, target audience, messaging strategy, and timing preferences.
              </p>
            </div>

            <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-xs font-semibold">AI will generate:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Campaign name based on your description</li>
                    <li>• Workflow blocks with appropriate timing</li>
                    <li>• Email subject lines and body content</li>
                    <li>• Personalization variables for each step</li>
                  </ul>
                </div>
              </div>
            </div>

            {isGeneratingWorkflow && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-primary">Generating your workflow...</p>
                    <p className="text-xs text-muted-foreground">This may take a few seconds</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 border-t border-border/50 bg-background px-6 py-4 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setStep("template")} disabled={isGeneratingWorkflow}>
            <ChevronLeft className="h-3.5 w-3.5 mr-1.5" />
            Back
          </Button>
          <Button size="sm" onClick={generateWorkflowFromAI} disabled={!aiPrompt.trim() || isGeneratingWorkflow}>
            {isGeneratingWorkflow ? (
              <>
                <Sparkles className="h-3.5 w-3.5 mr-1.5 animate-pulse" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Generate Workflow
              </>
            )}
          </Button>
        </div>
      </div>
    )
  }

  if (step === "template") {
    return (
      <div className="flex flex-col h-[85vh] max-h-[700px] bg-background rounded-lg overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0 p-6 border-b border-border/50">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-base font-semibold">Campaign Template</h3>
                <p className="text-xs text-muted-foreground">Select a pre-built workflow or start from scratch</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 flex-shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6 space-y-4">
            {/* Quick Start section for simple outreach */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="text-xs font-semibold text-muted-foreground">Quick Start</h4>
                <div className="flex-1 h-px bg-border/50" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={handleSimpleEmail}
                  className="text-left p-4 rounded-lg border border-border/50 hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="flex flex-col gap-2">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                      <Mail className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-0.5">Simple Email</h4>
                      <p className="text-xs text-muted-foreground">Single email outreach</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={handleSimpleLinkedIn}
                  className="text-left p-4 rounded-lg border border-border/50 hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="flex flex-col gap-2">
                    <div className="w-9 h-9 rounded-lg bg-blue-600/10 flex items-center justify-center group-hover:bg-blue-600/20 transition-colors">
                      <svg
                        className="h-4 w-4 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-0.5">Simple LinkedIn</h4>
                      <p className="text-xs text-muted-foreground">Single connection message</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={handleEmailPlusLinkedIn}
                  className="text-left p-4 rounded-lg border border-border/50 hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="flex flex-col gap-2">
                    <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                      <div className="relative w-4 h-4">
                        <Mail className="h-3 w-3 text-purple-500 absolute top-0 left-0" />
                        <svg
                          className="h-3 w-3 text-purple-600 absolute bottom-0 right-0"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold mb-0.5">Email + LinkedIn</h4>
                      <p className="text-xs text-muted-foreground">Multi-channel outreach</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold text-muted-foreground">Multi-Step Templates</h4>
              <div className="flex-1 h-px bg-border/50" />
            </div>

            <div className="space-y-3">
              {Object.entries(WORKFLOW_TEMPLATES).map(([key, template]) => (
                <button
                  key={key}
                  onClick={() => {
                    setSelectedTemplate(key as "cold_outreach")
                    setStep("workflow")
                  }}
                  className="w-full text-left p-4 rounded-lg border border-border/50 hover:border-primary hover:bg-primary/5 transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold mb-1">{template.name}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{template.blocks.length} workflow blocks</span>
                        <span>•</span>
                        <span>{template.blocks[template.blocks.length - 1].delay} duration</span>
                      </div>
                    </div>
                    <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors -rotate-90" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 border-t border-border/50 bg-background px-6 py-4 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setAiPrompt("")
              setStep("ai_generate")
            }}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Start from scratch
          </Button>
        </div>
      </div>
    )
  }

  if (step === "preview") {
    const selectedBlock = workflowBlocks[selectedBlockIndex]
    const selectedRecipient = localSelectedDeals[selectedRecipientIndex]

    // Replace template variables with actual data for preview
    const previewSubject = selectedBlock.emailSubject
      .replace(/\{\{firstName\}\}/g, selectedRecipient?.contact?.split(" ")[0] || "John")
      .replace(/\{\{company\}\}/g, selectedRecipient?.name || "Company Name")
      .replace(/\{\{industry\}\}/g, selectedRecipient?.industry || "Industry")

    const previewBody = selectedBlock.emailBody
      .replace(/\{\{firstName\}\}/g, selectedRecipient?.contact?.split(" ")[0] || "John")
      .replace(/\{\{company\}\}/g, selectedRecipient?.name || "Company Name")
      .replace(/\{\{industry\}\}/g, selectedRecipient?.industry || "Industry")

    return (
      <div className="flex flex-col h-[85vh] max-h-[700px] bg-background rounded-lg overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0 p-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("workflow")}
                className="h-8 w-8 p-0 flex-shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div>
                <h3 className="text-sm font-semibold">{campaignName}</h3>
                <p className="text-xs text-muted-foreground">
                  {localSelectedDeals.length} recipients • {workflowBlocks.length} emails
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 flex-shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-muted/20">
          <div className="max-w-3xl mx-auto p-6 space-y-4">
            <div className="bg-background rounded-lg border border-border/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-semibold text-foreground">Recipients ({localSelectedDeals.length})</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingRecipients(!editingRecipients)}
                  className="h-7 text-xs"
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  {editingRecipients ? "Done" : "Edit"}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {localSelectedDeals.map((deal, index) => (
                  <button
                    key={deal.id}
                    onClick={() => !editingRecipients && setSelectedRecipientIndex(index)}
                    className={cn(
                      "group relative flex items-center gap-2 px-3 py-2 rounded-lg border transition-all",
                      selectedRecipientIndex === index && !editingRecipients
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border/50 hover:border-border hover:bg-muted/50",
                      editingRecipients && "pr-8",
                    )}
                  >
                    <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-[10px] font-bold text-primary">
                        {deal.name.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-medium text-foreground">{deal.name}</p>
                      <p className="text-[10px] text-muted-foreground">{deal.industry}</p>
                    </div>
                    {selectedRecipientIndex === index && !editingRecipients && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <Eye className="h-2.5 w-2.5 text-primary-foreground" />
                      </div>
                    )}
                    {editingRecipients && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveCompany(deal.id)
                          if (selectedRecipientIndex >= localSelectedDeals.length - 1) {
                            setSelectedRecipientIndex(Math.max(0, localSelectedDeals.length - 2))
                          }
                        }}
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive/10 hover:bg-destructive/20 flex items-center justify-center transition-colors"
                      >
                        <X className="h-3 w-3 text-destructive" />
                      </button>
                    )}
                  </button>
                ))}
              </div>
              {!editingRecipients && (
                <p className="text-[10px] text-muted-foreground mt-2">
                  Click on a recipient to preview their personalized email
                </p>
              )}
            </div>

            {/* Workflow Step Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {workflowBlocks.map((block, index) => (
                <button
                  key={block.id}
                  onClick={() => setSelectedBlockIndex(index)}
                  className={cn(
                    "flex-shrink-0 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all",
                    selectedBlockIndex === index
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/50 bg-background hover:border-border hover:bg-muted/50",
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold">{block.step}</span>
                    <span className="hidden sm:inline">{block.title}</span>
                    <span className="text-[10px] opacity-70">• {block.delay}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Email Preview Card */}
            <div className="bg-background rounded-lg border border-border/50 shadow-sm overflow-hidden">
              {/* Email Header */}
              <div className="p-4 border-b border-border/50 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground w-12 flex-shrink-0">From:</Label>
                      <p className="text-sm text-foreground">Your Name &lt;you@company.com&gt;</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Label className="text-xs text-muted-foreground w-12 flex-shrink-0 pt-0.5">To:</Label>
                      <div className="flex-1">
                        <p className="text-sm text-foreground">
                          {selectedRecipient.contact || selectedRecipient.name} &lt;contact@
                          {selectedRecipient.name.toLowerCase().replace(/\s+/g, "")}.com&gt;
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground w-12 flex-shrink-0">Subject:</Label>
                      <p className="text-sm font-semibold text-foreground">{previewSubject}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 min-h-[300px] bg-background">
                <div className="space-y-3">
                  {previewBody.split("\n").map((line, index) => (
                    <p key={index} className="text-sm leading-relaxed text-foreground">
                      {line || <br />}
                    </p>
                  ))}
                </div>
              </div>

              {/* Email Footer */}
              <div className="px-6 py-3 border-t border-border/50 bg-muted/20">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Scheduled for {selectedBlock.delay}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setStep("workflow")
                      setEditingBlockId(selectedBlock.id)
                    }}
                    className="h-7 text-xs"
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit Email
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 border-t border-border/50 bg-background px-6 py-4 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setStep("workflow")}>
            <ChevronLeft className="h-3.5 w-3.5 mr-1.5" />
            Back to Edit
          </Button>
          <Button size="sm" onClick={handleCreateCampaign}>
            <Check className="h-3.5 w-3.5 mr-1.5" />
            Create Campaign
          </Button>
        </div>
      </div>
    )
  }

  if (step === "confirming") {
    return (
      <div className="flex flex-col h-[85vh] max-h-[700px] bg-background rounded-lg overflow-hidden">
        <div className="flex-1 flex items-center justify-center p-6">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center gap-6"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
              className="relative"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, duration: 0.3 }}
                  className="w-20 h-20 rounded-full bg-green-500/30 flex items-center justify-center"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.6, duration: 0.4, ease: "easeOut" }}
                  >
                    <Check className="h-12 w-12 text-green-500" strokeWidth={3} />
                  </motion.div>
                </motion.div>
              </motion.div>

              {/* Confetti particles */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
                  animate={{
                    scale: [0, 1, 0],
                    x: Math.cos((i * Math.PI * 2) / 12) * 80,
                    y: Math.sin((i * Math.PI * 2) / 12) * 80,
                    opacity: [0, 1, 0],
                  }}
                  transition={{ delay: 0.7, duration: 0.8, ease: "easeOut" }}
                  className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full"
                  style={{
                    backgroundColor: ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b"][i % 4],
                  }}
                />
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="text-center"
            >
              <h3 className="text-xl font-bold mb-2">Campaign Created!</h3>
              <p className="text-sm text-muted-foreground">Your campaign is ready to launch</p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    )
  }

  if (step === "workflow") {
    const handleRewriteTone = async (blockId: string, tone: "formal" | "personal" | "casual" | "professional") => {
      const block = workflowBlocks.find((b) => b.id === blockId)
      if (!block || !block.emailBody.trim()) return

      setIsRewritingTone(true)
      setRewritingBlockId(blockId)
      setSelectedTone(tone)

      try {
        const response = await fetch("/api/rewrite-email-tone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ emailContent: block.emailBody, tone }),
        })

        if (!response.ok) throw new Error("Failed to rewrite email")

        const { rewrittenContent } = await response.json()
        handleUpdateBlock(blockId, { emailBody: rewrittenContent })
        toast.success(`Email rewritten in ${tone} tone`)
      } catch (error) {
        console.error("[v0] Error rewriting email tone:", error)
        toast.error("Failed to rewrite email. Please try again.")
      } finally {
        setIsRewritingTone(false)
        setRewritingBlockId(null)
      }
    }

    return (
      <div className="flex flex-col h-[85vh] max-h-[700px] bg-background rounded-lg overflow-hidden">
        {/* Fixed Header */}
        <div className="flex-shrink-0 border-b border-border/50">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep("template")}
                className="h-8 w-8 p-0 flex-shrink-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 group">
                  <Input
                    placeholder="Campaign name..."
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    className="w-full h-9 text-base font-bold border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0 hover:bg-muted/30 hover:px-2 transition-all rounded"
                    disabled={isGeneratingName}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    onClick={() => {
                      const input = document.querySelector('input[placeholder="Campaign name..."]') as HTMLInputElement
                      input?.focus()
                      input?.select()
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </div>
                <button
                  onClick={() => setIsCompaniesExpanded(!isCompaniesExpanded)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <span>{localSelectedDeals.length} companies selected</span>
                  {isCompaniesExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 flex-shrink-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {isCompaniesExpanded && (
            <div className="px-6 pb-3 border-t border-border/50">
              <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto p-1">
                {localSelectedDeals.map((deal) => (
                  <div
                    key={deal.id}
                    className="group relative flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-card hover:border-border hover:shadow-sm transition-all"
                  >
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-primary">{deal.name.substring(0, 2).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{deal.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{deal.industry}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveCompany(deal.id)}
                      className="absolute top-1.5 right-1.5 h-4 w-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                    >
                      <span className="text-foreground text-sm leading-none">×</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Workflow Blocks</Label>
              <p className="text-xs text-muted-foreground">
                Customize each step of your campaign workflow. Click to edit details.
              </p>
            </div>

            <div className="space-y-2">
              {workflowBlocks.map((block) => {
                const selectedExecutives = block.targetExecutives || EXECUTIVE_ROLES.map((role) => role.id)
                const executiveCount = selectedExecutives.length

                return (
                  <div key={block.id} className="border border-border/50 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setEditingBlockId(editingBlockId === block.id ? null : block.id)}
                      className="w-full p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-primary">{block.step}</span>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-semibold truncate">{block.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{block.description}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Users className="h-3 w-3 text-primary" />
                          <span className="text-xs text-primary font-medium">
                            {executiveCount} C-level {executiveCount === 1 ? "executive" : "executives"}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{block.delay}</span>
                        </div>
                        {editingBlockId === block.id ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {editingBlockId === block.id && (
                      <div className="p-4 border-t border-border/50 bg-muted/20 space-y-3">
                        <div className="space-y-2 p-3 rounded-lg border border-primary/20 bg-primary/5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-primary" />
                              <Label className="text-xs font-semibold text-primary">Target C-Level Executives</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSelectAllExecutives(block.id)}
                                className="h-6 text-xs px-2"
                              >
                                Select All
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeselectAllExecutives(block.id)}
                                className="h-6 text-xs px-2"
                              >
                                Clear
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Select which C-level executives will receive this email at each company
                          </p>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {EXECUTIVE_ROLES.map((role) => {
                              const isSelected = selectedExecutives.includes(role.id)
                              return (
                                <button
                                  key={role.id}
                                  onClick={() => handleToggleExecutive(block.id, role.id)}
                                  className={cn(
                                    "flex items-center gap-2 p-2 rounded-lg border transition-all text-left",
                                    isSelected
                                      ? "border-primary bg-primary/10"
                                      : "border-border/50 hover:border-border hover:bg-muted/30",
                                  )}
                                >
                                  <Checkbox checked={isSelected} className="flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold truncate">{role.abbreviation}</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{role.description}</p>
                                  </div>
                                </button>
                              )
                            })}
                          </div>
                          <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                            <div className="flex-1 text-xs text-muted-foreground">
                              {executiveCount} {executiveCount === 1 ? "executive" : "executives"} selected ×{" "}
                              {localSelectedDeals.length} {localSelectedDeals.length === 1 ? "company" : "companies"} ={" "}
                              <span className="font-semibold text-primary">
                                {executiveCount * localSelectedDeals.length} total recipients
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <Label className="text-xs">Title</Label>
                            <Input
                              value={block.title}
                              onChange={(e) => handleUpdateBlock(block.id, { title: e.target.value })}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <Label className="text-xs">Delay</Label>
                            <Input
                              value={block.delay}
                              onChange={(e) => handleUpdateBlock(block.id, { delay: e.target.value })}
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Description</Label>
                          <Input
                            value={block.description}
                            onChange={(e) => handleUpdateBlock(block.id, { description: e.target.value })}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Email Subject</Label>
                          <Input
                            value={block.emailSubject}
                            onChange={(e) => handleUpdateBlock(block.id, { emailSubject: e.target.value })}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Email Body</Label>
                          <Textarea
                            value={block.emailBody}
                            onChange={(e) => handleUpdateBlock(block.id, { emailBody: e.target.value })}
                            rows={6}
                            className="text-sm font-mono resize-none"
                          />
                          <p className="text-xs text-muted-foreground">
                            Use {`{{firstName}}`}, {`{{company}}`}, {`{{industry}}`} for personalization
                          </p>
                        </div>

                        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <Label className="text-xs font-semibold text-primary">AI Tone Adjustment</Label>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Rewrite this email in a different tone while preserving the core message
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant={
                                selectedTone === "formal" && rewritingBlockId === block.id ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => handleRewriteTone(block.id, "formal")}
                              disabled={isRewritingTone}
                              className="h-7 text-xs"
                            >
                              {isRewritingTone && rewritingBlockId === block.id && selectedTone === "formal" && (
                                <Loader className="h-3 w-3 mr-1 animate-spin" />
                              )}
                              Formal
                            </Button>
                            <Button
                              variant={
                                selectedTone === "professional" && rewritingBlockId === block.id ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => handleRewriteTone(block.id, "professional")}
                              disabled={isRewritingTone}
                              className="h-7 text-xs"
                            >
                              {isRewritingTone && rewritingBlockId === block.id && selectedTone === "professional" && (
                                <Loader className="h-3 w-3 mr-1 animate-spin" />
                              )}
                              Professional
                            </Button>
                            <Button
                              variant={
                                selectedTone === "personal" && rewritingBlockId === block.id ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => handleRewriteTone(block.id, "personal")}
                              disabled={isRewritingTone}
                              className="h-7 text-xs"
                            >
                              {isRewritingTone && rewritingBlockId === block.id && selectedTone === "personal" && (
                                <Loader className="h-3 w-3 mr-1 animate-spin" />
                              )}
                              Personal
                            </Button>
                            <Button
                              variant={
                                selectedTone === "casual" && rewritingBlockId === block.id ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => handleRewriteTone(block.id, "casual")}
                              disabled={isRewritingTone}
                              className="h-7 text-xs"
                            >
                              {isRewritingTone && rewritingBlockId === block.id && selectedTone === "casual" && (
                                <Loader className="h-3 w-3 mr-1 animate-spin" />
                              )}
                              Casual
                            </Button>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBlock(block.id)}
                            className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                            Delete Block
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              <Button variant="outline" size="sm" onClick={handleAddBlock} className="w-full bg-transparent">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Workflow Block
              </Button>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="flex-shrink-0 border-t border-border/50 bg-background px-6 py-4 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => setStep("template")}>
            <ChevronLeft className="h-3.5 w-3.5 mr-1.5" />
            Back
          </Button>
          <Button
            size="sm"
            onClick={() => setStep("preview")}
            disabled={!campaignName.trim() || workflowBlocks.length === 0}
          >
            <Eye className="h-3.5 w-3.5 mr-1.5" />
            Preview Campaign
          </Button>
        </div>
      </div>
    )
  }

  return null
}
