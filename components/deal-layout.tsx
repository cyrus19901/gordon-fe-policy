"use client"

import type React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useDealState } from "@/lib/deal-context"
import { DealSidebar } from "./deal-sidebar"
import { DealHomeView } from "./deal-home-view"
import { DocumentsView } from "./documents-view"
import { ChatThreadView } from "./chat-thread-view"
import { TasksView } from "./tasks-view"
import { TaskView } from "./task-view"
import { WorkflowsView } from "./workflows-view"
import { WorkspacesView } from "./workspaces-view"
import { WorkflowPanel } from "./workflow-panel"
import { Notification } from "./notification"
import { EmailDraftCard } from "./email-draft-card"
import { PinAnimation } from "./pin-animation"
import { RunAnimation } from "./run-animation"
import { FullReportView } from "./full-report-view"
import { InsightAnimation } from "./insight-animation"
import { ContentLayout } from "./content-layout"
import { AddWorkflowToSectionModal } from "./add-workflow-to-section-modal"
import { CustomReportsView } from "./custom-reports-view"
import { ReportTemplateDetailView } from "./report-template-detail-view"
import { ApplyTemplateConfirmationModal } from "./apply-template-confirmation-modal"
import { CustomReportViewer } from "./custom-report-viewer"
import { ReportTemplateCustomizer } from "./report-template-customizer" // Added import
import { FloatingChatInput } from "./floating-chat-input" // Added import
import { WorkflowDetailView } from "./workflow-detail-view" // Added import

const viewVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
}

export function DealLayout({ deal, children }: { deal: any; children: React.ReactNode }) {
  const dealState = useDealState()

  const renderActiveView = () => {
    if (!dealState) return <DealHomeView deal={deal} />

    let viewKey = dealState.activeView
    if (dealState.activeView === "chat" && dealState.activeWorkspaceId) {
      viewKey = `chat-${dealState.activeWorkspaceId}`
    } else if (dealState.activeView === "custom-report-viewer" && dealState.activeCustomReportId) {
      viewKey = `custom-report-${dealState.activeCustomReportId}`
    }

    return (
      <AnimatePresence mode="wait">
        <motion.div key={viewKey} variants={viewVariants} initial="initial" animate="animate" exit="exit">
          {(() => {
            switch (dealState.activeView) {
              case "home":
                return <DealHomeView deal={deal} />
              case "workspaces":
                return <WorkspacesView />
              case "workflows":
                return <WorkflowsView />
              case "documents":
                return <DocumentsView />
              case "tasks":
                return <TasksView />
              case "task":
                return <TaskView />
              case "chat":
                return <ChatThreadView />
              case "full-report":
                return <FullReportView />
              case "report-customization":
                return (
                  <ContentLayout title="Customize Report" description="Add, remove, or reorder sections and workflows.">
                    <div className="max-w-4xl mx-auto">
                      <ReportTemplateCustomizer />
                    </div>
                  </ContentLayout>
                )
              case "custom-reports":
                return <CustomReportsView />
              case "report-template-detail":
                return <ReportTemplateDetailView />
              case "custom-report-viewer":
                return <CustomReportViewer />
              case "workflow-detail":
                return <WorkflowDetailView />
              default:
                return <DealHomeView deal={deal} />
            }
          })()}
        </motion.div>
      </AnimatePresence>
    )
  }

  return (
    <div className="flex h-screen text-foreground bg-neutral-200">
      <DealSidebar dealName={deal.name} />
      <div className="flex-1 flex">
        <main className="flex-1 flex flex-col overflow-y-auto relative my-3 mr-3 border shadow-lg bg-slate-50 rounded-lg mt-[11px] px-14">
          {renderActiveView()}
          <AnimatePresence>
            {dealState?.isWorkflowPanelOpen && <WorkflowPanel />}
            {dealState?.notification && <Notification notification={dealState.notification} />}
            {dealState?.pinAnimationState && <PinAnimation animationState={dealState.pinAnimationState} />}
            {dealState?.runAnimationState && <RunAnimation />}
            {dealState?.insightAnimationState && <InsightAnimation animationState={dealState.insightAnimationState} />}
            {dealState?.modal.type === "add_workflow_to_section_modal" && <AddWorkflowToSectionModal />}
            {dealState?.modal.type === "apply_template_confirmation" && <ApplyTemplateConfirmationModal />}
          </AnimatePresence>
          {dealState?.emailDraftRequest && (
            <div className="absolute inset-0 bg-black/30 z-40 flex items-center justify-center">
              <EmailDraftCard task={dealState.emailDraftRequest.task} />
            </div>
          )}
        </main>
      </div>
      <FloatingChatInput />
      {children}
    </div>
  )
}
