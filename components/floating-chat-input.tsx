"use client"

import React from "react"

import { useState, useRef, useEffect, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  X,
  Briefcase,
  Handshake,
  Building2,
  MapPin,
  Users,
  Plus,
  CheckCircle,
  Search,
  Loader,
  UploadCloud,
  FileTextIcon,
  Folder,
  CalendarIcon,
  SendIcon,
  Zap,
  Home,
  Settings,
  Compass,
  BookOpen,
  TrendingUp,
  Sparkles,
  Mail,
  Bookmark,
  Globe,
  Linkedin,
} from "lucide-react"
import { cn } from "@/lib/utils"

// import type React from "react" // Removed because React is implicitly available in client components

import { PlusIcon } from "./icons/plus-icon"
import { FilterIcon } from "./icons/filter-icon"
import { MicIcon } from "./icons/mic-icon"
import { SplitViewIcon } from "./icons/split-view-icon"
import { useDealState, useDealDispatch } from "@/lib/deal-context"
import type { ChatMessage } from "./bar-chat-view"
import { DynamicDealMockup } from "./dynamic-deal-mockup"
import { usePathname } from "next/navigation"
import { SearchFilterView } from "./search-filter-view"
import { OutreachEmailView } from "./email-views"
import { PendingDealTimelineView } from "./deal-timeline-view"
import { MorphingNavigationBar } from "./morphing-navigation-bar"
import {
  CLOSED_BAR_HEIGHT,
  INPUT_AREA_HEIGHT,
  MOBILE_CLOSED_BAR_HEIGHT,
  MOBILE_INPUT_AREA_HEIGHT,
  desktopBarVariants,
  mobileBarVariants,
  barTransition,
  viewMotionVariants,
  fadeVariants,
  iconSwitchVariants,
  promptSuggestions,
  dataRoomProviders,
  mockDataFiles,
} from "./floating-chat-constants"

import { useBulkActions } from "@/lib/bulk-actions-context"
import { BulkEmailComposer } from "./bulk-email-composer"
import { BulkLinkedInComposer } from "./bulk-linkedin-composer"
import { BulkCampaignComposer } from "./bulk-campaign-composer" // Imported BulkCampaignComposer
import { useSavedDeals } from "@/lib/saved-deals-context"
import { toast } from "sonner"
import { CampaignWorkflowFlowchart } from "./campaign-workflow-flowchart" // Imported CampaignWorkflowFlowchart

// Define the type for onBookmarkDeal prop
type onBookmarkDeal = (deal: any) => void

const navigationItems = [
  { icon: Home, href: "/dashboard", label: "Dashboard" },
  { icon: Compass, href: "/analysis", label: "Analysis" },
  { icon: CalendarIcon, href: "/calendar", label: "Calendar" },
  { icon: BookOpen, href: "/portfolio", label: "Portfolio" },
  { icon: TrendingUp, href: "/graphs", label: "Graphs" },
  { icon: Building2, href: "/finder", label: "Finder" },
  { icon: Settings, href: "/settings", label: "Settings" },
]

