"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Mail, X, Edit, Send, Loader } from "lucide-react"
import { useDealDispatch } from "@/lib/deal-context"
import { useInboxDispatch } from "@/lib/inbox-context"

const viewMotionVariants = {
  initial: { opacity: 0, y: 20 },
  enter: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
}

export const EmailDraftView = ({ config }: { config?: { task: any; requiredInput: string } }) => {
  const dispatch = useDealDispatch()!
  const [emailBody, setEmailBody] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "sent">("idle")

  useEffect(() => {
    if (config) {
      setEmailBody(
        "Hi [Client Name],\n\nHope you're well.\n\nFollowing up on our diligence process, could you please provide us with the " +
          config.requiredInput +
          "? This will help us complete our analysis.\n\nLet me know if you have any questions.\n\nBest,\n[Your Name]",
      )
      setIsEditing(false) // Start in read-only mode
    }
  }, [config])

  if (!config) {
    return (
      <div className="w-full flex flex-col h-full items-center justify-center">
        <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const handleSend = async () => {
    setSendStatus("sending")
    await new Promise((resolve) => setTimeout(resolve, 1500))
    dispatch({ type: "EMAIL_SENT", payload: { taskId: config.task.id, requiredInput: config.requiredInput } })
  }

  return (
    <motion.div
      key="email-draft"
      variants={viewMotionVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className="w-full flex flex-col h-full"
    >
      <div className="flex items-center justify-between p-2 pr-3 border-b border-border flex-shrink-0">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2 pl-2">
          <Mail className="h-4 w-4" />
          Request Data from Client
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="w-7 h-7 rounded-full"
          onClick={() => dispatch({ type: "DISMISS_EMAIL_DRAFT" })}
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>
      <div className="p-4 flex-1 flex flex-col bg-secondary/30">
        <div className="bg-background rounded-lg border flex-1 flex flex-col shadow-sm">
          <div className="p-3 border-b">
            <div className="text-sm text-muted-foreground">
              <span className="text-gray-400">To: </span>client@example.com
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              <span className="text-gray-400">From: </span>you@yourfirm.com
            </div>
            <div className="text-sm font-medium text-foreground mt-2">
              <span className="text-gray-400 font-normal">Subject: </span>Request for Information:{" "}
              {config.requiredInput}
            </div>
          </div>
          <div className="p-1 flex-1">
            <Textarea
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              className="w-full text-sm leading-relaxed resize-none focus-visible:ring-0 h-full bg-transparent border-0 p-3"
              readOnly={!isEditing || sendStatus !== "idle"}
            />
          </div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <Button variant="ghost" onClick={() => dispatch({ type: "DISMISS_EMAIL_DRAFT" })}>
            Dismiss
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsEditing(!isEditing)} disabled={sendStatus !== "idle"}>
              <Edit className="h-4 w-4 mr-2" />
              {isEditing ? "Lock" : "Edit"}
            </Button>
            <Button onClick={handleSend} disabled={sendStatus !== "idle"} className="w-28">
              <AnimatePresence mode="wait">
                {sendStatus === "idle" && (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center"
                  >
                    <Send className="h-4 w-4 mr-2" /> Send
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
                    <Loader className="h-4 w-4 mr-2 animate-spin" /> Sending...
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export const OutreachEmailView = ({
  deal,
  onClose,
  onSent,
}: {
  deal: any
  onClose: () => void
  onSent: (deal: any) => void
}) => {
  const inboxDispatch = useInboxDispatch()
  const [emailBody, setEmailBody] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "sent">("idle")
  const [multiplier, setMultiplier] = useState(8.5)
  const [enthusiasm, setEnthusiasm] = useState(7)
  const [formality, setFormality] = useState(5)

  useEffect(() => {
    const generateEmailBody = () => {
      const enthusiasmLevel = enthusiasm > 7 ? "very excited" : enthusiasm > 4 ? "interested" : "considering"
      const formalityTone = formality > 7 ? "formal" : formality > 4 ? "professional" : "casual"
      const multiplierText =
        multiplier > 10 ? "premium valuation" : multiplier > 7 ? "competitive valuation" : "attractive valuation"

      return `Dear ${deal.name} Team,

I hope this message finds you well. I'm reaching out from our investment firm regarding a potential partnership opportunity.

We've been following your company's impressive growth trajectory and are ${enthusiasmLevel} about the possibility of working together. Your ${deal.industry} expertise and strong market position align perfectly with our investment thesis.

Based on our preliminary analysis, we believe ${deal.name} represents an excellent investment opportunity. We're prepared to discuss a ${multiplierText} at approximately ${multiplier}x EBITDA multiple, reflecting our confidence in your business model and growth potential.

Our firm specializes in partnering with companies like yours to accelerate growth while preserving the entrepreneurial culture that made you successful. We'd welcome the opportunity to discuss how we can support your continued expansion.

Would you be available for a brief call next week to explore this opportunity further?

Best regards,
[Your Name]
[Your Firm]`
    }

    setEmailBody(generateEmailBody())
  }, [deal, multiplier, enthusiasm, formality])

  const handleSend = async () => {
    setSendStatus("sending")
    await new Promise((resolve) => setTimeout(resolve, 2000))

    inboxDispatch({
      type: "ADD_OUTREACH_THREAD",
      payload: {
        deal,
        outreachContent: emailBody,
      },
    })

    onSent(deal)
  }

  return (
    <motion.div
      key="outreach-email"
      variants={viewMotionVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className="w-full flex flex-col h-full"
    >
      <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Reach out to {deal.name}
        </h3>
        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={onClose}>
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Email Content */}
        <div className="flex-1 p-4 bg-secondary/30">
          <div className="bg-background rounded-lg border flex-1 flex flex-col shadow-sm">
            <div className="p-3 border-b">
              <div className="text-sm text-muted-foreground">
                <span className="text-gray-400">To: </span>info@{deal.name.toLowerCase().replace(/\s+/g, "")}.com
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                <span className="text-gray-400">From: </span>you@yourfirm.com
              </div>
              <div className="text-sm font-medium text-foreground mt-2">
                <span className="text-gray-400 font-normal">Subject: </span>Investment Partnership Opportunity -{" "}
                {deal.name}
              </div>
            </div>
            <div className="p-1 flex-1">
              <Textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="w-full text-sm leading-relaxed resize-none focus-visible:ring-0 h-full bg-transparent border-0 p-3"
                readOnly={!isEditing || sendStatus !== "idle"}
              />
            </div>
          </div>
        </div>

        {/* Email Customization Controls - show when editing */}
        {isEditing && (
          <div className="mt-4">
            <div className="bg-background rounded-lg border p-4 shadow-sm">
              <h5 className="text-sm font-medium text-foreground mb-3">Email Settings</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Multiple: {multiplier}x</label>
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
                  <label className="text-xs font-medium text-foreground mb-1 block">Enthusiasm: {enthusiasm}/10</label>
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
                  <label className="text-xs font-medium text-foreground mb-1 block">Formality: {formality}/10</label>
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
          </div>
        )}

        <div className="flex justify-between items-center p-4">
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setIsEditing(!isEditing)} disabled={sendStatus !== "idle"}>
              <Edit className="h-4 w-4 mr-2" />
              {isEditing ? "Lock" : "Edit"}
            </Button>
            <Button onClick={handleSend} disabled={sendStatus !== "idle"} className="w-28">
              <AnimatePresence mode="wait">
                {sendStatus === "idle" && (
                  <motion.span
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center"
                  >
                    <Send className="h-4 w-4 mr-2" /> Send
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
                    <Loader className="h-4 w-4 mr-2 animate-spin" /> Sending...
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
