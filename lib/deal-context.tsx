"use client"

import { createContext, useContext, useReducer, type ReactNode, type Dispatch } from "react"
import { REPORT_TEMPLATE, type ReportTemplate as FullReportTemplateType } from "./report-template"
import type { ReportTemplate } from "./report-templates"
import { workflowDefinitions } from "./workflows"
import { produce } from "immer"

// --- TYPES ---

export interface ChatMessage {
  id: number
  role: "user" | "ai"
  content: string
  type: "text" | "chart" | "table" | "chart_placeholder" | "pipeline"
  component?: "EbitdaChart" | "QoeTable" | "CohortChart" | "RiskRadarChart"
  steps?: { id: string; text: string; status: "pending" | "in-progress" | "completed" }[]
  insight?: string
}

interface Task {
  id: number | string
  title: string
  status: string
  icon: string
  requiredInput?: string
}

interface Workspace {
  id: string
  title: string
  messages: ChatMessage[]
  status: "running" | "completed" | "idle"
  workflowId?: string
}

interface Notification {
  id: string
  message: string
  type: "success" | "error" | "info"
}

interface PinAnimationState {
  x: number
  y: number
  title: string
}

interface RunAnimationState {
  item: any
  sourceRect: DOMRect
  targetRect: DOMRect
}

interface InsightAnimationState {
  x: number
  y: number
  insights: string[]
}

interface EmailDraftRequest {
  requiredInput: string
  task: any
}

interface ModalState {
  type: "add_workflow_to_section_modal" | "apply_template_confirmation" | null
  config?: any
}

interface CustomReport {
  id: string
  title: string
  template: ReportTemplate
  completedSections: Set<string>
  runningSections: Set<string>
}

export interface DealState {
  activeView: string
  activeWorkspaceId: string | null
  workspaces: Workspace[]
  isWorkflowPanelOpen: boolean
  workflowPanelContent: any | null
  notification: Notification | null
  pinAnimationState: PinAnimationState | null
  runAnimationState: RunAnimationState | null
  insightAnimationState: InsightAnimationState | null
  emailDraftRequest: EmailDraftRequest | null
  reportTemplate: FullReportTemplateType | null
  modal: ModalState
  viewingReportTemplate: ReportTemplate | null
  customReports: CustomReport[]
  activeCustomReportId: string | null
  tasks: Task[]
  activeTask: Task | null
  pendingInfoRequests: string[]
  resolvedInputs: string[]
  chatMessages: ChatMessage[]
  unlockedWorkflows: string[]
  newlyCompletedWorkflows: string[]
  completedReportSections: string[]
  isInsightsPanelOpen: boolean
  scrollToSection?: string
  activeWorkflowId: string | null
}

