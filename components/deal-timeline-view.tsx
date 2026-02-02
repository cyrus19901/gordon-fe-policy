"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  X,
  Mail,
  FileTextIcon,
  Edit,
  Handshake,
  Building2,
  CheckCircle,
  Plus,
  Send,
  Loader,
  Sparkles,
} from "lucide-react"

const viewMotionVariants = {
  initial: { opacity: 0, y: 20 },
  enter: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, y: -20, transition: { duration: 0.2, ease: "easeIn" } },
}

export const PendingDealTimelineView = ({
  deal,
  onClose,
  onShowSigningFlow,
  onDealCreated,
  setIsNewDealOpen,
  setNewDealAnimationTarget,
}: {
  deal: any
  onClose: () => void
  onShowSigningFlow?: (show: boolean) => void
  onDealCreated?: (dealData: { name: string; type: "buy" | "sell"; startAtDataRoom?: boolean }) => void
  setIsNewDealOpen: (open: boolean) => void
  setNewDealAnimationTarget: (target: string) => void
}) => {
  const [currentStep, setCurrentStep] = useState(1) // Changed from 0 to 1 to match step IDs
  const [showEmailView, setShowEmailView] = useState(false)
  const [signingStep, setSigningStep] = useState<"review" | "sign" | "complete">("review")
  const [showSigningFlow, setShowSigningFlow] = useState(false)
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [showResponseView, setShowResponseView] = useState(false)
  const [showEmailThread, setShowEmailThread] = useState(false)

  const timelineGroups = [
    {
      title: "Inbox",
      steps: [
        {
          id: 1,
          title: "Email Thread",
          status: currentStep > 2 ? "completed" : currentStep === 1 ? "current" : "pending",
          description:
            currentStep === 1
              ? "Initial outreach sent"
              : currentStep === 2
                ? "Awaiting company response"
                : "Company responded with interest",
          subtitle:
            currentStep === 1
              ? "Just sent • No response yet"
              : currentStep === 2
                ? "3 days ago • No response yet"
                : "Received 2 days ago • Ready for next steps",
          hasAction: true,
          actionText: "View Thread",
          icon: Mail,
          nextStepMessage:
            currentStep === 1
              ? "Company typically responds within 3-5 business days. Monitor for initial response."
              : currentStep === 2
                ? "No response received. A polite follow-up email may help move the conversation forward."
                : "Company has expressed interest. You can continue the conversation or proceed with NDA execution.",
          showFollowUp: currentStep === 2,
          showMoveToDocuments: currentStep > 2,
          threadSummary:
            currentStep > 2
              ? "Company expressed strong interest in partnership. Ready to discuss terms and execute NDA."
              : null,
          isInboxItem: true,
        },
      ],
    },
    {
      title: "Documents",
      steps: [
        {
          id: 3,
          title: "NDA Signed",
          status: currentStep > 3 ? "completed" : currentStep === 3 ? "current" : "pending",
          description: "Execute mutual NDA",
          hasAction: true,
          actionText: "Sign Documents",
          icon: FileTextIcon,
          nextStepMessage: "Begin LOI term negotiations once NDA is fully executed.",
        },
        {
          id: 4,
          title: "LOI Negotiation",
          status: currentStep > 4 ? "completed" : currentStep === 4 ? "current" : "pending",
          description: "Negotiate letter of intent terms",
          icon: Edit,
          nextStepMessage: "Finalize and execute binding LOI with agreed terms.",
        },
        {
          id: 5,
          title: "LOI Signed",
          status: currentStep > 5 ? "completed" : currentStep === 5 ? "current" : "pending",
          description: "Execute binding LOI",
          icon: Handshake,
          nextStepMessage: "Begin comprehensive due diligence process.",
        },
        {
          id: 6,
          title: "Due Diligence",
          status: currentStep > 6 ? "completed" : currentStep === 6 ? "current" : "pending",
          description: "Begin full diligence process",
          icon: Building2,
          nextStepMessage: "Complete final negotiations and close transaction.",
        },
      ],
    },
  ]

  const getStepIcon = (step: any) => {
    if (step.status === "completed") {
      return (
        <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
          <CheckCircle className="h-4 w-4 text-white" />
        </div>
      )
    }
    if (step.status === "current") {
      return (
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center animate-pulse">
          <step.icon className="h-4 w-4 text-white" />
        </div>
      )
    }
    return (
      <div className="w-8 h-8 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
        <step.icon className="h-4 w-4 text-gray-400" />
      </div>
    )
  }

  const handleStepAction = (step: any) => {
    if (step.id === 1 || step.id === 2) {
      setShowEmailThread(true)
    } else if (step.id === 3) {
      setShowSigningFlow(true)
      onShowSigningFlow?.(true)
    }
  }

  // Add new function for Move to Documents
  const handleMoveToDocuments = () => {
    setCurrentStep(3)
  }

  const handleFollowUp = () => {
    // Insert a follow-up step before the current step
    const followUpStep = {
      id: currentStep + 0.5, // Use decimal to insert between steps
      title: "Follow-up Email",
      status: "current",
      description: "Follow-up email sent",
      subtitle: "Just sent • Awaiting response",
      hasAction: true,
      actionText: "View Thread",
      icon: Mail,
      nextStepMessage: "Monitor for response to follow-up email.",
      isFollowUp: true,
    }

    // Add the follow-up step and advance current step
    setCurrentStep(currentStep + 0.5)
    setShowEmailThread(true)
  }

  const handleSimulateProgress = () => {
    if (currentStep < timelineGroups.flatMap((group) => group.steps).length) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  // ... existing code for all the sub-components (EmailThreadView, etc.) ...

  const mockEmail = `Subject: Investment Partnership Opportunity - ${deal.name}

Dear ${deal.name} Team,

I hope this message finds you well. I'm reaching out from our investment firm regarding a potential partnership opportunity.

We've been following your company's impressive growth trajectory and are very excited about the possibility of working together. Your ${deal.industry} expertise and strong market position align perfectly with our investment thesis.

Based on our preliminary analysis, we believe ${deal.name} represents an excellent investment opportunity. We're prepared to discuss a competitive valuation at approximately 8.5x EBITDA multiple, reflecting our confidence in your business model and growth potential.

Our firm specializes in partnering with companies like yours to accelerate growth while preserving the entrepreneurial culture that made you successful. We'd welcome the opportunity to discuss how we can support your continued expansion.

Would you be available for a brief call next week to explore this opportunity further?

Best regards,
Eduardo Martinez
Senior Partner
Gordon Capital Partners`

  const followUpEmail = `Subject: Follow-up: Investment Partnership Opportunity - ${deal.name}

Dear ${deal.name} Team,

I wanted to follow up on my previous email regarding a investment partnership opportunity.

I understand you may be evaluating multiple options, and I wanted to reiterate our strong interest in partnering with ${deal.name}. Our firm has a proven track record of supporting companies in the ${deal.industry} sector, and we believe we can add significant value beyond capital.

Key points about our partnership approach:
• Flexible deal structures tailored to your needs
• Operational expertise and strategic guidance
• Extensive network of industry contacts and potential customers
• Commitment to preserving company culture and management autonomy

Would you be available for a brief 15-minute call this week to discuss how we might be able to support your growth objectives?

I'm happy to work around your schedule and can be reached directly at this email or by phone.

Best regards,
Eduardo Martinez
Senior Partner
Gordon Capital Partners
Direct: (555) 123-4567`

  const EmailThreadView = () => {
    const [replyText, setReplyText] = useState("")
    const [isSending, setIsSending] = useState(false)
    const [isGenerating, setIsGenerating] = useState(false)

    const emailThread = [
      {
        id: 1,
        from: "eduardo@gordoncapital.com",
        to: `info@${deal.name.toLowerCase().replace(/\s+/g, "")}.com`,
        subject: `Investment Partnership Opportunity - ${deal.name}`,
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        time: "2:30 PM",
        content: `Dear ${deal.name} Team,

I hope this message finds you well. I'm reaching out from our investment firm regarding a potential partnership opportunity.

We've been following your company's impressive growth trajectory and are very excited about the possibility of working together. Your ${deal.industry} expertise and strong market position align perfectly with our investment thesis.

Based on our preliminary analysis, we believe ${deal.name} represents an excellent investment opportunity. We're prepared to discuss a competitive valuation at approximately 8.5x EBITDA multiple, reflecting our confidence in your business model and growth potential.

Our firm specializes in partnering with companies like yours to accelerate growth while preserving the entrepreneurial culture that made you successful. We'd welcome the opportunity to discuss how we can support your continued expansion.

Would you be available for a brief call next week to explore this opportunity further?

Best regards,
Eduardo Martinez
Senior Partner
Gordon Capital Partners`,
        type: "sent",
      },
    ]

    // Add response if we're past step 2
    if (currentStep > 2) {
      emailThread.push({
        id: 2,
        from: `info@${deal.name.toLowerCase().replace(/\s+/g, "")}.com`,
        to: "eduardo@gordoncapital.com",
        subject: `Re: Investment Partnership Opportunity - ${deal.name}`,
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        time: "10:15 AM",
        content: `Dear Eduardo,

Thank you for reaching out regarding a potential investment partnership with ${deal.name}. We appreciate your interest in our company and the time you've taken to research our business.

We are indeed exploring strategic partnership opportunities as we look to accelerate our growth in the renewable energy software market. Your firm's focus on technology companies and track record in our sector is impressive and aligns well with our expansion goals.

We would be interested in learning more about:
• Your investment approach and typical partnership structure
• How you support portfolio companies operationally
• Your experience with companies in the renewable energy technology space
• Timeline and next steps for the evaluation process

We are available for an initial call next week to discuss this opportunity further. Please let us know what works best for your schedule.

We look forward to hearing from you.

Best regards,
Sarah Chen
CEO, ${deal.name}
Direct: (555) 987-6543
sarah@${deal.name.toLowerCase().replace(/\s+/g, "")}.com`,
        type: "received",
      })
    }

    const handleGenerateWithAI = async () => {
      setIsGenerating(true)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const lastEmail = emailThread[emailThread.length - 1]
      let generatedReply = ""

      if (lastEmail.type === "received") {
        generatedReply = `Dear Sarah,

Thank you for your prompt response and interest in exploring a partnership with Gordon Capital Partners.

I'm pleased to address your questions:

• Investment Approach: We typically structure partnerships as minority investments with board representation, allowing management teams to retain operational control while benefiting from our strategic guidance and network.

• Operational Support: Our team provides hands-on support in areas including business development, talent acquisition, technology infrastructure scaling, and market expansion strategies.

• Renewable Energy Experience: We have successfully partnered with three companies in the renewable energy technology space over the past five years, with an average revenue growth of 180% post-investment.

• Timeline: Our typical process involves an initial call (30 minutes), followed by a management presentation (1-2 hours), preliminary due diligence (2-3 weeks), and final documentation (2-4 weeks).

I would be happy to schedule a call at your convenience. I'm available Tuesday through Thursday next week, either morning or afternoon. Please let me know what works best for your schedule.

Looking forward to our conversation.

Best regards,
Eduardo Martinez
Senior Partner
Gordon Capital Partners
Direct: (555) 123-4567`
      } else {
        generatedReply = `Dear ${deal.name} Team,

I wanted to follow up on my previous email regarding our investment partnership opportunity.

I understand you may be evaluating multiple options, and I wanted to reiterate our strong interest in partnering with ${deal.name}. Our firm has a proven track record of supporting companies in your sector.

Would you be available for a brief call this week to discuss how we might support your growth objectives?

Best regards,
Eduardo Martinez`
      }

      setReplyText(generatedReply)
      setIsGenerating(false)
    }

    const handleSendReply = async () => {
      if (!replyText.trim()) return

      setIsSending(true)
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Here you would add the reply to the thread
      // For now, we'll just clear the input and show success
      setReplyText("")
      setIsSending(false)

      // If this was step 2, advance to step 3
      if (currentStep === 2) {
        setCurrentStep(3)
      }
    }

    return (
      <motion.div
        key="email-thread"
        variants={viewMotionVariants}
        initial="initial"
        animate="enter"
        exit="exit"
        className="w-full flex flex-col h-full bg-background"
      >
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 flex-shrink-0"
              onClick={() => setShowEmailThread(false)}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <h3 className="text-base lg:text-lg font-semibold text-foreground truncate">Email Thread</h3>
              <p className="text-sm text-muted-foreground truncate">
                {deal.name} • {emailThread.length} messages
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 rounded-full flex-shrink-0"
            onClick={() => {
              onClose()
              onShowSigningFlow?.(false)
            }}
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {emailThread.map((email, index) => (
            <div
              key={email.id}
              className={`rounded-lg border ${
                email.type === "sent" ? "bg-blue-50 border-blue-200 ml-8" : "bg-gray-50 border-gray-200 mr-8"
              }`}
            >
              <div className="p-3 border-b border-current/20">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${email.type === "sent" ? "bg-blue-500" : "bg-green-500"}`} />
                    <span className="text-sm font-medium">{email.type === "sent" ? "You" : "Sarah Chen"}</span>
                    <span className="text-xs text-muted-foreground">
                      {email.type === "sent" ? "to" : "from"} {email.type === "sent" ? email.to : email.from}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {email.date} • {email.time}
                  </span>
                </div>
                <p className="text-sm font-medium text-foreground">{email.subject}</p>
              </div>
              <div className="p-3">
                <pre className="text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground">
                  {email.content}
                </pre>
              </div>
            </div>
          ))}
        </div>

        {/* Reply Section */}
        <div className="border-t bg-background p-4 flex-shrink-0">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>Reply to thread</span>
            </div>
            <textarea
              placeholder="Type your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full h-24 p-3 border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-1 mr-1" />
                  Attach
                </Button>
                <Button variant="outline" size="sm">
                  Schedule
                </Button>
                <Button variant="outline" size="sm" onClick={handleGenerateWithAI} disabled={isGenerating}>
                  {isGenerating ? (
                    <Loader className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-1" />
                  )}
                  Generate with AI
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => setShowEmailThread(false)}>
                  Close
                </Button>
                <Button onClick={handleSendReply} disabled={!replyText.trim() || isSending} className="min-w-[80px]">
                  {isSending ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-1" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    )
  }

  // ... existing code for all other sub-views (ResponseView, FollowUpView, SigningFlow, EmailView) ...

  if (showResponseView) {
    return (
      <motion.div
        key="response-view"
        variants={viewMotionVariants}
        initial="initial"
        animate="enter"
        exit="exit"
        className="w-full flex flex-col h-full bg-background"
      >
        {/* ... existing response view code ... */}
      </motion.div>
    )
  }

  if (showFollowUp) {
    return (
      <motion.div
        key="follow-up-email"
        variants={viewMotionVariants}
        initial="initial"
        animate="enter"
        exit="exit"
        className="w-full flex flex-col h-full bg-background"
      >
        {/* ... existing follow up view code ... */}
      </motion.div>
    )
  }

  if (showSigningFlow) {
    return (
      <motion.div
        key="signing-flow"
        variants={viewMotionVariants}
        initial="initial"
        animate="enter"
        exit="exit"
        className="w-full flex flex-col h-full bg-background"
      >
        {/* ... existing signing flow code ... */}
      </motion.div>
    )
  }

  if (showEmailView) {
    return (
      <motion.div
        key="email-view"
        variants={viewMotionVariants}
        initial="initial"
        animate="enter"
        exit="exit"
        className="w-full flex flex-col h-full bg-background"
      >
        {/* ... existing email view code ... */}
      </motion.div>
    )
  }

  if (showEmailThread) {
    return <EmailThreadView />
  }

  return (
    <motion.div
      key="pending-timeline"
      variants={viewMotionVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className="w-full flex flex-col h-full bg-background"
    >
      <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="h-4 w-4 lg:h-5 lg:w-5 text-yellow-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base lg:text-lg font-semibold text-foreground truncate">{deal.name}</h3>
            <p className="text-sm text-muted-foreground truncate">Pending LOI • Deal Timeline</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="w-8 h-8 rounded-full flex-shrink-0"
          onClick={() => {
            onClose()
            onShowSigningFlow?.(false)
          }}
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-8">
            {timelineGroups.map((group, groupIndex) => (
              <div
                key={group.title}
                className={cn(group.title === "Inbox" && "p-4 bg-slate-50/50 rounded-lg border border-slate-200/50")}
              >
                <h4
                  className={cn(
                    "text-sm font-semibold mb-4 uppercase tracking-wide",
                    group.title === "Documents" && currentStep < 3
                      ? "text-muted-foreground/50"
                      : "text-muted-foreground",
                  )}
                >
                  {group.title}
                </h4>
                <div className="relative">
                  {group.steps.map((step, stepIndex) => (
                    <div
                      key={step.id}
                      className={cn(
                        "relative pb-6 lg:pb-8 last:pb-0",
                        group.title === "Documents" && currentStep < 3 ? "opacity-40" : "opacity-100",
                      )}
                    >
                      {/* Dotted line connector within group */}
                      {stepIndex < group.steps.length - 1 && (
                        <div className="absolute left-4 top-8 w-0.5 h-6 lg:h-8 border-l-2 border-dashed border-gray-300" />
                      )}

                      {/* Group connector line */}
                      {groupIndex < timelineGroups.length - 1 && stepIndex === group.steps.length - 1 && (
                        <div className="absolute left-4 top-8 w-0.5 h-12 lg:h-16 border-l-2 border-dashed border-gray-200" />
                      )}

                      {/* Render inbox items with consistent styling */}
                      {step.isInboxItem ? (
                        <div className="relative flex items-start">
                          {/* Step icon */}
                          <div className="relative z-10 flex-shrink-0">{getStepIcon(step)}</div>

                          {/* Step content */}
                          <div className="ml-4 flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h5 className="font-semibold text-foreground text-sm">{step.title}</h5>
                                <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                                {step.subtitle && (
                                  <p className="text-sm text-blue-600 mt-1 font-medium">{step.subtitle}</p>
                                )}
                                {step.threadSummary && (
                                  <div className="mt-2 p-2 bg-green-50 rounded-md border border-green-200">
                                    <p className="text-xs text-green-700 font-medium">Thread Summary:</p>
                                    <p className="text-xs text-green-600 mt-0.5">{step.threadSummary}</p>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {step.status === "current" && step.id === 1 && (
                                  <Badge
                                    variant="secondary"
                                    className={cn(
                                      "text-xs",
                                      currentStep === 1
                                        ? "bg-blue-50 text-blue-700"
                                        : currentStep === 2
                                          ? "bg-yellow-50 text-yellow-700"
                                          : "bg-green-50 text-green-700",
                                    )}
                                  >
                                    {currentStep === 1 ? "Sent" : currentStep === 2 ? "Waiting" : "Responded"}
                                  </Badge>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-6 bg-transparent"
                                  onClick={() => handleStepAction(step)}
                                >
                                  {step.actionText}
                                </Button>
                              </div>
                            </div>

                            {/* Action buttons for inbox items */}
                            <div className="flex items-center gap-2 mt-3">
                              {step.showFollowUp && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-xs h-6 bg-transparent"
                                  onClick={handleFollowUp}
                                >
                                  Follow Up
                                </Button>
                              )}
                              {step.showMoveToDocuments && currentStep < 3 && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  className="text-xs h-6 bg-green-600 text-white hover:bg-green-700"
                                  onClick={handleMoveToDocuments}
                                >
                                  Unlock Documents
                                </Button>
                              )}
                            </div>

                            {/* Next Steps message for inbox items */}
                            {step.status === "current" && (
                              <div className="mt-3">
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <p className="text-xs text-blue-700">
                                    <span className="font-medium">Next:</span> {step.nextStepMessage}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Regular timeline items for documents */
                        <div className="relative flex items-start">
                          {/* Step icon */}
                          <div className="relative z-10 flex-shrink-0">{getStepIcon(step)}</div>

                          {/* Step content */}
                          <div className="ml-4 flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h5 className="font-semibold text-foreground text-sm">{step.title}</h5>
                                <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {step.status === "current" && step.id !== 1 && (
                                  <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs">
                                    In Progress
                                  </Badge>
                                )}
                                {step.hasAction && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-6 bg-transparent"
                                    onClick={() => handleStepAction(step)}
                                  >
                                    {step.id === 3 && currentStep > 3 ? "3 Documents Signed" : step.actionText}
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Next Steps message for current document steps */}
                            {step.status === "current" && (
                              <div className="mt-3">
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <p className="text-xs text-blue-700">
                                    <span className="font-medium">Next:</span> {step.nextStepMessage}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 border-t bg-background flex-shrink-0 gap-3 sm:gap-2">
        <Button
          variant="ghost"
          onClick={() => {
            onClose()
            onShowSigningFlow?.(false)
          }}
          className="order-2 sm:order-1"
        >
          Close
        </Button>
        <div className="flex items-center gap-2 order-1 sm:order-2">
          <Button variant="outline" size="sm" onClick={handleFollowUp} className="flex-1 sm:flex-none bg-transparent">
            Follow Up
          </Button>
          {currentStep >= timelineGroups.flatMap((group) => group.steps).length ? (
            <Button
              size="sm"
              className="bg-green-600 text-white hover:bg-green-700"
              onClick={() => {
                // Don't close the timeline - let user go back to it
                setIsNewDealOpen(true)
                setNewDealAnimationTarget("new_deal_data_room")
              }}
            >
              Start Diligence
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSimulateProgress}
              disabled={currentStep >= timelineGroups.flatMap((group) => group.steps).length}
            >
              Simulate Progress
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
