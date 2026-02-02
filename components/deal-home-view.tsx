"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useDealState, useDealDispatch } from "@/lib/deal-context"
import { workflowDefinitions } from "@/lib/workflows"
import { ContentLayout } from "./content-layout"
import { ChatMessageContent } from "./chat-thread-view"
import { cn } from "@/lib/utils"
import {
  FileText,
  ChevronRight,
  Search,
  FileCheck,
  Mail,
  Zap,
  Bot,
  User,
  Lightbulb,
  Building,
  Briefcase,
  Users,
  Handshake,
  Loader2,
} from "lucide-react"
import { WorkflowsBrowser } from "./workflows-browser"
import { MissingInfoContextMenu } from "./missing-info-context-menu"
import { DealHealthOverviewCard } from "./deal-health-overview-card"

const allWorkflows = Object.keys(workflowDefinitions).map((id) => ({
  id,
  ...workflowDefinitions[id],
}))

const MetricCard = ({
  title,
  value,
  change,
}: {
  title: string
  value: React.ReactNode
  change?: string
}) => (
  <div className="p-4 rounded-lg bg-transparent">
    <p className="text-xs text-muted-foreground mb-1">{title}</p>
    <div className="flex items-baseline gap-2">
      <p className="text-foreground text-xl font-semibold">{value}</p>
      {change && <p className="text-sm font-semibold text-green-600">{change}</p>}
    </div>
  </div>
)

const iconMap = { Search, FileCheck, Mail }

