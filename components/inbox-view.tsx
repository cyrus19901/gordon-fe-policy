"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Mail,
  Search,
  Reply,
  Archive,
  Trash2,
  Phone,
  Calendar,
  InboxIcon,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Send,
  Star,
  MoreHorizontal,
} from "lucide-react"
import { useSavedDeals } from "@/lib/saved-deals-context"
import { cn } from "@/lib/utils"

const getSentimentColor = (sentiment?: string) => {
  if (sentiment === "positive") return "text-green-600"
  if (sentiment === "negative") return "text-red-600"
  return "text-gray-600"
}

const getSentimentIcon = (sentiment?: string) => {
  if (sentiment === "positive") return ThumbsUp
  if (sentiment === "negative") return ThumbsDown
  return Minus
}

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 1) return "Just now"
  if (diffInHours < 24) return `${diffInHours}h ago`
  if (diffInHours < 48) return "Yesterday"
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function InboxView() {
  const { state, dispatch } = useSavedDeals()
  const [selectedComm, setSelectedComm] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [replyText, setReplyText] = useState("")
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [filter, setFilter] = useState<"all" | "unread" | "archived">("all")

  const filteredCommunications = state.communications.filter((comm) => {
    const matchesSearch =
      comm.dealName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.preview.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.from.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter =
      filter === "all"
        ? comm.status !== "archived"
        : filter === "unread"
          ? comm.status === "unread"
          : comm.status === "archived"

    return matchesSearch && matchesFilter
  })

  const selectedCommunication = selectedComm ? state.communications.find((c) => c.id === selectedComm) : null

  const handleSelectCommunication = (commId: string) => {
    setSelectedComm(commId)
    const comm = state.communications.find((c) => c.id === commId)
    if (comm && comm.status === "unread") {
      dispatch({ type: "MARK_COMMUNICATION_READ", payload: commId })
    }
    setShowReplyBox(false)
    setReplyText("")
  }

  const handleArchive = (commId: string) => {
    dispatch({ type: "ARCHIVE_COMMUNICATION", payload: commId })
    if (selectedComm === commId) {
      setSelectedComm(null)
    }
  }

  const handleSendReply = () => {
    if (!replyText.trim() || !selectedCommunication) return
    // In a real app, this would send the reply
    setReplyText("")
    setShowReplyBox(false)
  }

  const unreadCount = state.communications.filter((c) => c.status === "unread").length

  return (
    <div className="flex h-[calc(100vh-180px)] w-full border border-border rounded-xl overflow-hidden bg-background">
      <div className="w-96 border-r border-border flex flex-col bg-muted/10">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <InboxIcon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Inbox</h3>
                {unreadCount > 0 && <p className="text-xs text-muted-foreground">{unreadCount} unread</p>}
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 bg-background border-border"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1">
            <Button
              variant={filter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("all")}
              className="h-7 px-3 text-xs flex-1"
            >
              All
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("unread")}
              className="h-7 px-3 text-xs flex-1"
            >
              Unread
              {unreadCount > 0 && (
                <Badge className="ml-1.5 h-4 px-1.5 text-[10px] bg-primary/20 text-primary border-0">
                  {unreadCount}
                </Badge>
              )}
            </Button>
            <Button
              variant={filter === "archived" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("archived")}
              className="h-7 px-3 text-xs flex-1"
            >
              Archived
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredCommunications.length > 0 ? (
            <div className="p-2">
              <AnimatePresence>
                {filteredCommunications.map((comm, index) => {
                  const SentimentIcon = getSentimentIcon(comm.sentiment)
                  return (
                    <motion.div
                      key={comm.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.02 }}
                      onClick={() => handleSelectCommunication(comm.id)}
                      className={cn(
                        "p-3 rounded-lg cursor-pointer transition-all mb-1 border",
                        selectedComm === comm.id
                          ? "bg-primary/5 border-primary/30 shadow-sm"
                          : "bg-background/60 border-transparent hover:bg-muted/50 hover:border-border",
                        comm.status === "unread" && "bg-primary/[0.02]",
                      )}
                    >
                      <div className="flex items-start gap-3">
                        {/* Type Icon */}
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                            comm.type === "email" && "bg-blue-50 text-blue-600",
                            comm.type === "call" && "bg-green-50 text-green-600",
                            comm.type === "meeting" && "bg-purple-50 text-purple-600",
                            comm.type === "message" && "bg-orange-50 text-orange-600",
                          )}
                        >
                          {comm.type === "email" && <Mail className="h-4 w-4" />}
                          {comm.type === "call" && <Phone className="h-4 w-4" />}
                          {comm.type === "meeting" && <Calendar className="h-4 w-4" />}
                          {comm.type === "message" && <Mail className="h-4 w-4" />}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <h4
                                className={cn(
                                  "text-sm truncate",
                                  comm.status === "unread" ? "font-semibold" : "font-medium text-muted-foreground",
                                )}
                              >
                                {comm.dealName}
                              </h4>
                              {comm.status === "unread" && <div className="w-2 h-2 bg-primary rounded-full" />}
                            </div>
                            <SentimentIcon className={cn("h-3 w-3 flex-shrink-0", getSentimentColor(comm.sentiment))} />
                          </div>

                          {comm.subject && (
                            <p
                              className={cn(
                                "text-xs mb-1 truncate",
                                comm.status === "unread" ? "font-medium" : "text-muted-foreground",
                              )}
                            >
                              {comm.subject}
                            </p>
                          )}

                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{comm.preview}</p>

                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">{formatTimestamp(comm.timestamp)}</span>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "text-[10px] h-4 px-1.5",
                                comm.direction === "inbound" && "bg-green-50 text-green-700 border-green-200",
                                comm.direction === "outbound" && "bg-blue-50 text-blue-700 border-blue-200",
                              )}
                            >
                              {comm.direction === "inbound" ? "In" : "Out"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center p-8">
                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center mx-auto mb-3">
                  <InboxIcon className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium mb-1">No messages</h3>
                <p className="text-xs text-muted-foreground">
                  {filter === "unread" ? "All caught up!" : "No communications to display"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {selectedCommunication ? (
          <>
            {/* Message Header */}
            <div className="p-5 border-b border-border">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        selectedCommunication.type === "email" && "bg-blue-50 text-blue-700 border-blue-200",
                        selectedCommunication.type === "call" && "bg-green-50 text-green-700 border-green-200",
                        selectedCommunication.type === "meeting" && "bg-purple-50 text-purple-700 border-purple-200",
                        selectedCommunication.type === "message" && "bg-orange-50 text-orange-700 border-orange-200",
                      )}
                    >
                      {selectedCommunication.type}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-xs",
                        selectedCommunication.direction === "inbound" && "bg-green-50 text-green-700 border-green-200",
                        selectedCommunication.direction === "outbound" && "bg-blue-50 text-blue-700 border-blue-200",
                      )}
                    >
                      {selectedCommunication.direction}
                    </Badge>
                  </div>
                  <h2 className="text-lg font-semibold mb-1">
                    {selectedCommunication.subject || selectedCommunication.dealName}
                  </h2>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{selectedCommunication.from}</span>
                    <span>•</span>
                    <span>{formatTimestamp(selectedCommunication.timestamp)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Star className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => handleArchive(selectedCommunication.id)}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Message Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-3xl mx-auto">
                <div className="rounded-xl border border-border bg-muted/20 p-5 mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">
                        {selectedCommunication.from.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{selectedCommunication.from}</p>
                      <p className="text-xs text-muted-foreground">to {selectedCommunication.to}</p>
                    </div>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {selectedCommunication.fullContent || selectedCommunication.preview}
                  </div>
                </div>

                {/* Deal Context */}
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-primary/10 rounded-md flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary">
                        {selectedCommunication.dealName.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold">Related Deal</h4>
                  </div>
                  <p className="text-sm font-medium mb-3">{selectedCommunication.dealName}</p>
                  <Button variant="outline" size="sm" className="h-7 text-xs bg-transparent">
                    View Deal Details
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-border">
              <AnimatePresence mode="wait">
                {showReplyBox ? (
                  <motion.div
                    key="reply-box"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-3"
                  >
                    <Textarea
                      placeholder="Write your reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="min-h-28 resize-none"
                      autoFocus
                    />
                    <div className="flex items-center justify-between">
                      <Button variant="outline" size="sm" onClick={() => setShowReplyBox(false)}>
                        Cancel
                      </Button>
                      <Button size="sm" disabled={!replyText.trim()} onClick={handleSendReply}>
                        <Send className="h-4 w-4 mr-2" />
                        Send Reply
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="action-buttons"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Button size="sm" onClick={() => setShowReplyBox(true)}>
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleArchive(selectedCommunication.id)}>
                      <Archive className="h-4 w-4 mr-2" />
                      Archive
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Select a message</h3>
              <p className="text-sm text-muted-foreground">Choose a communication to view details and reply</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
