"use client"

import type React from "react"
import { createContext, useContext, useReducer, type ReactNode } from "react"

export interface InboxMessage {
  id: string
  threadId: string
  from: string
  fromEmail: string
  subject: string
  preview: string
  fullContent?: string
  timestamp: string
  isRead: boolean
  isStarred: boolean
  dealName: string | null
  dealId?: string
  type: "outreach" | "response" | "alert" | "followup" | "summary"
  avatar?: string
  attachments?: Array<{ name: string; url: string; type: string }>
}

export interface InboxThread {
  id: string
  dealName: string
  dealId?: string
  subject: string
  participants: string[]
  lastMessage: InboxMessage
  messageCount: number
  isRead: boolean
  isStarred: boolean
  createdAt: string
  updatedAt: string
}

interface InboxState {
  messages: InboxMessage[]
  threads: InboxThread[]
  selectedThread: string | null
  selectedMessage: string | null
}

type InboxAction =
  | { type: "ADD_OUTREACH_THREAD"; payload: { deal: any; outreachContent: string } }
  | { type: "ADD_RESPONSE_MESSAGE"; payload: { threadId: string; message: Omit<InboxMessage, "id"> } }
  | { type: "TOGGLE_READ"; payload: { messageId: string } }
  | { type: "TOGGLE_STAR"; payload: { messageId: string } }
  | { type: "TOGGLE_THREAD_STAR"; payload: { threadId: string } }
  | { type: "SELECT_THREAD"; payload: { threadId: string | null } }
  | { type: "SELECT_MESSAGE"; payload: { messageId: string | null } }
  | { type: "MARK_THREAD_READ"; payload: { threadId: string } }

const initialMessages: InboxMessage[] = [
  {
    id: "msg-1",
    threadId: "thread-1",
    from: "Sarah Johnson",
    fromEmail: "sarah@techflow.com",
    subject: "Re: TechFlow Solutions - Initial Interest",
    preview: "Thank you for reaching out about our company. We'd be happy to discuss potential opportunities...",
    fullContent:
      "Thank you for reaching out about our company. We'd be happy to discuss potential opportunities with your firm. Our team has been impressed by your portfolio and investment approach.\n\nWe're currently in a growth phase and would welcome a conversation about how we might work together. Would you be available for a call next week to discuss this further?\n\nBest regards,\nSarah Johnson\nCEO, TechFlow Solutions",
    timestamp: "2 hours ago",
    isRead: false,
    isStarred: true,
    dealName: "TechFlow Solutions",
    dealId: "techflow-solutions",
    type: "response",
    avatar: "/placeholder.svg?width=32&height=32",
  },
  {
    id: "msg-2",
    threadId: "thread-2",
    from: "Gordon AI",
    fromEmail: "ai@gordon.com",
    subject: "Deal Alert: New Healthcare Opportunity",
    preview: "We found a new healthcare analytics company that matches your investment criteria...",
    fullContent:
      "We found a new healthcare analytics company that matches your investment criteria. HealthCare Analytics Co has shown strong growth metrics and operates in your target market.\n\nKey highlights:\n- Revenue: $45M ARR\n- Growth: 85% YoY\n- Market: Healthcare Analytics\n- Location: Austin, TX\n\nWould you like me to initiate contact with this company?",
    timestamp: "4 hours ago",
    isRead: true,
    isStarred: false,
    dealName: "HealthCare Analytics Co",
    type: "alert",
    avatar: "/glogo.svg",
  },
  {
    id: "msg-3",
    threadId: "thread-3",
    from: "Mike Davis",
    fromEmail: "mike@greentech.com",
    subject: "GreenTech Manufacturing - Due Diligence Request",
    preview:
      "Following up on our conversation last week. We're ready to move forward with the due diligence process...",
    fullContent:
      "Following up on our conversation last week. We're ready to move forward with the due diligence process and have prepared the requested financial documents.\n\nAttached you'll find:\n- 3-year financial statements\n- Management presentation\n- Customer concentration analysis\n\nPlease let me know if you need any additional information.",
    timestamp: "1 day ago",
    isRead: true,
    isStarred: false,
    dealName: "GreenTech Manufacturing",
    dealId: "greentech-manufacturing",
    type: "followup",
    avatar: "/placeholder.svg?width=32&height=32",
    attachments: [
      { name: "Financial_Statements_2024.pdf", url: "#", type: "pdf" },
      { name: "Management_Presentation.pptx", url: "#", type: "presentation" },
      { name: "Customer_Analysis.xlsx", url: "#", type: "spreadsheet" },
    ],
  },
]

const initialState: InboxState = {
  messages: initialMessages,
  threads: [],
  selectedThread: null,
  selectedMessage: null,
}

// Generate threads from messages
const generateThreadsFromMessages = (messages: InboxMessage[]): InboxThread[] => {
  const threadMap = new Map<string, InboxThread>()

  messages.forEach((message) => {
    if (!threadMap.has(message.threadId)) {
      threadMap.set(message.threadId, {
        id: message.threadId,
        dealName: message.dealName || "Unknown Deal",
        dealId: message.dealId,
        subject: message.subject.replace(/^Re:\s*/, ""),
        participants: [message.from],
        lastMessage: message,
        messageCount: 1,
        isRead: message.isRead,
        isStarred: message.isStarred,
        createdAt: message.timestamp,
        updatedAt: message.timestamp,
      })
    } else {
      const thread = threadMap.get(message.threadId)!
      thread.messageCount++
      thread.lastMessage = message
      thread.updatedAt = message.timestamp
      if (!thread.participants.includes(message.from)) {
        thread.participants.push(message.from)
      }
      if (!message.isRead) {
        thread.isRead = false
      }
    }
  })

  return Array.from(threadMap.values()).sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  )
}