const TasksCard = () => {
  const dealState = useDealState()
  const dispatch = useDealDispatch()

  if (!dealState || !dispatch) {
    return null
  }
  const { tasks } = dealState

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length > 0 ? (
          <div className="space-y-1">
            {tasks.slice(0, 3).map((task) => {
              const Icon = iconMap[task.icon as keyof typeof iconMap] || Search
              return (
                <div
                  key={task.id}
                  onClick={() => dispatch({ type: "VIEW_TASK", payload: task })}
                  className="flex items-center justify-between p-2 -mx-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                      <Icon className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{task.title}</p>
                      <Badge
                        variant={task.status === "To Do" ? "outline" : "secondary"}
                        className={`mt-1 text-xs font-medium ${
                          task.status === "Pending Reply"
                            ? "bg-yellow-100 text-yellow-800 border-transparent pulse-badge"
                            : "border-slate-200"
                        }`}
                      >
                        {task.status}
                      </Badge>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center text-sm text-muted-foreground h-full flex items-center justify-center py-8">
            <p>No active tasks.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const ChatMessagesArea = ({ messages }: { messages: any[] }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const messageVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto overflow-y-auto pr-4 -mr-4">
      <div className="space-y-8 py-6">
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            layout
            variants={messageVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              delay: index * 0.1,
            }}
            className={`flex items-start gap-4 group relative ${message.role === "user" ? "justify-end" : ""}`}
          >
            {message.role === "ai" && (
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
            )}
            <div
              className={cn(
                "max-w-3xl w-full rounded-2xl shadow-sm text-sm",
                message.role === "user"
                  ? "bg-primary text-primary-foreground p-4 rounded-br-lg"
                  : "bg-secondary text-secondary-foreground p-4 rounded-bl-lg",
              )}
            >
              <ChatMessageContent message={message} onAddToInsights={() => {}} />
            </div>
            {message.role === "user" && (
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-gray-600" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
      <div ref={messagesEndRef} />
    </div>
  )
}

export function DealHomeView({ deal: initialDeal }: { deal: any }) {
  const dealState = useDealState()
  const dispatch = useDealDispatch()
  const [inputValue, setInputValue] = useState("")
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [category, setCategory] = useState("all-categories")
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: string } | null>(null)
  const [isRefreshing, setIsRefreshing] = useState<string | null>(null)
  const menuTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const deal = {
    ...initialDeal,
    description:
      "BlueSky is a leading provider of cloud-based software solutions for the renewable energy sector, focusing on optimizing solar and wind farm performance.",
    industry: "Technology",
    sector: "SaaS, Renewable Energy",
    employees: "250-500",
    sponsor: null,
    health: 85,
    stage: "Diligence",
    healthCriteria: [
      { criteria: "Revenue (LTM)", benchmark: "$50-250M", companyValue: "$70M", match: true },
      { criteria: "EBITDA Margin", benchmark: "> 20%", companyValue: "22.8%", match: true },
      { criteria: "Gross Leverage", benchmark: "< 3.0x", companyValue: "2.6x", match: true },
      { criteria: "Customer Churn", benchmark: "< 5%", companyValue: "6.2%", match: false },
    ],
  }

  const summaryItems = [
    { icon: Building, label: "Industry", value: deal.industry },
    { icon: Briefcase, label: "Sector", value: deal.sector },
    { icon: Users, label: "Employees", value: deal.employees },
    { icon: Handshake, label: "Sponsor", value: deal.sponsor },
    { icon: Users, label: "Deal Stage", value: deal.stage },
  ]

  const activeWorkspace = dealState?.workspaces.find((ws) => ws.id === dealState.activeWorkspaceId)
  const messages = activeWorkspace?.messages || []
  const hasStartedChat = !!activeWorkspace

  const handleMouseEnter = (e: React.MouseEvent, item: string) => {
    if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current)
    const rect = e.currentTarget.getBoundingClientRect()
    setContextMenu({ x: rect.left, y: rect.bottom + 4, item })
  }

  const handleMouseLeave = () => {
    menuTimeoutRef.current = setTimeout(() => {
      setContextMenu(null)
    }, 200)
  }

  const handleRefresh = (item: string) => {
    setIsRefreshing(item)
    setContextMenu(null)
    setTimeout(() => setIsRefreshing(null), 2000)
  }

  const handleUpload = () => {
    dispatch?.({ type: "SET_ACTIVE_VIEW", payload: "documents" })
    setContextMenu(null)
  }

  const handleRequest = (item: string) => {
    dispatch?.({ type: "SHOW_EMAIL_DRAFT", payload: { requiredInput: item } })
    setContextMenu(null)
  }

  const handleViewTask = (item: string) => {
    const task = dealState?.tasks.find((t) => t.requiredInput === item)
    if (task && dispatch) dispatch({ type: "VIEW_TASK", payload: task })
    setContextMenu(null)
  }

  const handleStartChat = async (initialMessage: string, workflowTitle: string | null = null) => {
    const workflow = allWorkflows.find((w) => w.title === workflowTitle)
    setIsTransitioning(true)
    await new Promise((resolve) => setTimeout(resolve, 200))
    dispatch?.({
      type: "START_CHAT_THREAD",
      payload: { initialMessage, workflowTitle, workflowId: workflow?.id },
    })
    setInputValue("")
    setTimeout(() => setIsTransitioning(false), 600)
  }

  const handleSubmit = () => {
    if (inputValue.trim()) {
      handleStartChat(inputValue.trim())
    }
  }

  const handleRunWorkflow = (prompt: string) => {
    const workflow = allWorkflows.find((w) => w.promptTemplate === prompt)
    handleStartChat(prompt, workflow?.title || null)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault()
      handleSubmit()
    }
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  if (!dealState || !dispatch) {
    return null
  }

  const workflowHeaderActions: React.ReactNode = null

  const headerActions = hasStartedChat ? (
    <Button variant="outline" size="sm" onClick={() => console.log("Toggle insights")}>
      <Lightbulb className="h-4 w-4 mr-2" />
      View Insights Shelf
    </Button>
  ) : (
    workflowHeaderActions
  )

  const getHeaderContent = () => {
    if (hasStartedChat && activeWorkspace) {
      return { title: activeWorkspace.title, description: "Conversation with Gordon AI" }
    } else {
      return { title: deal.name, description: "An overview of your deal dashboard." }
    }
  }

  const headerContent = getHeaderContent()

  return (
    <>
      {/* Global blur overlay when email draft is open - covers entire viewport including sidebar */}
      {dealState?.emailDraftRequest && (
        <div className="fixed inset-0 backdrop-blur-sm z-40 pointer-events-none bg-transparent" />
      )}

      <div className="h-full flex flex-col">
        <ContentLayout
          title={headerContent.title}
          description={headerContent.description}
          headerActions={headerActions}
        >
          <div className="flex flex-col h-full relative">
            {!hasStartedChat && (
              <div className="max-w-7xl mx-auto mb-12">
                <div className="flex flex-col gap-y-6">
                  <Card>
                    <div className="grid divide-x divide-slate-200/80 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
                      <MetricCard title="Deal Value" value="$45M" change="+2.1%" />
                      <MetricCard title="EBITDA Multiple" value="8.5x" />
                      <MetricCard title="Revenue (LTM)" value="$32.4M" change="+15%" />
                      <MetricCard title="EBITDA Margin" value="22.8%" change="+180bps" />
                      <MetricCard title="Gross Leverage" value="2.6x" />
                    </div>
                  </Card>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 flex flex-col gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Deal Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground leading-relaxed mb-4">{deal.description}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                            {summaryItems.map((item) => {
                              const isPending = dealState.pendingInfoRequests.includes(item.label)
                              const isItemRefreshing = isRefreshing === item.label

                              return (
                                <div
                                  key={item.label}
                                  className="relative group flex items-center gap-3 p-2 -m-2 rounded-lg transition-colors hover:bg-slate-50 py-5"
                                  onMouseEnter={(e) => !item.value && handleMouseEnter(e, item.label)}
                                  onMouseLeave={handleMouseLeave}
                                >
                                  <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                    {isItemRefreshing ? (
                                      <Loader2 className="h-4 w-4 text-slate-500 animate-spin" />
                                    ) : (
                                      <item.icon className="h-4 w-4 text-slate-500" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">{item.label}</p>
                                    {item.value ? (
                                      <p className="text-sm font-medium text-foreground">{item.value}</p>
                                    ) : isPending ? (
                                      <Button
                                        variant="link"
                                        className="text-xs h-auto p-0 text-yellow-600 hover:text-yellow-700"
                                        onClick={() => handleViewTask(item.label)}
                                      >
                                        Pending Reply
                                      </Button>
                                    ) : (
                                      <p className="text-sm font-medium text-foreground blur-sm select-none">
                                        Placeholder
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                      <TasksCard />
                    </div>

                    <div className="flex flex-col gap-6">
                      <DealHealthOverviewCard deal={deal} />
                      <Card>
                        <CardHeader>
                          <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col space-y-2">
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => dispatch({ type: "SET_ACTIVE_VIEW", payload: "documents" })}
                          >
                            <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                            Upload Documents
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => dispatch({ type: "SET_ACTIVE_VIEW", payload: "workflows" })}
                          >
                            <Zap className="h-4 w-4 mr-2 text-muted-foreground" />
                            Browse Workflows
                          </Button>
                          <Button
                            variant="ghost"
                            className="w-full justify-start"
                            onClick={() => dispatch({ type: "SET_ACTIVE_VIEW", payload: "full-report" })}
                          >
                            <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                            View Full Report
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <AnimatePresence>
              {contextMenu && (
                <div
                  onMouseEnter={() => menuTimeoutRef.current && clearTimeout(menuTimeoutRef.current)}
                  onMouseLeave={handleMouseLeave}
                >
                  <MissingInfoContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    isPending={dealState.pendingInfoRequests.includes(contextMenu.item)}
                    onRefresh={() => handleRefresh(contextMenu.item)}
                    onUpload={handleUpload}
                    onRequest={() => handleRequest(contextMenu.item)}
                    onViewTask={() => handleViewTask(contextMenu.item)}
                  />
                </div>
              )}
            </AnimatePresence>

            <motion.div
              layout
              className="flex-1 flex flex-col min-h-0 relative"
              animate={{ y: hasStartedChat ? 0 : 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 25, duration: 1.2 }}
            >
              <AnimatePresence mode="wait">
                {hasStartedChat ? (
                  <motion.div
                    key="chat-content"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="flex-1 flex flex-col min-h-0"
                  >
                    <ChatMessagesArea messages={messages} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="workflows-content"
                    initial={{ opacity: 1, y: 0 }}
                    animate={{ opacity: isTransitioning ? 0 : 1, y: isTransitioning ? -20 : 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="flex-1 overflow-y-auto"
                  >
                    <WorkflowsBrowser onRunWorkflow={handleRunWorkflow} filterText={inputValue} category={category} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </ContentLayout>
      </div>
    </>
  )
}