const MarketDealView = ({
  deal,
  onClose,
  onReachOut,
  onBookmarkDeal, // Added onBookmarkDeal prop
  onAddToCampaign,
  onSearchSimilar,
  onAddToCampaignFromModal, // Added onAddToCampaignFromModal prop
  onSearchSimilarFromModal, // Added onSearchSimilarFromModal prop
  // </CHANGE>
}: {
  deal: any
  onClose: () => void
  onReachOut: (deal: any) => void
  onBookmarkDeal?: (deal: any) => void // Added onBookmarkDeal prop type
  onAddToCampaign?: (company: any) => void // Added onAddToCampaign prop type
  onSearchSimilar?: (company: any) => void // Added onSearchSimilar prop type
  onAddToCampaignFromModal?: (company: any) => void // Added onAddToCampaignFromModal prop type
  onSearchSimilarFromModal?: (company: any) => void // Added onSearchSimilarFromModal prop type
  // </CHANGE>
}) => {
  const [isReaching, setIsReaching] = useState(false)
  const { state: savedDealsState, dispatch: savedDealsDispatch } = useSavedDeals()
  const [showListSelector, setShowListSelector] = useState(false)

  const handleScrollCapture = (e: React.UIEvent) => {
    e.stopPropagation()
  }

  const handleWheelCapture = (e: React.WheelEvent) => {
    e.stopPropagation()
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation()
  }

  const handleReachOut = async () => {
    setIsReaching(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    onReachOut(deal)
  }

  const handleAddToWatchlist = () => {
    console.log("[v0] MarketDealView handleAddToWatchlist called")
    if (onBookmarkDeal) {
      console.log("[v0] Calling onBookmarkDeal from MarketDealView")
      onBookmarkDeal(deal)
      onClose() // Close the market deal view
    } else {
      // Fallback to old behavior if onBookmarkDeal is not provided
      savedDealsDispatch({
        type: "SAVE_DEAL",
        payload: { deal },
      })
      // Show success feedback briefly
      setTimeout(() => {
        onClose()
      }, 800)
    }
  }

  const isAlreadySaved = savedDealsState.savedDeals.some((savedDeal) => savedDeal.name === deal.name)

  const summaryItems = [
    { icon: Building2, label: "Industry", value: deal.industry, isLink: false },
    { icon: MapPin, label: "Location", value: deal.location, isLink: false },
    { icon: Users, label: "Employees", value: deal.employees, isLink: false },
    { icon: CalendarIcon, label: "Founded", value: deal.founded, isLink: false },
  ]

  return (
    <motion.div
      key="market-deal"
      variants={viewMotionVariants}
      initial="initial"
      animate="enter"
      exit="exit"
      className="w-full flex flex-col bg-background rounded-2xl overflow-hidden"
      onScrollCapture={handleScrollCapture}
      onWheelCapture={handleWheelCapture}
      onTouchMoveCapture={handleTouchMove}
    >
      <div className="flex items-center justify-between p-5 border-b border-border/50 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">{deal.name}</h3>
            <p className="text-xs text-muted-foreground">
              {deal.industry} • {deal.location}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <a
                href={`https://${deal.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Globe className="h-3 w-3" />
                <span>Website</span>
              </a>
              <a
                href={deal.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Linkedin className="h-3 w-3" />
                <span>LinkedIn</span>
              </a>
            </div>
            {/* </CHANGE> */}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="w-7 h-7 rounded-full" onClick={onClose}>
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </div>

      <div
        className="flex-1 overflow-y-auto p-5 space-y-4 overscroll-contain max-h-[550px]"
        style={{ touchAction: "pan-y" }}
        data-scroll-container="market-deal"
        onScrollCapture={handleScrollCapture}
        onWheelCapture={handleWheelCapture}
        onTouchMoveCapture={handleTouchMove}
      >
        <div className="rounded-lg border border-border/50 overflow-hidden">
          <div className="grid divide-x divide-border/50 grid-cols-2">
            <div className="p-3">
              <p className="text-xs text-muted-foreground mb-1">Revenue</p>
              <div className="flex items-baseline gap-1.5">
                <p className="text-foreground text-lg font-semibold">{deal.revenue}</p>
                <p className="text-xs font-medium text-green-600">{deal.keyMetrics.growth}</p>
              </div>
            </div>
            <div className="p-3">
              <p className="text-xs text-muted-foreground mb-1">Employee Count</p>
              <p className="text-foreground text-lg font-semibold">{deal.employees}</p>
            </div>
          </div>
          {/* </CHANGE> */}
        </div>

        <div className="rounded-lg border border-border/50 p-4 space-y-3">
          <h4 className="font-medium text-foreground text-sm">Company Overview</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{deal.description}</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {summaryItems.map((item) => (
              <div key={item.label} className="flex items-center gap-2.5">
                <div className="w-6 h-6 bg-secondary rounded-md flex items-center justify-center flex-shrink-0">
                  <item.icon className="h-3 w-3 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  {item.isLink ? (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline truncate block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-sm font-medium text-foreground">{item.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-border/50 p-4 space-y-3">
          <h4 className="font-medium text-foreground text-sm">Key Highlights</h4>
          <div className="grid grid-cols-1 gap-2.5">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Strong Revenue Growth</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Growing at {deal.keyMetrics.growth} with {deal.revenue} in annual revenue
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="h-4 w-4 text-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Established Team</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {deal.employees} employees driving growth in {deal.industry}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
              <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="h-4 w-4 text-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Strategic Location</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Based in {deal.location}, established since {deal.founded}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* </CHANGE> */}
      </div>

      <div className="flex items-center justify-between px-4 pt-4 pb-2 border-t border-border/50 bg-background">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            // Generate natural language query based on company attributes
            const revenueValue = deal.revenue
              ? typeof deal.revenue === "number"
                ? deal.revenue
                : Number.parseFloat(String(deal.revenue).replace(/[^0-9.]/g, ""))
              : null

            const employeesValue = deal.employees
              ? typeof deal.employees === "number"
                ? deal.employees
                : Number.parseInt(String(deal.employees).replace(/[^0-9]/g, ""))
              : null

            const foundedYear = deal.founded
              ? typeof deal.founded === "number"
                ? deal.founded
                : Number.parseInt(String(deal.founded))
              : null

            const queryParts = [`${deal.industry} companies`]

            if (revenueValue) {
              queryParts.push(`with revenue around $${revenueValue.toFixed(1)}M`)
            }

            if (employeesValue) {
              queryParts.push(`${employeesValue} employees`)
            }

            if (foundedYear) {
              queryParts.push(`founded around ${foundedYear}`)
            }

            if (deal.location) {
              queryParts.push(`in ${deal.location}`)
            }

            const searchQuery = queryParts.join(" ")

            // Trigger search with the generated query
            if (onSearchSimilar) {
              onSearchSimilar(searchQuery)
            }

            // Close the modal
            onClose()
            // </CHANGE>
          }}
          className="gap-2"
        >
          <Search className="h-4 w-4" />
          Search Similar deals
        </Button>

        <div className="flex items-center gap-2">
          {/* Add to Campaign button */}
          <Button
            onClick={() => {
              console.log("[v0] Add to Campaign button clicked in MarketDealView")
              // Close the modal and check the checkbox
              if (onAddToCampaignFromModal) {
                onAddToCampaignFromModal(deal)
              }
              onClose()
            }}
            variant="outline"
            className="text-sm"
            size="sm"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add to Campaign
          </Button>

          {/* Add to Watchlist button */}
          {isAlreadySaved ? (
            <Button variant="outline" size="sm" disabled className="text-sm bg-transparent">
              <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-green-500" />
              In Watchlist
            </Button>
          ) : (
            <Button
              onClick={() => {
                console.log("[v0] Add to Watchlist button clicked in MarketDealView")
                handleAddToWatchlist()
              }}
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm"
              size="sm"
            >
              <Bookmark className="h-3.5 w-3.5 mr-1.5" />
              Add to Watchlist
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

const NewDealTriggerView = ({ onOpen, isInFindDealsView }: { onOpen: () => void; isInFindDealsView?: boolean }) => (
  <motion.button
    key="new-deal-trigger"
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
    transition={{ type: "spring", stiffness: 300, damping: 30 }}
    className="w-full h-full flex items-center justify-between group px-3"
    onClick={onOpen}
  >
    <div className="flex items-center gap-3">
      <span className="text-muted-foreground text-sm mx-4">
        {isInFindDealsView ? "Search for deals..." : "Create a new deal..."}
      </span>
    </div>
    <div className="w-8 h-8 bg-secondary group-hover:bg-secondary/80 transition-colors text-muted-foreground rounded-full flex items-center justify-center flex-shrink-0">
      {isInFindDealsView ? <Search className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
    </div>
  </motion.button>
)

const NewDealView = ({
  onDealCreated,
  onClose,
  setAnimationTarget,
  prefilledName,
  startAtDataRoom = false,
}: {
  onDealCreated?: (dealData: { name: string; type: "buy" | "sell"; startAtDataRoom?: boolean }) => void
  onClose: () => void
  setAnimationTarget: (target: string) => void
  prefilledName?: string
  startAtDataRoom?: boolean
}) => {
  const [step, setStep] = useState<"type" | "details" | "data_room" | "upload">(startAtDataRoom ? "data_room" : "type")
  const [dealType, setDealType] = useState<"buy" | "sell" | null>(startAtDataRoom ? "buy" : null)
  const [dealName, setDealName] = useState(prefilledName || "")
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedFiles, setProcessedFiles] = useState<string[]>([])
  const nameInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (step === "upload") {
      setAnimationTarget("new_deal_upload")
    } else if (step === "data_room") {
      setAnimationTarget("new_deal_data_room")
    } else {
      setAnimationTarget("new_deal")
    }

    if (step === "details") {
      nameInputRef.current?.focus()
    }
  }, [step, setAnimationTarget])

  const handleTypeSelect = (type: "buy" | "sell") => {
    setDealType(type)
    setStep("details")
  }

  const handleNextStep = () => {
    if (dealName.trim()) {
      setStep("data_room")
    }
  }

  const handleNameInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleNextStep()
    }
  }

  const handleProviderSelect = async (providerId: string) => {
    setSelectedProvider(providerId)
    setIsConnecting(true)

    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsConnecting(false)
    setIsProcessing(true)

    for (let i = 0; i < mockDataFiles.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 300))
      setProcessedFiles((prev) => [...prev, mockDataFiles[i].name])
    }

    await new Promise((resolve) => setTimeout(resolve, 1000))
    setStep("upload")
  }

  const handleCreate = async () => {
    if (dealName.trim() && dealType) {
      setIsSubmitting(true)
      await new Promise((r) => setTimeout(r, 2500))
      onDealCreated?.({ name: dealName, type: dealType })
    }
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <motion.div
      key="new-deal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full flex flex-col h-full bg-background"
    >
      <AnimatePresence mode="wait">
        {step === "type" && (
          <motion.div
            key="type"
            variants={viewMotionVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            className="flex flex-col flex-grow p-8 justify-center"
          >
            <h3 className="text-base font-semibold text-foreground text-center">What kind of deal is this?</h3>
            <div className="flex gap-4 mt-6">
              <Button
                variant="outline"
                className="w-full h-24 flex-col gap-2 bg-transparent"
                onClick={() => handleTypeSelect("buy")}
              >
                <Briefcase className="h-6 w-6" />
                Buy-Side
              </Button>
              <Button
                variant="outline"
                className="w-full h-24 flex-col gap-2 bg-transparent"
                onClick={() => handleTypeSelect("sell")}
              >
                <Handshake className="h-6 w-6" />
                Sell-Side
              </Button>
            </div>
          </motion.div>
        )}

        {step === "details" && (
          <motion.div
            key="details"
            variants={viewMotionVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            className="flex flex-col flex-grow px-8 pb-6"
          >
            <div className="flex-grow flex flex-col justify-center">
              <h3 className="text-base font-semibold text-gray-800 truncate">{dealName}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-6">What should we call this deal analysis?</p>
              <Input
                ref={nameInputRef}
                id="deal-name"
                value={dealName}
                onChange={(e) => setDealName(e.target.value)}
                onKeyDown={handleNameInputKeyDown}
                placeholder="e.g., Project Phoenix Acquisition"
                className="h-10"
              />
            </div>
            <div className="flex justify-between items-center mt-auto">
              <Button variant="ghost" onClick={() => setStep("type")}>
                Back
              </Button>
              <Button disabled={!dealName.trim()} onClick={handleNextStep}>
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {step === "data_room" && (
          <motion.div
            key="data_room"
            variants={viewMotionVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            className="flex flex-col flex-grow overflow-hidden"
          >
            <div className="p-8 pb-4">
              <h3 className="text-base font-semibold text-gray-800 truncate">{dealName}</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-6">
                Connect to your data room to import documents automatically.
              </p>
            </div>
            <div className="flex-grow overflow-y-auto px-8">
              {!isConnecting && !isProcessing && (
                <div className="grid grid-cols-1 gap-3">
                  {dataRoomProviders.map((provider) => (
                    <Button
                      key={provider.id}
                      variant="outline"
                      className="h-16 justify-start gap-4 bg-transparent hover:bg-secondary/50"
                      onClick={() => handleProviderSelect(provider.id)}
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center text-white",
                          provider.color,
                        )}
                      >
                        <provider.icon className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{provider.name}</p>
                        <p className="text-sm text-muted-foreground">{provider.description}</p>
                      </div>
                    </Button>
                  ))}
                </div>
              )}

              {isConnecting && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-foreground font-medium">
                    {"Connecting to "}
                    {dataRoomProviders.find((p) => p.id === selectedProvider)?.name}
                    {"..."}
                  </p>
                  <p className="text-muted-foreground text-sm">Authenticating and scanning for documents</p>
                </div>
              )}

              {isProcessing && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-4">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <p className="font-medium">Connected successfully! Processing documents...</p>
                  </div>
                  {mockDataFiles.map((file) => (
                    <motion.div
                      key={file.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{
                        opacity: processedFiles.includes(file.name) ? 1 : 0.5,
                        x: 0,
                      }}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-background"
                    >
                      <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
                        {file.type === "folder" ? (
                          <Folder className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <FileTextIcon className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-grow">
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{file.size}</p>
                      </div>
                      {processedFiles.includes(file.name) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center"
                        >
                          <CheckCircle className="h-3 w-3 text-white" />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center p-4 mt-auto border-t bg-background flex-shrink-0">
              <Button variant="ghost" onClick={() => setStep("data_room")} disabled={isConnecting || isProcessing}>
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setStep("upload")} disabled={isConnecting}>
                  Skip for now
                </Button>
                {processedFiles.length === mockDataFiles.length && (
                  <Button onClick={() => setStep("upload")}>
                    {"Continue with "}
                    {processedFiles.length}
                    {" files"}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {step === "upload" && (
          <motion.div
            key="upload"
            variants={viewMotionVariants}
            initial="initial"
            animate="enter"
            exit="exit"
            className="flex flex-col flex-grow overflow-hidden relative"
          >
            <AnimatePresence>
              {isSubmitting && (
                <motion.div
                  className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Loader className="h-8 w-8 animate-spin text-primary" />
                  <p className="mt-4 text-foreground font-medium">Creating your deal dashboard...</p>
                  <p className="text-muted-foreground text-sm">You will be redirected shortly.</p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-2 flex-grow min-h-0">
              <div className="flex flex-col p-8 pr-4">
                <h3 className="text-base font-semibold text-gray-800 truncate">{dealName}</h3>
                <p className="text-sm text-muted-foreground mt-1 mb-6">
                  {processedFiles.length > 0
                    ? `${processedFiles.length} files imported. Upload additional documents if needed.`
                    : "Upload documents to start the analysis."}
                </p>
                <div
                  className="flex-grow flex flex-col items-center justify-center border-2 border-dashed rounded-xl text-center p-4 cursor-pointer hover:border-primary/50 hover:bg-secondary/50 transition-colors"
                  onClick={handleUploadClick}
                >
                  <UploadCloud className="h-10 w-10 text-muted-foreground mb-3" />
                  <p className="font-medium text-foreground">Upload Additional Documents</p>
                  <p className="text-sm text-muted-foreground">Drag & drop files here</p>
                  <input type="file" ref={fileInputRef} className="hidden" multiple />
                </div>
              </div>
              <div className="bg-secondary/70 flex items-center justify-center p-8 overflow-hidden">
                <DynamicDealMockup dealName={dealName} isExiting={isSubmitting} />
              </div>
            </div>

            <div className="flex justify-between items-center p-4 mt-auto border-t bg-background flex-shrink-0">
              <Button variant="ghost" onClick={() => setStep("data_room")} disabled={isSubmitting}>
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={handleCreate} disabled={isSubmitting}>
                  Skip for now
                </Button>
                <Button
                  onClick={handleCreate}
                  className="bg-black text-white hover:bg-black/90 w-40"
                  disabled={isSubmitting}
                >
                  <AnimatePresence mode="wait">
                    {isSubmitting ? (
                      <motion.span
                        key="submitting"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center"
                      >
                        <Loader className="h-4 w-4 animate-spin" />
                      </motion.span>
                    ) : (
                      <motion.span key="finish" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        Finish & Create Deal
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

interface FloatingChatInputProps {
  triggerNewDeal?: boolean
  onNewDealClose?: () => void
  onDealCreated?: (dealData: { name: string; type: "buy" | "sell"; startAtDataRoom?: boolean }) => void
  selectedMarketDeal?: any
  onMarketDealClose?: () => void
  onAddToMyDeals?: (deal: any) => void
  onReachOut?: (deal: any) => void
  selectedPendingDeal?: any
  onPendingDealClose?: () => void
  triggerSearchFilter?: boolean
  onSearchFilterClose?: () => void
  onApplyFilters?: (filters: any) => void
  activeFilters?: any
  isInFindDealsView?: boolean
  hasPerformedSearch?: boolean
  onNavigate?: (section: string) => void
  currentSection?: string
  onBookmarkDeal?: onBookmarkDeal // Added onBookmarkDeal prop
  isWatchlistContext?: boolean
  triggerNewCampaign?: boolean
  onNewCampaignClose?: () => void
  onNewCampaignTrigger?: () => void
  onAddToCampaignFromModal?: (company: any) => void // Added onAddToCampaignFromModal prop
  onSearchSimilarFromModal?: (company: any) => void // Added onSearchSimilarFromModal prop
  // </CHANGE>
}

// --- Main Bar Component ---

export function FloatingChatInput({
  triggerNewDeal,
  onNewDealClose,
  onDealCreated,
  selectedMarketDeal,
  onMarketDealClose,
  onAddToMyDeals,
  onReachOut,
  selectedPendingDeal,
  onPendingDealClose,
  triggerSearchFilter,
  onSearchFilterClose,
  onApplyFilters,
  isInFindDealsView = false,
  activeFilters,
  hasPerformedSearch = false,
  onNavigate = () => {},
  currentSection = "home",
  onBookmarkDeal, // Added onBookmarkDeal prop
  isWatchlistContext = false,
  triggerNewCampaign = false,
  onNewCampaignClose,
  onNewCampaignTrigger,
  onAddToCampaignFromModal, // Added onAddToCampaignFromModal prop
  onSearchSimilarFromModal, // Added onSearchSimilarFromModal prop
  // </CHANGE>
}: FloatingChatInputProps) {
  const dealState = useDealState()
  const dispatch = useDealDispatch()

  const { state: bulkState, dispatch: bulkDispatch } = useBulkActions()
  const [isBulkEmailOpen, setIsBulkEmailOpen] = useState(false)
  const [isBulkLinkedInOpen, setIsBulkLinkedInOpen] = useState(false)
  const [isBulkCampaignOpen, setIsBulkCampaignOpen] = useState(false)

  const [selectedCampaign, setSelectedCampaign] = useState<any>(null)
  const [isCampaignDetailsOpen, setIsCampaignDetailsOpen] = useState(false)

  // Fix for undeclared variable: savedDealsDispatch is used in handleBulkSave but not declared.
  // It is already declared in MarketDealView, so we need to ensure it's accessible here.
  // Assuming useSavedDeals() provides the same context access here.
  const { state: savedDealsState, dispatch: savedDealsDispatch } = useSavedDeals()

  const isChatView = dealState?.activeView === "chat"
  const { addingWorkflowToSection, emailDraftRequest } = dealState || {}
  const isEmailDraftOpen = !!emailDraftRequest
  const isMarketDealOpen = !!selectedMarketDeal

  // --- Bulk Action Handlers ---
  const handleBulkCampaignClose = () => {
    setIsBulkCampaignOpen(false)
    bulkDispatch({ type: "CLEAR_SELECTION" })
    onNewCampaignClose?.()
  }

  const handleBulkCampaignSent = () => {
    toast.success("Campaign created successfully!")
    handleBulkCampaignClose()
  }

  const handleBulkEmailClose = () => {
    setIsBulkEmailOpen(false)
    bulkDispatch({ type: "CLEAR_SELECTION" })
  }

  const handleBulkEmailSent = () => {
    toast.success("Emails sent!")
    handleBulkEmailClose()
  }

  const handleBulkLinkedInClose = () => {
    setIsBulkLinkedInOpen(false)
    bulkDispatch({ type: "CLEAR_SELECTION" })
  }

  const handleBulkLinkedInSent = () => {
    toast.success("LinkedIn messages sent!")
    handleBulkLinkedInClose()
  }

  const handleBulkCampaign = () => {
    if (bulkState.selectedDeals.length > 0) {
      setIsBulkCampaignOpen(true)
    }
  }

  const handleBulkSave = () => {
    if (bulkState.selectedDeals.length === 0) return

    if (isWatchlistContext) {
      bulkDispatch({ type: "REMOVE_FROM_WATCHLIST" })
      toast.info("Deals removed from watchlist.")
    } else {
      bulkDispatch({ type: "ADD_TO_WATCHLIST" })
      toast.success("Deals added to watchlist.")
    }
    bulkDispatch({ type: "CLEAR_SELECTION" })
  }

  const prevTriggerNewCampaign = React.useRef(false)

  useEffect(() => {
    if (triggerNewCampaign && !prevTriggerNewCampaign.current) {
      setIsBulkCampaignOpen(true)
      onNewCampaignTrigger?.()
    }
    prevTriggerNewCampaign.current = triggerNewCampaign
  }, [triggerNewCampaign, onNewCampaignTrigger])

  useEffect(() => {
    if (isMarketDealOpen) {
      // Lock body scroll when modal is open
      document.body.style.overflow = "hidden"
      document.body.style.paddingRight = "0px" // Prevent layout shift

      return () => {
        // Restore body scroll when modal closes
        document.body.style.overflow = ""
        document.body.style.paddingRight = ""
      }
    }
  }, [isMarketDealOpen])

  useEffect(() => {
    console.log("[v0] Bulk state changed:", {
      selectedDealsCount: bulkState.selectedDeals.length,
      selectedDeals: bulkState.selectedDeals,
      isBulkEmailOpen,
      isBulkLinkedInOpen,
      isBulkCampaignOpen, // Added for logging
    })
  }, [bulkState.selectedDeals, isBulkEmailOpen, isBulkLinkedInOpen, isBulkCampaignOpen])

  useEffect(() => {
    const handleShowCampaignDetails = (event: CustomEvent) => {
      const { campaign } = event.detail
      setSelectedCampaign(campaign)
      setIsCampaignDetailsOpen(true)
      setIsOpen(true)
      setCompactExpanded(true)
      setIsNavExpanded(true)
    }

    window.addEventListener("show-campaign-details" as any, handleShowCampaignDetails)
    return () => {
      window.removeEventListener("show-campaign-details" as any, handleShowCampaignDetails)
    }
  }, [])

  const handleCloseCampaignDetails = () => {
    setIsCampaignDetailsOpen(false)
    setSelectedCampaign(null)
    setIsOpen(false)
    setCompactExpanded(false)
    setIsNavExpanded(false)
  }

  const [isOpen, setIsOpen] = useState(false)
  const [compactExpanded, setCompactExpanded] = useState(false)
  // const [contentView, setContentView] = useState<"workflows" | "all_workflows">("workflows") // Removed as it's no longer a state variable
  const [chatInputValue, setChatInputValue] = useState("") // Added chatInputValue state
  const [workflowInputValue, setWorkflowInputValue] = useState("") // Added workflowInputValue state
  const [isNewDealOpen, setIsNewDealOpen] = useState(false)
  const [newDealAnimationTarget, setNewDealAnimationTarget] = useState("new_deal")
  const [isSearchFilterOpen, setIsSearchFilterOpen] = useState(false)
  const [contentCenter, setContentCenter] = useState<number | null>(null)
  const contentCenterRef = useRef<number | null>(null)

  const [isMobile, setIsMobile] = useState(false)
  const [isOutreachEmailOpen, setIsOutreachEmailOpen] = useState(false)
  const [outreachDeal, setOutreachDeal] = useState<any>(null)
  const [isPendingTimelineOpen, setIsPendingTimelineOpen] = useState(false)
  const [pendingDeal, setPendingDeal] = useState<any>(null)
  const [dealName, setDealName] = useState("")

  const [isNavExpanded, setIsNavExpanded] = useState(false)
  const [navSearchQuery, setNavSearchQuery] = useState("")

  const prevEmailDraftRef = useRef<boolean>(false)

  useEffect(() => {
    if (!dealState) {
      setIsPendingTimelineOpen(!!selectedPendingDeal)
      setPendingDeal(selectedPendingDeal)

      // Reset signing flow when pending deal changes
      // The following line was removed as setShowSigningFlow is not declared in this scope.
      // if (!selectedPendingDeal) {
      //   setShowSigningFlow(false)
      // }
    }
  }, [selectedPendingDeal, dealState])

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)")
    const onChange = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile((e as MediaQueryList).matches ?? (e as any).matches)
    setIsMobile(mq.matches)
    // Safari <16 uses addListener/removeListener; modern uses addEventListener
    if ((mq as any).addEventListener) mq.addEventListener("change", onChange as any)
    else (mq as any).addListener(onChange as any)
    return () => {
      if ((mq as any).removeEventListener) mq.removeEventListener("change", onChange as any)
      else (mq as any).addListener(onChange as any)
    }
  }, [])

  useEffect(() => {
    // Locate the main content panel using common selectors.
    const findContainer = (): HTMLElement | null => {
      return (
        (document.querySelector("[data-content-panel]") as HTMLElement) ||
        (document.querySelector("#content-panel") as HTMLElement) ||
        (document.querySelector('main[role="main"]') as HTMLElement) ||
        (document.querySelector("main") as HTMLElement) ||
        (document.querySelector("[data-main-content]") as HTMLElement) ||
        (document.querySelector(".content-panel") as HTMLElement) ||
        null
      )
    }

    let el: HTMLElement | null = findContainer()

    const measure = () => {
      if (el) {
        const rect = el.getBoundingClientRect()
        const nextCenter = rect.left + rect.width / 2
        // Only update when changed to prevent feedback loops.
        if (contentCenterRef.current !== nextCenter) {
          contentCenterRef.current = nextCenter
          setContentCenter(nextCenter)
        }
      } else {
        if (contentCenterRef.current !== null) {
          contentCenterRef.current = null
          setContentCenter(null) // fallback to 50% via CSS
        }
      }
    }

    // Schedule measure on the next animation frame to avoid synchronous resize loops.
    let rafId: number | null = null
    const scheduleMeasure = () => {
      if (rafId) cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(measure)
    }

    // If element isn't ready yet, try again on next frame.
    if (!el) {
      scheduleMeasure()
      // attempt to find again on next frame
      rafId = requestAnimationFrame(() => {
        el = findContainer()
        scheduleMeasure()
      })
    } else {
      scheduleMeasure()
    }

    const ro = el
      ? new ResizeObserver(() => {
          // Defer measurement to next frame
          scheduleMeasure()
        })
      : null

    if (ro && el) ro.observe(el)

    // Also update on window resize, throttled to rAF.
    const onWindowResize = () => scheduleMeasure()
    window.addEventListener("resize", onWindowResize)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener("resize", onWindowResize)
      if (ro) ro.disconnect()
    }
  }, [])

  const inputRef = useRef<HTMLInputElement>(null)
  const barContentsRef = useRef(null)
  const ignoreOutsideRef = useRef(false)

  const pathname = usePathname()
  const isNewWorkspaceView = pathname?.includes("/deal/") && dealState?.activeView === "new-workspace"

  // Determine if chat has at least one assistant response
  const chatMessagesCandidate = (dealState as any)?.chatThread?.messages ?? (dealState as any)?.messages ?? []
  const hasAssistantResponse =
    Array.isArray(chatMessagesCandidate) &&
    chatMessagesCandidate.some((m: any) => m?.role === "assistant" || m?.role === "ai")

  const openBar = useCallback(() => {
    if (!dealState) return
    if (isChatView) {
      inputRef.current?.focus()
      return
    }
    setIsOpen(true)
    setIsNavExpanded(true)
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [dealState, isChatView])

  const closeBar = useCallback(() => {
    setIsOpen(false)
    setCompactExpanded(false)
    setIsNavExpanded(false)
    setWorkflowInputValue("")
    inputRef.current?.blur()
    dispatch?.({ type: "CLEAR_ADD_WORKFLOW_TO_SECTION" })
    setTimeout(() => {
      if (!isEmailDraftOpen) {
        // setContentView("workflows") // Removed as it's no longer a state variable
      }
    }, 200)
  }, [isEmailDraftOpen, dispatch])

  useEffect(() => {
    if (dealState?.workflowPrompt) {
      openBar()
      setWorkflowInputValue(dealState.workflowPrompt)
      requestAnimationFrame(() => inputRef.current?.focus())
      dispatch?.({ type: "CLEAR_WORKFLOW_PROMPT" })
    }
  }, [dealState?.workflowPrompt, openBar, dispatch])

  useEffect(() => {
    if (!dealState) {
      setIsNewDealOpen(!!triggerNewDeal)
    }
  }, [triggerNewDeal, dealState])

  useEffect(() => {
    console.log("[v0] triggerSearchFilter changed:", triggerSearchFilter)
    if (triggerSearchFilter) {
      console.log("[v0] Setting search filter states - isSearchFilterOpen: true, isOpen: true, compactExpanded: true")
      setIsSearchFilterOpen(true)
      setIsOpen(true)
      setCompactExpanded(true)
      setIsNavExpanded(true)
      if (activeFilters?.searchQuery) {
        setChatInputValue(activeFilters.searchQuery)
        setWorkflowInputValue(activeFilters.searchQuery)
      }
      setTimeout(() => {
        console.log("[v0] Attempting to focus search input after trigger")
        // The search input will be focused by the SearchFilterView's own useEffect
      }, 150)
    }
  }, [triggerSearchFilter, activeFilters])

  useEffect(() => {
    const prev = prevEmailDraftRef.current
    if (isEmailDraftOpen && !isOpen) {
      openBar()
    }
    if (prev && !isEmailDraftOpen && isOpen && !isChatView) {
      closeBar()
    }
    prevEmailDraftRef.current = isEmailDraftOpen
  }, [isEmailDraftOpen, isOpen, isChatView, openBar, closeBar])

  useEffect(() => {
    if (isNewWorkspaceView && !isOpen && !isChatView) {
      setIsOpen(true)
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }, [isNewWorkspaceView, isOpen, isChatView])

  // Add this effect to open workflows when in empty chat state and handle chat view transitions
  useEffect(() => {
    if (dealState?.activeView === "chat") {
      if (!dealState?.activeWorkspaceId) {
        // Empty chat state - show workflows
        setIsOpen(true)
        // setContentView("workflows") // Removed as it's no longer a state variable
        setCompactExpanded(false)
        requestAnimationFrame(() => inputRef.current?.focus())
      } else {
        // Existing chat session - show compact expanded input
        setIsOpen(false)
        setCompactExpanded(true)
        // setContentView("workflows") // Removed as it's no longer a state variable
        requestAnimationFrame(() => inputRef.current?.focus())
      }
    } else if (dealState?.activeView !== "chat") {
      // Not in chat view - close everything
      if (isOpen) {
        setIsOpen(false)
        setCompactExpanded(false)
        // setContentView("workflows") // Removed as it's no longer a state variable
      }
    }
  }, [dealState?.activeView, dealState?.activeWorkspaceId, isOpen]) // removed contentView from dependency array

  const handleNavigate = (section: string) => {
    onNavigate(section)
    // Close navigation bar after navigation
    setIsNavExpanded(false)
  }

  const handleNavSearchClick = () => {
    if (isInFindDealsView) {
      setIsSearchFilterOpen(true)
    } else {
      setIsNewDealOpen(true)
    }
  }

  const handleNavSearchSubmit = () => {
    if (navSearchQuery.trim()) {
      if (isInFindDealsView && onApplyFilters) {
        onApplyFilters({
          searchQuery: navSearchQuery.trim(),
          appliedAt: Date.now(),
        })
        setNavSearchQuery("")
        setIsNavExpanded(false)
        onSearchFilterClose?.()
      } else {
        // Handle general search/command
        setNavSearchQuery("")
        setIsNavExpanded(false)
      }
    }
  }

  const handleGlobalKeyDown = (event: KeyboardEvent) => {
    if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      if (dealState) {
        isOpen ? closeBar() : openBar()
      } else {
        if (isInFindDealsView) {
          setIsSearchFilterOpen((v) => !v)
        } else {
          setIsNewDealOpen((v) => !v)
        }
      }
    }
    if (event.key === "Escape") {
      event.preventDefault()
      if (!dealState) {
        if (isPendingTimelineOpen) {
          setIsPendingTimelineOpen(false)
          setPendingDeal(null)
          // Removed: setShowSigningFlow(false)
          onPendingDealClose?.()
        } else if (isSearchFilterOpen) {
          setIsSearchFilterOpen(false)
          setIsOpen(false)
          setCompactExpanded(false)
          setIsNavExpanded(false)
          onSearchFilterClose?.()
        } else if (isMarketDealOpen) {
          onMarketDealClose?.()
        } else if (isCampaignDetailsOpen) {
          handleCloseCampaignDetails()
        } else {
          setIsNewDealOpen(false)
          onNewDealClose?.()
        }
      } else if (isEmailDraftOpen) {
        dispatch?.({ type: "DISMISS_EMAIL_DRAFT" })
      } else if (isOpen && !isChatView) {
        // if (contentView === "all_workflows") handleBackToWorkflows()
        // else closeBar()
        closeBar()
      } else if (compactExpanded && !isChatView) {
        setCompactExpanded(false)
        setIsNavExpanded(false)
      }
    }
  }

  useEffect(() => {
    window.addEventListener("keydown", handleGlobalKeyDown)
    return () => window.removeEventListener("keydown", handleGlobalKeyDown)
  }, [
    isOpen,
    openBar,
    closeBar,
    // Removed contentView, handleBackToWorkflows
    dispatch,
    dealState,
    onNewDealClose,
    isChatView,
    isEmailDraftOpen,
    isMarketDealOpen,
    onMarketDealClose,
    onSearchFilterClose,
    isSearchFilterOpen,
    isPendingTimelineOpen,
    onPendingDealClose,
    compactExpanded,
    isInFindDealsView,
    isCampaignDetailsOpen, // Added isCampaignDetailsOpen
    handleCloseCampaignDetails, // Added handleCloseCampaignDetails
  ])

  const handleClickOutside = (event: MouseEvent) => {
    // Ignore the next outside click when initiated from Zap
    if (ignoreOutsideRef.current) {
      ignoreOutsideRef.current = false
      return
    }
    if (barContentsRef.current && !barContentsRef.current.contains(event.target as Node)) {
      if (!dealState) {
        if (isPendingTimelineOpen) {
          setIsPendingTimelineOpen(false)
          setPendingDeal(null)
          // Removed: setShowSigningFlow(false)
          onPendingDealClose?.()
        } else if (isSearchFilterOpen) {
          setIsSearchFilterOpen(false)
          setIsOpen(false)
          setCompactExpanded(false)
          setIsNavExpanded(false)
          onSearchFilterClose?.()
        } else if (isMarketDealOpen) {
          onMarketDealClose?.()
        } else if (isCampaignDetailsOpen) {
          handleCloseCampaignDetails()
        } else {
          setIsNewDealOpen(false)
          onNewDealClose?.()
        }
      } else if (isEmailDraftOpen) {
        dispatch?.({ type: "DISMISS_EMAIL_DRAFT" })
      } else if (isOpen && !isChatView) {
        // if (contentView === "all_workflows") handleBackToWorkflows()
        // else closeBar()
        closeBar()
      } else if (compactExpanded && !isChatView) {
        setCompactExpanded(false)
        setIsNavExpanded(false)
      }
    }
  }

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [
    isOpen,
    closeBar,
    dealState,
    onNewDealClose,
    isChatView,
    isEmailDraftOpen,
    dispatch,
    isMarketDealOpen,
    onMarketDealClose,
    onSearchFilterClose,
    isSearchFilterOpen,
    isPendingTimelineOpen,
    onPendingDealClose,
    compactExpanded,
    isCampaignDetailsOpen, // Added isCampaignDetailsOpen
    handleCloseCampaignDetails, // Added handleCloseCampaignDetails
  ])

  // const allWorkflows = Object.keys(workflowDefinitions).map((id) => ({
  //   id,
  //   ...workflowDefinitions[id],
  // }))
  //
  // const filteredWorkflows = allWorkflows.filter(
  //   (w) => w.title && w.title.toLowerCase().includes((workflowInputValue || "").toLowerCase()),
  // )

  const handleStartChat = useCallback(
    (initialMessage: string, workflowTitle: string | null = null) => {
      if (!initialMessage.trim()) return

      // Removed workflow finding logic
      // const workflow = allWorkflows.find((w) => w.title === workflowTitle)

      // If we're in chat view but no active workspace, create one first
      if (dealState?.activeView === "chat" && !dealState?.activeWorkspaceId) {
        dispatch?.({ type: "START_CHAT_WITH_WORKFLOWS" })
      }

      dispatch?.({
        type: "START_CHAT_THREAD",
        payload: {
          initialMessage,
          workflowTitle,
          // workflowId: workflow?.id, // Removed workflowId
        },
      })
      closeBar()
    },
    [dispatch, closeBar, dealState],
  )

  // const handleWorkflowSelect = (template: string) => {
  //   const allWorkflows = Object.keys(workflowDefinitions).map((id) => ({ id, ...workflowDefinitions[id] }))
  //   const workflow = allWorkflows.find((w) => w.promptTemplate === template || w.id === template)
  //   if (!workflow) return
  //
  //   const clientWorkspaceId = `ws_${Date.now()}`
  //
  //   dispatch?.({
  //     type: "START_WORKFLOW",
  //     payload: { id: workflow.id, clientWorkspaceId },
  //   })
  //
  //   setIsOpen(false)
  //   setCompactExpanded(false)
  //
  //   const steps: { id: string; text: string }[] = Array.isArray(workflow.steps) ? workflow.steps : []
  //   const stepDelay = 700
  //
  //   steps.forEach((step, index) => {
  //     setTimeout(
  //       () => {
  //         dispatch?.({
  //           type: "UPDATE_PIPELINE_STATUS",
  //           payload: {
  //             workspaceId: clientWorkspaceId,
  //             messageId: 1,
  //             stepId: step.id,
  //             status: "completed",
  //           },
  //         })
  //       },
  //       stepDelay * (index + 1),
  //     )
  //   })
  //
  //   const afterPipelineDelay = stepDelay * (steps.length + 1) + 400
  //   setTimeout(() => {
  //     const resultMessages: Omit<ChatMessage, "id">[] = []
  //
  //     resultMessages.push({
  //       role: "ai",
  //       content: `Analysis complete for ${workflow.title}. The workflow has been executed successfully.`,
  //       type: "text",
  //     })
  //
  //     resultMessages.push({
  //       role: "ai",
  //       content: `Key insights:\n- Workflow completed successfully\n- All steps executed as planned\n- Ready for next steps`,
  //       type: "text",
  //     })
  //
  //     dispatch?.({
  //       type: "APPEND_WORKSPACE_MESSAGES",
  //       payload: { workspaceId: clientWorkspaceId, messages: resultMessages },
  //     })
  //
  //     dispatch?.({ type: "COMPLETE_WORKFLOW", payload: { workflowId: workflow.id, title: workflow.title } })
  //     dispatch?.({ type: "COMPLETE_WORKSPACE_RUN", payload: { workspaceId: clientWorkspaceId } })
  //   }, afterPipelineDelay)
  // }

  const handleWorkflowSubmit = () => {
    // Removed workflow input value and filtering logic
    // if (workflowInputValue.trim()) {
    //   const workflowTitle = filteredWorkflows.length > 0 ? filteredWorkflows[0].title : null
    //   handleStartChat(workflowInputValue.trim(), workflowTitle)
    // }
  }

  const handleChatSubmit = () => {
    if (chatInputValue.trim()) {
      const userMessage: Omit<ChatMessage, "id"> = {
        role: "user",
        content: chatInputValue.trim(),
        type: "text",
      }
      dispatch?.({ type: "ADD_CHAT_MESSAGE", payload: userMessage })
      setChatInputValue("")
    }
  }

  const handleFooterKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      const trimmedInput = safeCurrentInput.trim()
      if (trimmedInput) {
        if (isInFindDealsView && onApplyFilters) {
          // Apply search as filters in Find Deals view
          onApplyFilters({
            searchQuery: trimmedInput,
            appliedAt: Date.now(),
          })
          setCurrentInput("")
          setIsOpen(false)
          setCompactExpanded(false)
          setIsNavExpanded(false)
          onSearchFilterClose?.()
        } else if (dealState?.activeView === "chat") {
          handleChatSubmit()
        } else {
          // Removed workflow submit call
          // handleWorkflowSubmit()
        }
      }
    }
  }

  const handlePrimaryAction = () => {
    if (isChatView) {
      handleChatSubmit()
    } else {
      // Removed workflow submit call
      // handleWorkflowSubmit()
    }
  }

  const handleSuggestionClick = (s: string) => {
    if (isChatView) {
      setChatInputValue((prev) => {
        const base = typeof prev === "string" ? prev.trim() : ""
        return base ? `${base} ${s}` : s
      })
      requestAnimationFrame(() => inputRef.current?.focus())
    }
  }

  // Moved renderHomeContent function here to fix redeclaration error
  const renderHomeContent = () => {
    console.log("[v0] renderHomeContent - conditions:", {
      isBulkEmailOpen,
      isBulkLinkedInOpen,
      isBulkCampaignOpen, // Added for logging
      isCampaignDetailsOpen, // Added isCampaignDetailsOpen
      selectedDealsCount: bulkState.selectedDeals.length,
      shouldShowBulkActions:
        bulkState.selectedDeals.length > 0 && !isBulkEmailOpen && !isBulkLinkedInOpen && !isBulkCampaignOpen,
    })

    if (isCampaignDetailsOpen && selectedCampaign) {
      return (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-md z-0 pointer-events-none"
          />
          <motion.div
            key="campaign-details"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="w-full h-full flex flex-col bg-background relative z-10"
          >
            {/* Minimal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold text-foreground truncate">{selectedCampaign.name}</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground truncate">{selectedCampaign.description}</p>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px] font-medium px-2 py-0.5 h-5",
                        selectedCampaign.status === "active" &&
                          "bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400",
                        selectedCampaign.status === "paused" &&
                          "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400",
                      )}
                    >
                      {selectedCampaign.status}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-muted/50 rounded-lg flex-shrink-0"
                onClick={handleCloseCampaignDetails}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            {/* </CHANGE> */}

            <div className="flex-1 px-6 py-5 overflow-auto bg-muted/10">
              <div className="max-w-5xl mx-auto">
                <CampaignWorkflowFlowchart campaign={selectedCampaign} />
              </div>
            </div>
            {/* </CHANGE> */}
          </motion.div>
        </>
      )
    }

    if (isBulkCampaignOpen) {
      console.log("[v0] Rendering BulkCampaignComposer with deals:", bulkState.selectedDeals)
      return (
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/60 backdrop-blur-md z-0"
            onClick={handleBulkCampaignClose}
          />
          <motion.div
            key="bulk-campaign-composer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="w-full h-full p-6 relative z-10 px-0 py-0"
          >
            <BulkCampaignComposer
              selectedDeals={bulkState.selectedDeals.length > 0 ? bulkState.selectedDeals : []}
              onClose={handleBulkCampaignClose}
              onSent={handleBulkCampaignSent}
              bulkDispatch={bulkDispatch}
            />
          </motion.div>
        </AnimatePresence>
      )
    }

    if (isBulkEmailOpen && bulkState.selectedDeals.length > 0) {
      return (
        <motion.div
          key="bulk-email-composer"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="w-full h-full"
        >
          <BulkEmailComposer
            selectedDeals={bulkState.selectedDeals}
            onClose={handleBulkEmailClose}
            onSent={handleBulkEmailSent}
          />
        </motion.div>
      )
    }

    if (isBulkLinkedInOpen && bulkState.selectedDeals.length > 0) {
      return (
        <motion.div
          key="bulk-linkedin-composer"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="w-full h-full"
        >
          <BulkLinkedInComposer onClose={handleBulkLinkedInClose} onSent={handleBulkLinkedInSent} />
        </motion.div>
      )
    }

    if (bulkState.selectedDeals.length > 0 && !isBulkEmailOpen && !isBulkLinkedInOpen && !isBulkCampaignOpen) {
      console.log("[v0] Rendering bulk actions toolbar")
      return (
        <motion.div
          key="bulk-actions-toolbar"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="flex items-center justify-center h-[46px] py-0 gap-0 px-0"
        >
          <div className="flex w-fit rounded-lg border border-border/20 py-0 px-2 justify-between items-center">
            <div className="flex items-center gap-3">
              <div
                className="flex items-center gap-[3px] h-6 px-3 text-sm font-normal rounded-2xl border-transparent text-neutral-200 border-0"
                style={{
                  boxShadow: `
                    rgba(0, 0, 0, 0.45) 0px 51px 85px 0px,
                    rgba(0, 0, 0, 0.33) 0px 30.029px 44.336px 0px,
                    rgba(0, 0, 0, 0.25) 0px 15.422px 20.808px 0px,
                    rgba(0, 0, 0, 0.12) 0px 1.387px 3.944px 0px
                  `,
                  background: `
                    linear-gradient(rgb(20, 20, 25), rgb(20, 20, 25)) padding-box,
                    conic-gradient(from 180deg,
                      rgba(255, 255, 255, 0.1) -0.45deg,
                      rgba(255, 255, 255, 0.04) 39.67deg,
                      rgba(255, 255, 255, 0.03) 72.85deg,
                      rgba(255, 255, 255, 0.14) 150.13deg,
                      rgba(255, 255, 255, 0.08) 193.06deg,
                      rgba(255, 255, 255, 0.04) 225.01deg,
                      rgba(255, 255, 255, 0.02) 304.51deg,
                      rgba(255, 255, 255, 0.1) 359.55deg,
                      rgba(255, 255, 255, 0.04) 399.67deg
                    ) border-box
                  `,
                  borderWidth: "0.63px",
                  fontWeight: 500,
                  lineHeight: "19.6px",
                  cursor: "default",
                  fontSize: "8pt",
                  boxSizing: "border-box",
                }}
              >
                <span className="font-sans">{bulkState.selectedDeals.length} selected</span>
              </div>
            </div>

            <motion.div
              className="flex items-center gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
            >
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.15, ease: [0.4, 0, 0.2, 1] }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkCampaign}
                  className="h-8 px-3 text-xs font-medium bg-transparent border-border/60 hover:border-border hover:bg-secondary"
                >
                  <Sparkles className="h-3 w-3 mr-1.5" />
                  Create Campaign ({bulkState.selectedDeals.length})
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: 0.25, ease: [0.4, 0, 0.2, 1] }}
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleBulkSave}
                  className="h-8 px-3 text-xs font-medium bg-transparent border-border/60 hover:border-border hover:bg-secondary"
                >
                  {isWatchlistContext ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-trash-2 h-3 w-3 mr-1.5"
                      >
                        <path d="M3 6h18"></path>
                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                      </svg>
                      Remove from watchlist
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-bookmark h-3 w-3 mr-1.5"
                      >
                        <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>
                      </svg>
                      Add to watchlist
                    </>
                  )}
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.45, ease: [0.4, 0, 0.2, 1] }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => bulkDispatch({ type: "CLEAR_SELECTION" })}
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  <X className="h-3 w-3" />
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
      )
    }

    if (isOutreachEmailOpen && outreachDeal) {
      return (
        <OutreachEmailView
          deal={outreachDeal}
          onClose={() => {
            setIsOutreachEmailOpen(false)
            setOutreachDeal(null)
          }}
          onSent={(deal) => {
            onReachOut?.(deal)
            setIsOutreachEmailOpen(false)
            setOutreachDeal(null)
          }}
        />
      )
    }

    // Show new deal flow if it's open, even if pending timeline is also open
    if (isNewDealOpen) {
      return (
        <NewDealView
          onDealCreated={(dealData) => {
            // Close both timeline and new deal flow
            setIsPendingTimelineOpen(false)
            setPendingDeal(null)
            // Removed: setShowSigningFlow(false)
            setIsNewDealOpen(false)
            onNewDealClose?.()
            onNewDealClose?.()

            // Now call the parent callback
            onDealCreated?.(dealData)
          }}
          onClose={() => {
            setIsNewDealOpen(false)
            onNewDealClose?.()
            // Don't close the timeline - let user go back to it
          }}
          setAnimationTarget={setNewDealAnimationTarget}
          prefilledName={pendingDeal?.name}
          startAtDataRoom={!!pendingDeal}
        />
      )
    }

    if (isPendingTimelineOpen && pendingDeal) {
      return (
        <PendingDealTimelineView
          deal={pendingDeal}
          onClose={() => {
            setIsPendingTimelineOpen(false)
            setPendingDeal(null)
            onPendingDealClose?.()
          }}
          onDealCreated={onDealCreated}
          setIsNewDealOpen={setIsNewDealOpen}
          setNewDealAnimationTarget={setNewDealAnimationTarget}
        />
      )
    }

    if (isSearchFilterOpen) {
      console.log("[v0] Rendering SearchFilterView - isSearchFilterOpen:", isSearchFilterOpen)
      return (
        <SearchFilterView
          onClose={() => {
            console.log("[v0] SearchFilterView onClose called")
            setIsSearchFilterOpen(false)
            setIsOpen(false)
            setCompactExpanded(false)
            setIsNavExpanded(false)
            onSearchFilterClose?.()
          }}
          onApplyFilters={(filters) => {
            console.log("[v0] SearchFilterView onApplyFilters called with:", filters)
            onApplyFilters?.(filters)
            setIsSearchFilterOpen(false)
            setIsOpen(false)
            setCompactExpanded(false)
            setIsNavExpanded(false)
          }}
          initialFilters={activeFilters}
        />
      )
    }

    if (isMarketDealOpen && selectedMarketDeal) {
      return (
        <MarketDealView
          deal={selectedMarketDeal}
          onClose={() => onMarketDealClose?.()}
          onReachOut={(deal) => {
            setOutreachDeal(deal)
            setIsOutreachEmailOpen(true)
          }}
          onBookmarkDeal={onBookmarkDeal} // Pass onBookmarkDeal prop to MarketDealView
          // Pass new callback props to MarketDealView
          onAddToCampaign={onAddToCampaignFromModal}
          onSearchSimilar={onSearchSimilarFromModal}
          onAddToCampaignFromModal={onAddToCampaignFromModal}
          onSearchSimilarFromModal={onSearchSimilarFromModal}
          // </CHANGE>
        />
      )
    }

    return (
      <NewDealTriggerView
        onOpen={() => {
          if (isInFindDealsView) {
            setIsSearchFilterOpen(true)
          } else {
            setIsNewDealOpen(true)
          }
        }}
        isInFindDealsView={isInFindDealsView}
      />
    )
  }

  const currentInput = isChatView ? chatInputValue : workflowInputValue
  const setCurrentInput = isChatView ? setChatInputValue : setWorkflowInputValue
  const safeCurrentInput = typeof currentInput === "string" ? currentInput : ""

  const placeholder = useMemo(() => {
    if (isInFindDealsView) {
      return hasPerformedSearch ? "Refine your search..." : "Search for deals..."
    }
    if (dealState?.activeView === "chat") {
      return dealState?.activeWorkspaceId ? "Continue the conversation..." : "Start a new conversation..."
    }
    return "Create deal, find deals, or ask anything..."
  }, [dealState?.activeView, dealState?.activeWorkspaceId, isInFindDealsView, hasPerformedSearch])

  const shouldBarBeOpen =
    isOpen ||
    (isChatView && (!dealState?.activeWorkspaceId || compactExpanded)) ||
    compactExpanded ||
    bulkState.selectedDeals.length > 0

  const animationTarget = !dealState
    ? // Added campaign creation animation target
      isBulkCampaignOpen
      ? "bulk_campaign" // Changed from "campaign_creation" to "bulk_campaign" to match variant name
      : isBulkEmailOpen
        ? "email_draft"
        : isBulkLinkedInOpen
          ? "linkedin_dm"
          : isCampaignDetailsOpen // Added isCampaignDetailsOpen
            ? "campaign_details"
            : bulkState.selectedDeals.length > 0
              ? "bulk_actions"
              : isSearchFilterOpen
                ? "search_filter"
                : isMarketDealOpen
                  ? "market_deal"
                  : isOutreachEmailOpen
                    ? "email_draft"
                    : isPendingTimelineOpen
                      ? "market_deal" // Changed from "signing_flow" to "market_deal" as signing_flow is handled within PendingDealTimelineView
                      : isNewDealOpen
                        ? newDealAnimationTarget
                        : isNavExpanded
                          ? "nav_expanded"
                          : "nav_collapsed"
    : isEmailDraftOpen
      ? "email_draft"
      : isChatView
        ? isOpen || !dealState?.activeWorkspaceId
          ? "open_wide"
          : "chat_view"
        : isOpen
          ? "open_wide"
          : compactExpanded
            ? "chat_view"
            : "closed"

  console.log("[v0] Animation target:", animationTarget, {
    dealState: !!dealState,
    bulkSelectedCount: bulkState.selectedDeals.length,
    isBulkEmailOpen,
    isBulkLinkedInOpen,
    isBulkCampaignOpen, // Added for logging
  })

  const shouldUseCenterTransform =
    !isBulkEmailOpen && !isBulkLinkedInOpen && !isBulkCampaignOpen && !isCampaignDetailsOpen
  const leftValue = contentCenter !== null ? contentCenter : "50%"
  const containerStyle = shouldUseCenterTransform
    ? { left: leftValue, transform: "translateX(-50%)" }
    : { left: "50%", transform: "translateX(-50%)" }

  return (
    <div
      className={cn(
        "fixed z-50 flex flex-col items-center gap-2 lg:bottom-6 bottom-[max(env(safe-area-inset-bottom),0.5rem)]",
        (isBulkEmailOpen || isBulkLinkedInOpen || isBulkCampaignOpen || isCampaignDetailsOpen) &&
          "left-0 right-0 mx-auto w-fit",
      )}
      style={
        !isBulkEmailOpen && !isBulkLinkedInOpen && !isBulkCampaignOpen && !isCampaignDetailsOpen
          ? containerStyle
          : undefined
      }
    >
      {dealState && isChatView && !isEmailDraftOpen && hasAssistantResponse && !isMobile && (
        <motion.div
          key="chat-suggestions"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          className="w-[900px] max-w-[90vw] px-1"
        >
          <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar py-1">
            {promptSuggestions.map((s) => (
              <Button
                key={s}
                variant="secondary"
                size="sm"
                className="whitespace-nowrap h-7 px-2.5 text-xs"
                onClick={() => handleSuggestionClick(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {!!(
          bulkState.selectedDeals.length > 0 ||
          isInFindDealsView ||
          hasPerformedSearch ||
          activeFilters ||
          selectedMarketDeal ||
          selectedPendingDeal ||
          isNewDealOpen ||
          isSearchFilterOpen ||
          isOutreachEmailOpen ||
          isPendingTimelineOpen ||
          isCampaignDetailsOpen || // Added isCampaignDetailsOpen
          dealState ||
          true
        ) && (
          <motion.div
            layout
            ref={barContentsRef}
            variants={isMobile ? mobileBarVariants : desktopBarVariants}
            initial="nav_collapsed"
            animate={animationTarget}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={barTransition}
            className={cn(
              "relative text-foreground flex flex-col",
              bulkState.selectedDeals.length > 0 &&
                !isBulkEmailOpen &&
                !isBulkLinkedInOpen &&
                !isBulkCampaignOpen &&
                "max-h-[120px]",
              (isBulkEmailOpen || isBulkLinkedInOpen || isBulkCampaignOpen || isCampaignDetailsOpen) &&
                "min-h-[600px] max-h-[80vh]", // Added isCampaignDetailsOpen
              isMarketDealOpen && "min-h-[500px] max-h-[60vh]",
              isNavExpanded ||
                shouldBarBeOpen ||
                isSearchFilterOpen ||
                isMarketDealOpen ||
                isNewDealOpen ||
                isPendingTimelineOpen ||
                isOutreachEmailOpen ||
                isBulkCampaignOpen ||
                isCampaignDetailsOpen || // Added isCampaignDetailsOpen
                bulkState.selectedDeals.length > 0
                ? "rounded-2xl shadow-2xl bg-background/80 backdrop-blur-xl"
                : "rounded-full shadow-lg bg-background/80 backdrop-blur-xl",
            )}
            style={{
              transformOrigin: "bottom center",
            }}
            onWheelCapture={(e) => {
              if (isMarketDealOpen) {
                e.stopPropagation()
              }
            }}
            onTouchMoveCapture={(e) => {
              if (isMarketDealOpen) {
                e.stopPropagation()
              }
            }}
          >
            {dealState ? (
              <>
                <div
                  className={cn(
                    "flex-grow flex flex-col min-h-0",
                    (isBulkEmailOpen || isBulkLinkedInOpen || isBulkCampaignOpen || isCampaignDetailsOpen) &&
                      "overflow-y-auto", // Added isCampaignDetailsOpen
                    isMarketDealOpen && "overflow-y-auto",
                  )}
                >
                  {renderHomeContent()}
                </div>
                {!isEmailDraftOpen && (
                  <div
                    className={cn(
                      "flex-shrink-0 flex flex-col",
                      shouldBarBeOpen && "border-t border-border border-border/50",
                    )}
                  >
                    <div
                      style={{
                        height: shouldBarBeOpen
                          ? isMobile
                            ? MOBILE_INPUT_AREA_HEIGHT
                            : INPUT_AREA_HEIGHT
                          : isMobile
                            ? MOBILE_CLOSED_BAR_HEIGHT
                            : CLOSED_BAR_HEIGHT,
                      }}
                    >
                      <div className="relative h-full">
                        <div className="absolute top-0 left-0 right-0 px-2 h-[52px]">
                          <div className="relative flex items-center h-full">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute left-2 w-8 h-8 text-muted-foreground hover:text-foreground"
                              aria-pressed={isOpen}
                              title="Toggle workflows"
                              onPointerDownCapture={() => {
                                // Ensure the document outside-click handler ignores this interaction
                                ignoreOutsideRef.current = true
                              }}
                              onClick={(e) => {
                                e.stopPropagation()
                                if (isChatView && dealState?.activeWorkspaceId) {
                                  // In an existing chat session - start new chat and open workflows
                                  dispatch?.({ type: "START_NEW_CHAT_THREAD" })
                                  // Force open the workflows panel
                                  setIsOpen(true)
                                  setCompactExpanded(false)
                                  // setContentView("workflows") // Removed as it's no longer a state variable
                                  requestAnimationFrame(() => inputRef.current?.focus())
                                } else if (!isOpen) {
                                  // Open full (wider/taller) workflows panel
                                  setIsOpen(true)
                                  // setContentView("workflows") // Removed as it's no longer a state variable
                                  // keep focus on input for quick typing
                                  requestAnimationFrame(() => inputRef.current?.focus())
                                } else {
                                  // Close workflows but keep the compact input expanded
                                  setIsOpen(false)
                                  setCompactExpanded(true)
                                  requestAnimationFrame(() => inputRef.current?.focus())
                                }
                              }}
                            >
                              <Zap className="h-4 w-4" />
                            </Button>
                            <Input
                              ref={inputRef}
                              type="text"
                              placeholder={placeholder}
                              value={safeCurrentInput}
                              onChange={(e) => setCurrentInput(e.target.value)}
                              onFocus={() => setCompactExpanded(true)}
                              onKeyDown={handleFooterKeyDown}
                              className="w-full h-full bg-transparent border-none focus:outline-none focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm placeholder:text-muted-foreground text-foreground pl-12 pr-20"
                            />
                          </div>
                        </div>
                        <AnimatePresence>
                          {shouldBarBeOpen && (
                            <motion.div
                              className="absolute bottom-2 left-4 flex items-center space-x-1"
                              variants={fadeVariants}
                              initial="initial"
                              animate="animate"
                              exit="exit"
                              transition={{ duration: 0.2 }}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 text-muted-foreground hover:text-foreground p-0"
                                onClick={() => {
                                  if (isChatView && dealState?.activeWorkspaceId) {
                                    // Navigate to new chat session - dispatch the action and open workflows
                                    dispatch?.({ type: "START_NEW_CHAT_THREAD" })
                                    // Force open the workflows panel
                                    setIsOpen(true)
                                    setCompactExpanded(false)
                                    // setContentView("workflows") // Removed as it's no longer a state variable
                                    requestAnimationFrame(() => inputRef.current?.focus())
                                  }
                                }}
                              >
                                <PlusIcon className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 text-muted-foreground hover:text-foreground p-0"
                              >
                                <FilterIcon className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 text-muted-foreground hover:text-foreground p-0"
                              >
                                <SplitViewIcon className="w-4 h-4" />
                              </Button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                )}
                {!isEmailDraftOpen && (
                  <motion.div
                    className="absolute right-4 flex items-center space-x-1 h-7"
                    animate={{ bottom: shouldBarBeOpen ? 8 : 12 }}
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  >
                    <div className="w-8 h-8 flex items-center justify-center">
                      <AnimatePresence mode="wait" initial={false}>
                        {safeCurrentInput.trim().length > 0 ? (
                          <motion.div
                            key="send"
                            variants={iconSwitchVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.15 }}
                          >
                            <Button variant="default" size="icon" className="w-8 h-8 p-0" onClick={handlePrimaryAction}>
                              <SendIcon className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="mic"
                            variants={iconSwitchVariants}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            transition={{ duration: 0.15 }}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 text-muted-foreground hover:text-foreground p-0"
                            >
                              <MicIcon className="w-4 h-4" />
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </>
            ) : (
              <div className="w-full h-auto">
                {isNavExpanded ||
                shouldBarBeOpen ||
                isSearchFilterOpen ||
                isMarketDealOpen ||
                isNewDealOpen ||
                isPendingTimelineOpen ||
                isOutreachEmailOpen ||
                isBulkCampaignOpen ||
                isCampaignDetailsOpen || // Added isCampaignDetailsOpen
                bulkState.selectedDeals.length > 0 ? (
                  <AnimatePresence mode="wait">{renderHomeContent()}</AnimatePresence>
                ) : (
                  <MorphingNavigationBar
                    isExpanded={isNavExpanded}
                    onNavigate={handleNavigate}
                    onSearchClick={handleNavSearchClick}
                    onExpandToggle={setIsNavExpanded}
                    currentSection={currentSection}
                    searchQuery={navSearchQuery}
                    onSearchQueryChange={setNavSearchQuery}
                    onSearchSubmit={handleNavSearchSubmit}
                    placeholder={placeholder}
                  />
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Removed the separate BulkEmailComposer portal rendering since it's now handled in renderHomeContent */}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
      `}</style>
    </div>
  )
}
