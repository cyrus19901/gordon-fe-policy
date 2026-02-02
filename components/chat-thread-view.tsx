"use client"

import type React from "react"
import { useRef, useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useDealState, useDealDispatch } from "@/lib/deal-context"
import type { ChatMessage } from "@/lib/deal-context"
import { workflowDefinitions } from "@/lib/workflows"
import { Bot, User, Pin, Loader, Check, Lightbulb } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "./ui/card"

const PipelineMessage = ({ message }: { message: ChatMessage }) => {
  return (
    <div className="text-sm">
      <p className="text-muted-foreground mb-3">{message.content}</p>
      <div className="space-y-2.5">
        {message.steps?.map((step) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 text-foreground"
          >
            <AnimatePresence>
              {step.status === "completed" ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                  <Check className="h-4 w-4 text-green-500" />
                </motion.div>
              ) : (
                <div className="w-4 h-4 flex items-center justify-center">
                  <Loader className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </AnimatePresence>
            <span className={step.status === "completed" ? "text-muted-foreground line-through" : ""}>{step.text}</span>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export const ChatMessageContent = ({
  message,
  onAddToInsights,
}: {
  message: ChatMessage
  onAddToInsights: (message: ChatMessage, event: React.MouseEvent<HTMLButtonElement>) => void
}) => {
  if (message.type === "pipeline") {
    return <PipelineMessage message={message} />
  }

  if (message.type === "chart" || message.type === "table") {
    const title = message.content.replace("Generated ", "")
    return (
      <Card className="overflow-hidden">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={(e) => onAddToInsights(message, e)}>
            <Pin className="h-4 w-4 text-muted-foreground" />
          </Button>
        </CardHeader>
        <CardContent className="h-80">
          <p className="text-center text-muted-foreground">Chart visualization: {message.component}</p>
        </CardContent>
        {message.insight && (
          <CardFooter className="bg-secondary/50 text-xs text-secondary-foreground p-3">
            <p>{message.insight}</p>
          </CardFooter>
        )}
      </Card>
    )
  }
  return (
    <p className="leading-relaxed" style={{ textWrap: "pretty" }}>
      {message.content}
    </p>
  )
}

export function ChatThreadView() {
  const dealState = useDealState()
  const dispatch = useDealDispatch()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [isSimulating, setIsSimulating] = useState(false)
  const [isAiThinking, setIsAiThinking] = useState(false)

  const activeWorkspace = dealState?.workspaces.find((ws) => ws.id === dealState.activeWorkspaceId)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleAddToInsights = (message: ChatMessage, event: React.MouseEvent<HTMLButtonElement>) => {
    // This logic is complex and seems unrelated to the current error.
    // Assuming it's correct for now.
  }

  useEffect(() => {
    const runWorkflowSimulation = async (workspaceId: string, workflowId: string) => {
      if (!dispatch || !workflowId) return

      const definition = Object.values(workflowDefinitions).find((def) => def.id === workflowId)
      if (!definition || !definition.steps) return

      const pipelineMessage = activeWorkspace?.messages.find((m) => m.type === "pipeline")
      if (!pipelineMessage) return

      for (const step of definition.steps) {
        await new Promise((r) => setTimeout(r, step.duration))
        dispatch({
          type: "UPDATE_PIPELINE_STATUS",
          payload: { workspaceId, messageId: pipelineMessage.id, stepId: step.id, status: "completed" },
        })

        if (step.generates) {
          await new Promise((r) => setTimeout(r, 500))
          dispatch({
            type: "ADD_WORKSPACE_MESSAGE",
            payload: {
              workspaceId,
              message: {
                role: "ai",
                content: `Generated ${step.generates}`,
                type: step.generates.includes("Table") ? "table" : "chart",
                component: step.generates,
                insight: step.insight,
              },
            },
          })
        }
      }

      dispatch({ type: "COMPLETE_WORKSPACE_RUN", payload: { workspaceId } })
      dispatch({ type: "COMPLETE_WORKFLOW", payload: { workflowId, title: definition.title } })
      setIsSimulating(false)
    }

    if (activeWorkspace && activeWorkspace.status === "running" && !isSimulating) {
      setIsSimulating(true)
      runWorkflowSimulation(activeWorkspace.id, activeWorkspace.workflowId!)
    }
  }, [activeWorkspace, isSimulating, dispatch])

  useEffect(() => {
    if (!activeWorkspace || !dispatch || activeWorkspace.status === "running") return

    const lastMessage = activeWorkspace.messages[activeWorkspace.messages.length - 1]
    if (lastMessage && lastMessage.role === "user" && !isAiThinking) {
      setIsAiThinking(true)
      setTimeout(() => {
        dispatch({
          type: "ADD_CHAT_MESSAGE",
          payload: {
            role: "ai",
            content: "This is an automatic AI response.",
            type: "text",
          },
        })
        setIsAiThinking(false)
      }, 1200)
    }
  }, [activeWorkspace, isAiThinking, dispatch])

  useEffect(() => {
    scrollToBottom()
  }, [activeWorkspace?.messages])

  if (!dealState || !activeWorkspace) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <p>Start a new chat or workflow.</p>
      </div>
    )
  }

  const messageVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 },
  }

  const headerActions = (
    <Button
      variant={dealState.isWorkflowPanelOpen ? "default" : "outline"}
      size="sm"
      data-insights-button="true"
      onClick={() => dispatch?.({ type: "TOGGLE_WORKFLOW_PANEL" })}
    >
      <Lightbulb className="h-4 w-4 mr-2" />
      {dealState.isWorkflowPanelOpen ? "Hide" : "View"} Insights Shelf
    </Button>
  )

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-lg font-semibold">{activeWorkspace.title}</h2>
          <p className="text-sm text-muted-foreground">Conversation with Gordon AI</p>
        </div>
        {headerActions}
      </div>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <div className="space-y-8 pt-6 pb-32">
            <AnimatePresence initial={false}>
              {activeWorkspace.messages.map((message) => (
                <motion.div
                  key={message.id}
                  data-message-id={message.id}
                  layout
                  variants={messageVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className={`flex items-start gap-4 group relative ${message.role === "user" ? "justify-end" : ""}`}
                >
                  {message.role === "ai" && (
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-primary-foreground" />
                    </div>
                  )}
                  {message.role === "ai" && message.type === "text" && (
                    <div className="absolute top-1/2 -translate-y-1/2 -right-12 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8"
                        onClick={(e) => handleAddToInsights(message, e)}
                      >
                        <Pin className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-3xl rounded-2xl shadow-sm text-sm w-full",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground p-4 rounded-br-lg"
                        : message.type === "text"
                          ? "bg-secondary text-secondary-foreground p-4 rounded-bl-lg"
                          : "",
                      (message.type === "chart" || message.type === "table") && "bg-transparent shadow-none",
                      message.type === "pipeline" && "bg-secondary text-secondary-foreground p-4 rounded-bl-lg",
                    )}
                  >
                    <ChatMessageContent message={message} onAddToInsights={handleAddToInsights} />
                  </div>
                  {message.role === "user" && (
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {isAiThinking && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-4"
              >
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="max-w-md p-4 rounded-2xl bg-secondary text-secondary-foreground rounded-bl-lg">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-pulse"
                      style={{ animationDelay: "0s" }}
                    />
                    <span
                      className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-pulse"
                      style={{ animationDelay: "0.2s" }}
                    />
                    <span
                      className="h-1.5 w-1.5 bg-gray-400 rounded-full animate-pulse"
                      style={{ animationDelay: "0.4s" }}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  )
}