type Action =
  | { type: "SET_ACTIVE_VIEW"; payload: string }
  | { type: "SET_ACTIVE_WORKSPACE"; payload: { workspaceId: string } }
  | { type: "TOGGLE_WORKFLOW_PANEL"; payload?: any }
  | { type: "SHOW_NOTIFICATION"; payload: Omit<Notification, "id"> }
  | { type: "HIDE_NOTIFICATION" }
  | { type: "SHOW_PIN_ANIMATION"; payload: PinAnimationState }
  | { type: "HIDE_PIN_ANIMATION" }
  | { type: "TRIGGER_RUN_ANIMATION"; payload: RunAnimationState }
  | { type: "CLEAR_RUN_ANIMATION" }
  | { type: "SHOW_INSIGHT_ANIMATION"; payload: InsightAnimationState }
  | { type: "HIDE_INSIGHT_ANIMATION" }
  | { type: "SHOW_EMAIL_DRAFT"; payload: { requiredInput: string } }
  | { type: "DISMISS_EMAIL_DRAFT" }
  | { type: "SCROLL_TO_SECTION"; payload: string }
  | { type: "UPDATE_REPORT_TEMPLATE"; payload: FullReportTemplateType }
  | { type: "OPEN_MODAL"; payload: ModalState }
  | { type: "CLOSE_MODAL" }
  | { type: "VIEW_REPORT_TEMPLATE"; payload: ReportTemplate }
  | { type: "CREATE_CUSTOM_REPORT"; payload: ReportTemplate }
  | { type: "SET_ACTIVE_CUSTOM_REPORT"; payload: string }
  | { type: "EXIT_CUSTOM_REPORT_VIEW" }
  | { type: "START_CUSTOM_REPORT_WORKFLOWS"; payload: { reportId: string; sectionId: string } }
  | { type: "COMPLETE_CUSTOM_REPORT_SECTION"; payload: { reportId: string; sectionId: string } }
  | { type: "CREATE_TASK"; payload: Task }
  | { type: "EMAIL_SENT"; payload: { taskId: any; requiredInput: string } }
  | { type: "VIEW_TASK"; payload: Task }
  | {
      type: "START_CHAT_THREAD"
      payload: { initialMessage: string; workflowTitle?: string | null; workflowId?: string }
    }
  | { type: "START_NEW_CHAT_THREAD" }
  | { type: "ADD_CHAT_MESSAGE"; payload: Omit<ChatMessage, "id"> }
  | { type: "ADD_WORKSPACE_MESSAGE"; payload: { workspaceId: string; message: Omit<ChatMessage, "id"> } }
  | {
      type: "APPEND_WORKSPACE_MESSAGES"
      payload: { workspaceId: string; messages: Omit<ChatMessage, "id">[] }
    }
  | {
      type: "UPDATE_PIPELINE_STATUS"
      payload: { workspaceId: string; messageId: number; stepId: string; status: "completed" }
    }
  | { type: "START_WORKFLOW"; payload: { id: string; clientWorkspaceId?: string } }
  | { type: "START_WORKFLOW_WITHOUT_NAVIGATION"; payload: { id: string; clientWorkspaceId?: string } }
  | { type: "COMPLETE_WORKFLOW"; payload: { workflowId: string; title: string } }
  | { type: "COMPLETE_WORKSPACE_RUN"; payload: { workspaceId: string } }
  | { type: "COMPLETE_REPORT_SECTION"; payload: string }
  | { type: "TOGGLE_INSIGHTS_PANEL" }
  | { type: "SET_REPORT_TEMPLATE"; payload: FullReportTemplateType }
  | { type: "CLEAR_SCROLL_REQUEST" }
  | { type: "VIEW_WORKFLOW_DETAIL"; payload: string }
  | { type: "EXIT_WORKFLOW_DETAIL" }
  | { type: "START_CHAT_WITH_WORKFLOWS" }

// --- INITIAL STATE ---

const initialState: DealState = {
  activeView: "home",
  activeWorkspaceId: null,
  workspaces: [],
  isWorkflowPanelOpen: false,
  workflowPanelContent: null,
  notification: null,
  pinAnimationState: null,
  runAnimationState: null,
  insightAnimationState: null,
  emailDraftRequest: null,
  reportTemplate: REPORT_TEMPLATE,
  modal: { type: null },
  viewingReportTemplate: null,
  customReports: [],
  activeCustomReportId: null,
  tasks: [
    {
      id: 1,
      title: "Review new cybersecurity audit",
      status: "To Do",
      icon: "Search",
      requiredInput: "Cybersecurity Audit Report",
    },
    {
      id: 2,
      title: "Verify Q3 revenue recognition",
      status: "In Progress",
      icon: "FileCheck",
      requiredInput: "Q3 2023 P&L Statement",
    },
  ],
  activeTask: null,
  pendingInfoRequests: [],
  resolvedInputs: [],
  chatMessages: [],
  unlockedWorkflows: [],
  newlyCompletedWorkflows: [],
  completedReportSections: [],
  isInsightsPanelOpen: false,
  scrollToSection: undefined,
  activeWorkflowId: null,
}

// --- REDUCER ---

const aiResponses = [
  "Interesting. Could you elaborate on the financial implications of that?",
  "I've cross-referenced that with the latest 10-K filing. There seems to be a discrepancy. Should I investigate?",
  "Understood. I'm now analyzing the market trends related to this point.",
  "That's a valid point. I've updated the risk assessment model to reflect this.",
  "Based on that, I've identified three potential synergy opportunities. Would you like me to detail them?",
]

