"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { TagInput } from "@/components/tag-input"
import {
  Mail,
  Linkedin,
  Plus,
  Send,
  Building2,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  MoveUp,
  MoveDown,
  Sparkles,
  ChevronRight,
} from "lucide-react"
import { useSavedDeals } from "@/lib/saved-deals-context"
import { cn } from "@/lib/utils"

interface CampaignCreationDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preSelectedDeals?: any[]
}

interface WorkflowBlock {
  id: string
  title: string
  description: string
  delay: string
  emailSubject: string
  emailBody: string
  status: "pending" | "active" | "completed"
}

interface WorkflowTemplate {
  id: string
  name: string
  description: string
  blocks: WorkflowBlock[]
}

const defaultTemplates: WorkflowTemplate[] = [
  {
    id: "cold-outreach",
    name: "Cold Outreach",
    description: "Standard 4-step cold outreach sequence",
    blocks: [
      {
        id: "1",
        title: "Initial Contact",
        description: "First touchpoint introducing your company",
        delay: "0 days",
        emailSubject: "Quick question about {{company}}",
        emailBody: `Hi {{firstName}},\n\nI came across {{company}} and was impressed by your work in {{industry}}.\n\nWe're helping companies like yours achieve [specific benefit]. Would you be open to a brief conversation?\n\nBest regards,\n[Your Name]`,
        status: "active",
      },
      {
        id: "2",
        title: "Follow-up",
        description: "Gentle reminder with additional value",
        delay: "3 days",
        emailSubject: "Re: Quick question about {{company}}",
        emailBody: `Hi {{firstName}},\n\nI wanted to follow up on my previous email. I thought you might find this case study relevant: [link]\n\nWould you have 15 minutes this week to discuss?\n\nBest,\n[Your Name]`,
        status: "pending",
      },
      {
        id: "3",
        title: "Value Proposition",
        description: "Share specific benefits and social proof",
        delay: "7 days",
        emailSubject: "How we helped [Similar Company]",
        emailBody: `Hi {{firstName}},\n\nI wanted to share how we recently helped [Similar Company] achieve [specific result].\n\nI believe we could deliver similar results for {{company}}. Are you available for a quick call?\n\nBest,\n[Your Name]`,
        status: "pending",
      },
      {
        id: "4",
        title: "Final Touchpoint",
        description: "Last attempt with clear CTA",
        delay: "14 days",
        emailSubject: "Should I close your file?",
        emailBody: `Hi {{firstName}},\n\nI haven't heard back, so I wanted to check if this is still relevant for {{company}}.\n\nIf now isn't the right time, I completely understand. Just let me know and I'll follow up in a few months.\n\nBest,\n[Your Name]`,
        status: "pending",
      },
    ],
  },
  {
    id: "warm-intro",
    name: "Warm Introduction",
    description: "2-step sequence for warm leads",
    blocks: [
      {
        id: "1",
        title: "Introduction",
        description: "Personalized introduction",
        delay: "0 days",
        emailSubject: "[Mutual Contact] suggested I reach out",
        emailBody: `Hi {{firstName}},\n\n[Mutual Contact] mentioned you might be interested in [topic]. I'd love to share how we're helping companies in {{industry}}.\n\nWould you be open to a brief call?\n\nBest,\n[Your Name]`,
        status: "active",
      },
      {
        id: "2",
        title: "Follow-up",
        description: "Quick follow-up with scheduling link",
        delay: "5 days",
        emailSubject: "Re: [Mutual Contact] suggested I reach out",
        emailBody: `Hi {{firstName}},\n\nJust wanted to follow up. Here's my calendar link if you'd like to schedule a time: [link]\n\nLooking forward to connecting!\n\nBest,\n[Your Name]`,
        status: "pending",
      },
    ],
  },
]