initialState.threads = generateThreadsFromMessages(initialMessages)

function inboxReducer(state: InboxState, action: InboxAction): InboxState {
  switch (action.type) {
    case "ADD_OUTREACH_THREAD": {
      const { deal, outreachContent } = action.payload
      const threadId = `thread-${Date.now()}`
      const messageId = `msg-${Date.now()}`

      const outreachMessage: InboxMessage = {
        id: messageId,
        threadId,
        from: "You",
        fromEmail: "you@yourfirm.com",
        subject: `Investment Partnership Opportunity - ${deal.name}`,
        preview: outreachContent.substring(0, 100) + "...",
        fullContent: outreachContent,
        timestamp: "Just now",
        isRead: true,
        isStarred: false,
        dealName: deal.name,
        dealId: deal.id,
        type: "outreach",
        avatar: "/placeholder.svg?width=32&height=32",
      }

      const newThread: InboxThread = {
        id: threadId,
        dealName: deal.name,
        dealId: deal.id,
        subject: `Investment Partnership Opportunity - ${deal.name}`,
        participants: ["You"],
        lastMessage: outreachMessage,
        messageCount: 1,
        isRead: true,
        isStarred: false,
        createdAt: "Just now",
        updatedAt: "Just now",
      }

      return {
        ...state,
        messages: [outreachMessage, ...state.messages],
        threads: [newThread, ...state.threads],
      }
    }

    case "ADD_RESPONSE_MESSAGE": {
      const { threadId, message } = action.payload
      const messageId = `msg-${Date.now()}`

      const newMessage: InboxMessage = {
        ...message,
        id: messageId,
        threadId,
      }

      const updatedThreads = state.threads
        .map((thread) => {
          if (thread.id === threadId) {
            return {
              ...thread,
              lastMessage: newMessage,
              messageCount: thread.messageCount + 1,
              updatedAt: newMessage.timestamp,
              isRead: newMessage.isRead,
              participants: thread.participants.includes(newMessage.from)
                ? thread.participants
                : [...thread.participants, newMessage.from],
            }
          }
          return thread
        })
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

      return {
        ...state,
        messages: [newMessage, ...state.messages],
        threads: updatedThreads,
      }
    }

    case "TOGGLE_READ": {
      const updatedMessages = state.messages.map((msg) =>
        msg.id === action.payload.messageId ? { ...msg, isRead: !msg.isRead } : msg,
      )

      const updatedThreads = state.threads.map((thread) => {
        const threadMessages = updatedMessages.filter((msg) => msg.threadId === thread.id)
        const hasUnread = threadMessages.some((msg) => !msg.isRead)
        return { ...thread, isRead: !hasUnread }
      })

      return {
        ...state,
        messages: updatedMessages,
        threads: updatedThreads,
      }
    }

    case "TOGGLE_STAR": {
      const updatedMessages = state.messages.map((msg) =>
        msg.id === action.payload.messageId ? { ...msg, isStarred: !msg.isStarred } : msg,
      )

      return {
        ...state,
        messages: updatedMessages,
      }
    }

    case "TOGGLE_THREAD_STAR": {
      const updatedThreads = state.threads.map((thread) =>
        thread.id === action.payload.threadId ? { ...thread, isStarred: !thread.isStarred } : thread,
      )

      return {
        ...state,
        threads: updatedThreads,
      }
    }

    case "SELECT_THREAD": {
      return {
        ...state,
        selectedThread: action.payload.threadId,
        selectedMessage: null,
      }
    }

    case "SELECT_MESSAGE": {
      return {
        ...state,
        selectedMessage: action.payload.messageId,
      }
    }

    case "MARK_THREAD_READ": {
      const updatedMessages = state.messages.map((msg) =>
        msg.threadId === action.payload.threadId ? { ...msg, isRead: true } : msg,
      )

      const updatedThreads = state.threads.map((thread) =>
        thread.id === action.payload.threadId ? { ...thread, isRead: true } : thread,
      )

      return {
        ...state,
        messages: updatedMessages,
        threads: updatedThreads,
      }
    }

    default:
      return state
  }
}

const InboxContext = createContext<{
  state: InboxState
  dispatch: React.Dispatch<InboxAction>
} | null>(null)

export function InboxProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(inboxReducer, initialState)

  return <InboxContext.Provider value={{ state, dispatch }}>{children}</InboxContext.Provider>
}

export function useInbox() {
  const context = useContext(InboxContext)
  if (!context) {
    throw new Error("useInbox must be used within an InboxProvider")
  }
  return context
}

export function useInboxDispatch() {
  const context = useContext(InboxContext)
  if (!context) {
    throw new Error("useInboxDispatch must be used within an InboxProvider")
  }
  return context.dispatch
}