const dealReducer = (state: DealState, action: Action): DealState => {
  return produce(state, (draft) => {
    switch (action.type) {
      case "SET_ACTIVE_VIEW":
        draft.activeView = action.payload
        if (action.payload !== "chat") draft.activeWorkspaceId = null
        if (action.payload !== "custom-report-viewer") draft.activeCustomReportId = null
        if (action.payload !== "task") draft.activeTask = null
        break

      case "SET_ACTIVE_WORKSPACE":
        draft.activeView = "chat"
        draft.activeWorkspaceId = action.payload.workspaceId
        break

      case "START_NEW_CHAT_THREAD": {
        // Clear active workspace to show empty chat state with workflows
        draft.activeView = "chat"
        draft.activeWorkspaceId = null
        draft.chatMessages = []
        // Clear any workflow panel state to ensure clean start
        draft.isWorkflowPanelOpen = false
        draft.workflowPanelContent = null
        break
      }

      case "START_CHAT_WITH_WORKFLOWS": {
        // This creates the actual workspace when user sends a message
        const newWorkspace: Workspace = {
          id: `ws_${Date.now()}`,
          title: "New Chat",
          messages: [],
          status: "idle",
        }

        draft.workspaces.unshift(newWorkspace)
        draft.activeView = "chat"
        draft.activeWorkspaceId = newWorkspace.id
        draft.chatMessages = newWorkspace.messages
        break
      }

      case "TOGGLE_WORKFLOW_PANEL":
        draft.isWorkflowPanelOpen = !draft.isWorkflowPanelOpen
        draft.workflowPanelContent = action.payload || null
        break

      case "SHOW_NOTIFICATION":
        draft.notification = { ...action.payload, id: new Date().toISOString() }
        break

      case "HIDE_NOTIFICATION":
        draft.notification = null
        break

      case "SHOW_PIN_ANIMATION":
        draft.pinAnimationState = action.payload
        break

      case "HIDE_PIN_ANIMATION":
        draft.pinAnimationState = null
        break

      case "TRIGGER_RUN_ANIMATION":
        draft.runAnimationState = action.payload
        break

      case "CLEAR_RUN_ANIMATION":
        draft.runAnimationState = null
        break

      case "SHOW_INSIGHT_ANIMATION":
        draft.insightAnimationState = action.payload
        break

      case "HIDE_INSIGHT_ANIMATION":
        draft.insightAnimationState = null
        break

      case "SHOW_EMAIL_DRAFT": {
        const { requiredInput } = action.payload
        const tempTask = {
          id: `temp_${Date.now()}`,
          title: `Request ${requiredInput} from client`,
          requiredInput: requiredInput,
          status: "Draft",
          icon: "Mail",
        }
        draft.emailDraftRequest = { requiredInput, task: tempTask }
        break
      }

      case "DISMISS_EMAIL_DRAFT":
        draft.emailDraftRequest = null
        break

      case "SCROLL_TO_SECTION":
        draft.scrollToSection = action.payload
        break

      case "UPDATE_REPORT_TEMPLATE":
        draft.reportTemplate = action.payload
        break

      case "OPEN_MODAL":
        draft.modal = action.payload
        break

      case "CLOSE_MODAL":
        draft.modal = { type: null }
        break

      case "VIEW_REPORT_TEMPLATE":
        draft.viewingReportTemplate = action.payload
        draft.activeView = "report-template-detail"
        break

      case "CREATE_CUSTOM_REPORT":
        const newReport: CustomReport = {
          id: `cr-${new Date().getTime()}`,
          title: action.payload.title,
          template: action.payload,
          completedSections: new Set(),
          runningSections: new Set(),
        }
        draft.customReports.push(newReport)
        draft.activeCustomReportId = newReport.id
        draft.activeView = "custom-report-viewer"
        break

      case "SET_ACTIVE_CUSTOM_REPORT":
        draft.activeCustomReportId = action.payload
        draft.activeView = "custom-report-viewer"
        break

      case "EXIT_CUSTOM_REPORT_VIEW":
        draft.activeCustomReportId = null
        draft.activeView = "custom-reports"
        break

      case "START_CUSTOM_REPORT_WORKFLOWS": {
        const { reportId, sectionId } = action.payload
        const report = draft.customReports.find((r) => r.id === reportId)
        if (report) {
          report.runningSections.add(sectionId)
        }
        break
      }

      case "COMPLETE_CUSTOM_REPORT_SECTION": {
        const { reportId, sectionId } = action.payload
        const report = draft.customReports.find((r) => r.id === reportId)
        if (report) {
          report.runningSections.delete(sectionId)
          report.completedSections.add(sectionId)
        }
        break
      }

      case "CREATE_TASK":
        draft.tasks.unshift(action.payload)
        break

      case "EMAIL_SENT": {
        const { taskId, requiredInput } = action.payload
        const isTempTask = typeof taskId === "string" && taskId.startsWith("temp_")

        if (isTempTask) {
          const taskFromDraft = draft.emailDraftRequest?.task
          if (taskFromDraft) {
            draft.tasks.unshift({ ...taskFromDraft, id: draft.tasks.length + 1, status: "Pending Reply" })
          }
        } else {
          const task = draft.tasks.find((t) => t.id === taskId)
          if (task) {
            task.status = "Pending Reply"
          }
        }

        if (!draft.resolvedInputs.includes(requiredInput)) {
          draft.resolvedInputs.push(requiredInput)
        }
        if (!draft.pendingInfoRequests.includes(requiredInput)) {
          draft.pendingInfoRequests.push(requiredInput)
        }
        draft.emailDraftRequest = null
        break
      }

      case "VIEW_TASK":
        draft.activeView = "task"
        draft.activeTask = action.payload
        draft.activeWorkspaceId = null
        break

      case "START_CHAT_THREAD": {
        const { initialMessage, workflowTitle, workflowId } = action.payload
        const newWorkspace: Workspace = {
          id: `ws_${Date.now()}`,
          title: workflowTitle || `Chat: "${initialMessage.substring(0, 25)}..."`,
          messages: [{ id: 1, role: "user", content: initialMessage, type: "text" }],
          workflowId: workflowId,
          status: workflowId ? "running" : "idle",
        }

        draft.workspaces.unshift(newWorkspace)
        draft.activeView = "chat"
        draft.activeWorkspaceId = newWorkspace.id
        draft.chatMessages = newWorkspace.messages
        break
      }

      case "ADD_CHAT_MESSAGE": {
        const { activeWorkspaceId } = draft
        if (!activeWorkspaceId) break

        const workspace = draft.workspaces.find((ws) => ws.id === activeWorkspaceId)
        if (!workspace) break

        const userMessage: ChatMessage = {
          ...action.payload,
          id: workspace.messages.length + 1,
        }
        workspace.messages.push(userMessage)

        const aiResponse: ChatMessage = {
          id: workspace.messages.length + 1,
          role: "ai",
          content: aiResponses[Math.floor(Math.random() * aiResponses.length)],
          type: "text",
        }
        workspace.messages.push(aiResponse)

        draft.chatMessages = workspace.messages
        break
      }

      case "ADD_WORKSPACE_MESSAGE": {
        const { workspaceId, message } = action.payload
        const workspace = draft.workspaces.find((ws) => ws.id === workspaceId)
        if (!workspace) break

        const newMessage = { ...message, id: workspace.messages.length + 1 }
        workspace.messages.push(newMessage as ChatMessage)

        if (draft.activeWorkspaceId === workspaceId) {
          draft.chatMessages = workspace.messages
        }
        break
      }

      case "APPEND_WORKSPACE_MESSAGES": {
        const { workspaceId, messages } = action.payload
        const workspace = draft.workspaces.find((ws) => ws.id === workspaceId)
        if (!workspace) break
        messages.forEach((m) => {
          const msgId = (workspace.messages?.length ?? 0) + 1
          workspace.messages.push({ ...(m as any), id: msgId })
        })
        if (draft.activeWorkspaceId === workspaceId) {
          draft.chatMessages = workspace.messages
        }
        break
      }

      case "UPDATE_PIPELINE_STATUS": {
        const { workspaceId, messageId, stepId, status } = action.payload
        const workspace = draft.workspaces.find((ws) => ws.id === workspaceId)
        if (!workspace) break

        const message = workspace.messages.find((msg) => msg.id === messageId)
        if (message?.type === "pipeline" && message.steps) {
          const step = message.steps.find((s) => s.id === stepId)
          if (step) {
            step.status = status
          }
        }

        if (draft.activeWorkspaceId === workspaceId) {
          draft.chatMessages = workspace.messages
        }
        break
      }

      case "START_WORKFLOW": {
        const { id, clientWorkspaceId } = action.payload
        const workflow = Object.values(workflowDefinitions).find((w) => w.id === id)
        if (!workflow) break

        const pipelineSteps = workflow.steps.map((step: any) => ({
          id: step.id,
          text: step.text,
          status: "pending",
        }))

        const newWorkspace: Workspace = {
          id: clientWorkspaceId ?? `ws_${Date.now()}`,
          title: workflow.title,
          messages: [
            {
              id: 1,
              role: "ai",
              content: `Running ${workflow.title} workflow...`,
              type: "pipeline",
              steps: pipelineSteps,
            },
          ],
          status: "running",
          workflowId: id,
        }

        draft.workspaces.unshift(newWorkspace)
        draft.activeView = "chat"
        draft.activeWorkspaceId = newWorkspace.id
        draft.chatMessages = newWorkspace.messages
        break
      }

      case "START_WORKFLOW_WITHOUT_NAVIGATION": {
        const { id, clientWorkspaceId } = action.payload
        const workflow = Object.values(workflowDefinitions).find((w) => w.id === id)
        if (!workflow) break

        const pipelineSteps = workflow.steps.map((step: any) => ({
          id: step.id,
          text: step.text,
          status: "pending",
        }))

        const newWorkspace: Workspace = {
          id: clientWorkspaceId ?? `ws_${Date.now()}`,
          title: workflow.title,
          messages: [
            {
              id: 1,
              role: "ai",
              content: `Running ${workflow.title} workflow...`,
              type: "pipeline",
              steps: pipelineSteps,
            },
          ],
          status: "running",
          workflowId: id,
        }

        draft.workspaces.unshift(newWorkspace)
        // Don't change activeView or activeWorkspaceId to stay in workflows view
        break
      }

      case "COMPLETE_WORKFLOW": {
        const { workflowId, title } = action.payload
        if (!draft.unlockedWorkflows.includes(workflowId)) {
          draft.unlockedWorkflows.push(workflowId)
        }
        draft.newlyCompletedWorkflows.push(workflowId)
        draft.notification = {
          id: new Date().toISOString(),
          message: `${title} complete. Report updated.`,
          type: "success",
        }
        break
      }

      case "COMPLETE_WORKSPACE_RUN": {
        const { workspaceId } = action.payload
        const workspace = draft.workspaces.find((ws) => ws.id === workspaceId)
        if (workspace) {
          workspace.status = "completed"
        }
        break
      }

      case "COMPLETE_REPORT_SECTION":
        if (!draft.completedReportSections.includes(action.payload)) {
          draft.completedReportSections.push(action.payload)
        }
        break

      case "TOGGLE_INSIGHTS_PANEL":
        draft.isInsightsPanelOpen = !draft.isInsightsPanelOpen
        break

      case "SET_REPORT_TEMPLATE":
        draft.reportTemplate = action.payload
        break

      case "CLEAR_SCROLL_REQUEST":
        draft.scrollToSection = undefined
        break

      case "VIEW_WORKFLOW_DETAIL":
        draft.activeView = "workflow-detail"
        draft.activeWorkflowId = action.payload
        break

      case "EXIT_WORKFLOW_DETAIL":
        draft.activeView = "workflows"
        draft.activeWorkflowId = null
        break

      default:
        break
    }
  })
}

// --- CONTEXT & PROVIDER ---

const DealStateContext = createContext<DealState | undefined>(undefined)
const DealDispatchContext = createContext<Dispatch<Action> | undefined>(undefined)

export const DealProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(dealReducer, initialState)

  return (
    <DealStateContext.Provider value={state}>
      <DealDispatchContext.Provider value={dispatch}>{children}</DealDispatchContext.Provider>
    </DealStateContext.Provider>
  )
}

// --- HOOKS ---

export const useDealState = () => {
  return useContext(DealStateContext)
}

export const useDealDispatch = () => {
  return useContext(DealDispatchContext)
}