export function CampaignCreationDrawer({ open, onOpenChange, preSelectedDeals = [] }: CampaignCreationDrawerProps) {
  const { state, dispatch } = useSavedDeals()
  const [step, setStep] = useState<"template" | "customize" | "companies">("template")
  const [campaignType, setCampaignType] = useState<"email" | "linkedin">("email")
  const [campaignName, setCampaignName] = useState("")
  const [campaignDescription, setCampaignDescription] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [selectedDeals, setSelectedDeals] = useState<any[]>(preSelectedDeals)
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null)
  const [workflowBlocks, setWorkflowBlocks] = useState<WorkflowBlock[]>([])
  const [editingBlock, setEditingBlock] = useState<WorkflowBlock | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleSelectTemplate = (template: WorkflowTemplate) => {
    setSelectedTemplate(template)
    setWorkflowBlocks([...template.blocks])
    setCampaignName(template.name)
    setCampaignDescription(template.description)
    setStep("customize")
  }

  const handleEditBlock = (block: WorkflowBlock) => {
    setEditingBlock({ ...block })
    setIsEditDialogOpen(true)
  }

  const handleSaveBlock = () => {
    if (!editingBlock) return
    setWorkflowBlocks((blocks) => blocks.map((b) => (b.id === editingBlock.id ? editingBlock : b)))
    setIsEditDialogOpen(false)
    setEditingBlock(null)
  }

  const handleDeleteBlock = (blockId: string) => {
    setWorkflowBlocks((blocks) => blocks.filter((b) => b.id !== blockId))
  }

  const handleMoveBlock = (blockId: string, direction: "up" | "down") => {
    const index = workflowBlocks.findIndex((b) => b.id === blockId)
    if (index === -1) return
    if (direction === "up" && index === 0) return
    if (direction === "down" && index === workflowBlocks.length - 1) return

    const newBlocks = [...workflowBlocks]
    const targetIndex = direction === "up" ? index - 1 : index + 1
    ;[newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]]
    setWorkflowBlocks(newBlocks)
  }

  const handleAddBlock = () => {
    const newBlock: WorkflowBlock = {
      id: Date.now().toString(),
      title: "New Step",
      description: "Add description",
      delay: "0 days",
      emailSubject: "Subject line",
      emailBody: "Email content...",
      status: "pending",
    }
    setWorkflowBlocks([...workflowBlocks, newBlock])
  }

  const handleCreateCampaign = () => {
    if (!campaignName.trim()) return

    const dealIds = selectedDeals.map((deal) => deal.id)

    dispatch({
      type: "CREATE_CAMPAIGN",
      payload: {
        name: campaignName,
        description: campaignDescription,
        dealIds,
        tags: [...tags, campaignType],
      },
    })

    // Reset form
    setCampaignName("")
    setCampaignDescription("")
    setTags([])
    setSelectedDeals([])
    setWorkflowBlocks([])
    setSelectedTemplate(null)
    setStep("template")
    onOpenChange(false)
  }

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[85vh] max-h-[85vh]">
          <div className="mx-auto w-full max-w-5xl h-full flex flex-col">
            <DrawerHeader className="border-b border-border/40 px-6 py-4">
              <DrawerTitle className="text-xl font-semibold">Create New Campaign</DrawerTitle>
              <DrawerDescription className="text-sm">
                {step === "template" && "Choose a workflow template to get started"}
                {step === "customize" && "Customize your workflow blocks and campaign details"}
                {step === "companies" && "Select companies for your campaign"}
              </DrawerDescription>
            </DrawerHeader>

            <ScrollArea className="flex-1">
              <div className="px-6 py-6">
                {step === "template" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Campaign Type</Label>
                      <div className="grid grid-cols-2 gap-3 max-w-md">
                        <button
                          onClick={() => setCampaignType("email")}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
                            campaignType === "email"
                              ? "border-primary bg-primary/5"
                              : "border-border/40 hover:border-border",
                          )}
                        >
                          <div
                            className={cn(
                              "w-9 h-9 rounded-lg flex items-center justify-center",
                              campaignType === "email" ? "bg-primary/10" : "bg-muted/50",
                            )}
                          >
                            <Mail
                              className={cn(
                                "h-4 w-4",
                                campaignType === "email" ? "text-primary" : "text-muted-foreground",
                              )}
                            />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium">Email</p>
                            <p className="text-xs text-muted-foreground">Direct outreach</p>
                          </div>
                        </button>
                        <button
                          onClick={() => setCampaignType("linkedin")}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border-2 transition-all",
                            campaignType === "linkedin"
                              ? "border-primary bg-primary/5"
                              : "border-border/40 hover:border-border",
                          )}
                        >
                          <div
                            className={cn(
                              "w-9 h-9 rounded-lg flex items-center justify-center",
                              campaignType === "linkedin" ? "bg-primary/10" : "bg-muted/50",
                            )}
                          >
                            <Linkedin
                              className={cn(
                                "h-4 w-4",
                                campaignType === "linkedin" ? "text-primary" : "text-muted-foreground",
                              )}
                            />
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-medium">LinkedIn</p>
                            <p className="text-xs text-muted-foreground">Social outreach</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-sm font-semibold">Choose Workflow Template</Label>
                      <div className="grid gap-3">
                        {defaultTemplates.map((template) => (
                          <button
                            key={template.id}
                            onClick={() => handleSelectTemplate(template)}
                            className="flex items-start gap-4 p-4 rounded-lg border border-border/40 hover:border-primary/50 hover:bg-muted/30 transition-all text-left group"
                          >
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Sparkles className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-semibold">{template.name}</h4>
                                <Badge variant="secondary" className="text-xs">
                                  {template.blocks.length} blocks
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                              <div className="flex items-center gap-2 flex-wrap">
                                {template.blocks.slice(0, 3).map((block, idx) => (
                                  <span key={idx} className="text-xs text-muted-foreground">
                                    {idx > 0 && "→"} {block.title}
                                  </span>
                                ))}
                                {template.blocks.length > 3 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{template.blocks.length - 3} more
                                  </span>
                                )}
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === "customize" && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="campaign-name" className="text-sm font-semibold">
                          Campaign Name
                        </Label>
                        <Input
                          id="campaign-name"
                          placeholder="Q1 2024 SaaS Outreach"
                          value={campaignName}
                          onChange={(e) => setCampaignName(e.target.value)}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-semibold">Tags</Label>
                        <TagInput
                          tags={tags}
                          onChange={setTags}
                          suggestions={state.availableTags}
                          placeholder="Add tags..."
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description" className="text-sm font-semibold">
                        Description
                      </Label>
                      <Textarea
                        id="description"
                        placeholder="Campaign description..."
                        value={campaignDescription}
                        onChange={(e) => setCampaignDescription(e.target.value)}
                        rows={2}
                        className="resize-none"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Workflow Blocks ({workflowBlocks.length})</Label>
                        <Button variant="outline" size="sm" onClick={handleAddBlock} className="h-8 bg-transparent">
                          <Plus className="h-3.5 w-3.5 mr-1.5" />
                          Add Block
                        </Button>
                      </div>

                      <div className="space-y-2">
                        {workflowBlocks.map((block, index) => (
                          <div key={block.id} className="relative">
                            <div className="flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-card hover:border-border transition-colors">
                              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                  <span className="text-xs font-bold text-primary">{index + 1}</span>
                                </div>
                                {index < workflowBlocks.length - 1 && <div className="w-px h-6 bg-border/40" />}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-semibold truncate">{block.title}</h4>
                                    <p className="text-xs text-muted-foreground truncate">{block.description}</p>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleMoveBlock(block.id, "up")}
                                      disabled={index === 0}
                                      className="h-7 w-7 p-0"
                                    >
                                      <MoveUp className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleMoveBlock(block.id, "down")}
                                      disabled={index === workflowBlocks.length - 1}
                                      className="h-7 w-7 p-0"
                                    >
                                      <MoveDown className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleEditBlock(block)}
                                      className="h-7 w-7 p-0"
                                    >
                                      <Edit2 className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteBlock(block.id)}
                                      className="h-7 w-7 p-0 hover:text-destructive"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 text-xs">
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    <span>{block.delay}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-muted-foreground">
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate max-w-[200px]">{block.emailSubject}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === "companies" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-semibold">Selected Companies ({selectedDeals.length})</Label>
                    </div>
                    <div className="text-center py-12 text-sm text-muted-foreground">
                      Company selection coming soon...
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="border-t border-border/40 px-6 py-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  {step === "customize" && (
                    <>
                      <Building2 className="h-4 w-4" />
                      <span>{workflowBlocks.length} workflow blocks</span>
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {step === "template" && (
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                      Cancel
                    </Button>
                  )}
                  {step === "customize" && (
                    <>
                      <Button variant="outline" onClick={() => setStep("template")}>
                        Back
                      </Button>
                      <Button onClick={handleCreateCampaign} disabled={!campaignName.trim()}>
                        <Send className="h-4 w-4 mr-2" />
                        Create Campaign
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Workflow Block</DialogTitle>
          </DialogHeader>
          {editingBlock && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="block-title" className="text-sm font-semibold">
                    Block Title
                  </Label>
                  <Input
                    id="block-title"
                    value={editingBlock.title}
                    onChange={(e) => setEditingBlock({ ...editingBlock, title: e.target.value })}
                    placeholder="e.g., Initial Contact"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="block-delay" className="text-sm font-semibold">
                    Delay
                  </Label>
                  <Input
                    id="block-delay"
                    value={editingBlock.delay}
                    onChange={(e) => setEditingBlock({ ...editingBlock, delay: e.target.value })}
                    placeholder="e.g., 3 days"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="block-description" className="text-sm font-semibold">
                  Description
                </Label>
                <Input
                  id="block-description"
                  value={editingBlock.description}
                  onChange={(e) => setEditingBlock({ ...editingBlock, description: e.target.value })}
                  placeholder="Brief description of this step"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-subject" className="text-sm font-semibold">
                  Email Subject
                </Label>
                <Input
                  id="email-subject"
                  value={editingBlock.emailSubject}
                  onChange={(e) => setEditingBlock({ ...editingBlock, emailSubject: e.target.value })}
                  placeholder="Subject line"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email-body" className="text-sm font-semibold">
                  Email Body
                </Label>
                <Textarea
                  id="email-body"
                  value={editingBlock.emailBody}
                  onChange={(e) => setEditingBlock({ ...editingBlock, emailBody: e.target.value })}
                  rows={8}
                  className="font-mono text-sm resize-none"
                  placeholder="Email content..."
                />
                <p className="text-xs text-muted-foreground">
                  Use {`{{firstName}}`}, {`{{company}}`}, {`{{industry}}`} for personalization
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBlock}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
