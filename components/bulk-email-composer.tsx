"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Mail, X, Edit, Send, Loader, Users, Eye, Settings, ChevronDown, ChevronUp, Sparkles } from "lucide-react"
import { useBulkActions } from "@/lib/bulk-actions-context"
import { useInboxDispatch } from "@/lib/inbox-context"

interface BulkEmailComposerProps {
  onClose: () => void
  onSent: (deals: any[]) => void
}

export function BulkEmailComposer({ onClose, onSent }: BulkEmailComposerProps) {
  const { state } = useBulkActions()
  const inboxDispatch = useInboxDispatch()
  const [emailSubject, setEmailSubject] = useState("")
  const [emailBody, setEmailBody] = useState("")
  const [isEditing, setIsEditing] = useState(true)
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "sent">("idle")
  const [showSettings, setShowSettings] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [selectedTone, setSelectedTone] = useState<"formal" | "personal" | "casual" | "professional">("professional")
  const [isRewriting, setIsRewriting] = useState(false)

  const [multiplier, setMultiplier] = useState(8.5)
  const [enthusiasm, setEnthusiasm] = useState(7)
  const [formality, setFormality] = useState(5)

  const selectedDeals = state.selectedDeals

  useEffect(() => {
    const generateBulkEmailContent = () => {
      const dealCount = selectedDeals.length
      const industries = [...new Set(selectedDeals.map((deal) => deal.industry))].join(", ")
      const enthusiasmLevel = enthusiasm > 7 ? "very excited" : enthusiasm > 4 ? "interested" : "considering"
      const formalityTone = formality > 7 ? "formal" : formality > 4 ? "professional" : "casual"
      const multiplierText =
        multiplier > 10 ? "premium valuation" : multiplier > 7 ? "competitive valuation" : "attractive valuation"

      setEmailSubject(`Investment Partnership Opportunities - ${dealCount} Companies`)

      setEmailBody(`Dear Team,

I hope this message finds you well. I'm reaching out from our investment firm regarding potential partnership opportunities with your company.

We've been conducting market research in the ${industries} sector${dealCount > 1 ? "s" : ""} and have identified ${dealCount} companies, including yours, that align perfectly with our investment thesis. We are ${enthusiasmLevel} about the possibility of working together.

Based on our preliminary analysis, we believe these represent excellent investment opportunities. We're prepared to discuss ${multiplierText} structures, typically around ${multiplier}x EBITDA multiples, reflecting our confidence in strong business models and growth potential.

Our firm specializes in partnering with companies to accelerate growth while preserving the entrepreneurial culture that made you successful. We'd welcome the opportunity to discuss how we can support your continued expansion.

Would you be available for a brief call in the coming weeks to explore this opportunity further?

Best regards,
[Your Name]
[Your Firm]`)
    }

    generateBulkEmailContent()
  }, [selectedDeals, multiplier, enthusiasm, formality])

  const handleRewriteTone = async (tone: "formal" | "personal" | "casual" | "professional") => {
    if (!emailBody.trim()) return

    setIsRewriting(true)
    setSelectedTone(tone)

    try {
      const response = await fetch("/api/rewrite-email-tone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailContent: emailBody, tone }),
      })

      if (!response.ok) throw new Error("Failed to rewrite email")

      const { rewrittenContent } = await response.json()
      setEmailBody(rewrittenContent)
    } catch (error) {
      console.error("[v0] Error rewriting email tone:", error)
    } finally {
      setIsRewriting(false)
    }
  }

  const handleSend = async () => {
    setSendStatus("sending")
    await new Promise((resolve) => setTimeout(resolve, 3000))

    selectedDeals.forEach((deal) => {
      inboxDispatch({
        type: "ADD_OUTREACH_THREAD",
        payload: {
          deal,
          outreachContent: emailBody.replace(/\[Company Name\]/g, deal.name),
        },
      })
    })

    onSent(selectedDeals)
  }

  const getPersonalizedPreview = (deal: any) => {
    return emailBody.replace(/\[Company Name\]/g, deal.name).replace(/your company/g, deal.name)
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="w-full h-full bg-background border border-border rounded-lg shadow-xl flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Mail className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Bulk Email Campaign</h3>
            <p className="text-sm text-muted-foreground">Sending to {selectedDeals.length} companies</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        <div className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          <div className="p-4 border-b border-border flex-shrink-0">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground mb-1 block">Subject Line</label>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="text-sm"
                  readOnly={!isEditing || sendStatus !== "idle"}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {selectedDeals.length} recipients
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                  className="h-6 px-2 text-xs"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  {showPreview ? "Hide" : "Preview"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  className="h-6 px-2 text-xs"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  Settings
                  {showSettings ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
                </Button>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {showSettings && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-b border-border bg-secondary/30 overflow-hidden flex-shrink-0"
              >
                <div className="p-4 space-y-4">
                  <div>
                    <h5 className="text-sm font-medium text-foreground mb-3">Email Customization</h5>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-medium text-foreground mb-1 block">
                          Multiple: {multiplier}x
                        </label>
                        <input
                          type="range"
                          min="4"
                          max="15"
                          step="0.1"
                          value={multiplier}
                          onChange={(e) => setMultiplier(Number.parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-foreground mb-1 block">
                          Enthusiasm: {enthusiasm}/10
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={enthusiasm}
                          onChange={(e) => setEnthusiasm(Number.parseInt(e.target.value))}
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-foreground mb-1 block">
                          Formality: {formality}/10
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={formality}
                          onChange={(e) => setFormality(Number.parseInt(e.target.value))}
                          className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <h5 className="text-sm font-medium text-foreground">AI Tone Adjustment</h5>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant={selectedTone === "formal" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleRewriteTone("formal")}
                        disabled={isRewriting || sendStatus !== "idle"}
                        className="h-8"
                      >
                        {isRewriting && selectedTone === "formal" && <Loader className="h-3 w-3 mr-1 animate-spin" />}
                        Formal
                      </Button>
                      <Button
                        variant={selectedTone === "professional" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleRewriteTone("professional")}
                        disabled={isRewriting || sendStatus !== "idle"}
                        className="h-8"
                      >
                        {isRewriting && selectedTone === "professional" && (
                          <Loader className="h-3 w-3 mr-1 animate-spin" />
                        )}
                        Professional
                      </Button>
                      <Button
                        variant={selectedTone === "personal" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleRewriteTone("personal")}
                        disabled={isRewriting || sendStatus !== "idle"}
                        className="h-8"
                      >
                        {isRewriting && selectedTone === "personal" && <Loader className="h-3 w-3 mr-1 animate-spin" />}
                        Personal
                      </Button>
                      <Button
                        variant={selectedTone === "casual" ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleRewriteTone("casual")}
                        disabled={isRewriting || sendStatus !== "idle"}
                        className="h-8"
                      >
                        {isRewriting && selectedTone === "casual" && <Loader className="h-3 w-3 mr-1 animate-spin" />}
                        Casual
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Click a tone to rewrite your email using AI</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex-1 p-4 min-h-[300px] flex flex-col">
            <label className="text-sm font-medium text-foreground mb-2 block flex-shrink-0">Email Content</label>
            <div className="flex-1 min-h-[250px]">
              <Textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="w-full h-full text-sm leading-relaxed resize-none"
                readOnly={!isEditing || sendStatus !== "idle"}
                placeholder="Compose your bulk email message..."
              />
            </div>
          </div>

          <div className="flex justify-between items-center p-4 border-t border-border flex-shrink-0">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsEditing(!isEditing)} disabled={sendStatus !== "idle"}>
                <Edit className="h-4 w-4 mr-2" />
                {isEditing ? "Lock" : "Edit"}
              </Button>
              <Button onClick={handleSend} disabled={sendStatus !== "idle"} className="w-32">
                <AnimatePresence mode="wait">
                  {sendStatus === "idle" && (
                    <motion.span
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Send to {selectedDeals.length}
                    </motion.span>
                  )}
                  {sendStatus === "sending" && (
                    <motion.span
                      key="sending"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center"
                    >
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </motion.span>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "300px", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="border-l border-border bg-secondary/30 overflow-hidden flex flex-col"
            >
              <div className="p-4 border-b border-border flex-shrink-0">
                <h4 className="text-sm font-medium text-foreground">Email Preview</h4>
                <p className="text-xs text-muted-foreground">How emails will appear to recipients</p>
              </div>
              <div className="flex-1 min-h-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-4">
                    {selectedDeals.slice(0, 3).map((deal, index) => (
                      <div key={deal.id} className="bg-background rounded-lg border p-3">
                        <div className="text-xs text-muted-foreground mb-2">
                          To: info@{deal.name.toLowerCase().replace(/\s+/g, "")}.com
                        </div>
                        <div className="text-xs font-medium text-foreground mb-2">Subject: {emailSubject}</div>
                        <div className="text-xs text-muted-foreground leading-relaxed max-h-32 overflow-y-auto">
                          {getPersonalizedPreview(deal).substring(0, 200)}...
                        </div>
                      </div>
                    ))}
                    {selectedDeals.length > 3 && (
                      <div className="text-center text-xs text-muted-foreground">
                        +{selectedDeals.length - 3} more emails
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
