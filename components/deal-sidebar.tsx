"use client"

import { useState } from "react"
import {
  Home,
  FileText,
  CheckSquare,
  ClipboardList,
  Plus,
  ChevronDown,
  Users,
  MessageSquare,
  Loader2,
  ChevronLeft,
  Settings,
  LayoutTemplate,
  FileClock,
  ArrowLeft,
  Menu,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useDealState, useDealDispatch } from "@/lib/deal-context"
import Image from "next/image"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { ScrollArea } from "@/components/ui/scroll-area"
import { REPORT_TEMPLATE } from "@/lib/report-template"
import { useRouter } from "next/navigation"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"

export function DealSidebar({ dealName }: { dealName: string }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activeMode, setActiveMode] = useState<"analyse" | "report">("analyse")
  const dealState = useDealState()
  const dispatch = useDealDispatch()
  const [selectedReportSection, setSelectedReportSection] = useState("")

  const reportSections = dealState?.reportTemplate?.sections || REPORT_TEMPLATE.sections

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "workflows", label: "Workflows", icon: ClipboardList },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "tasks", label: "Tasks", icon: CheckSquare },
  ]

  const isActive = (itemId: string) => {
    if (itemId === "workspaces") {
      return dealState?.activeView === "workspaces"
    }
    return dealState?.activeView === itemId && !dealState.activeWorkspaceId
  }

  const handleNewWorkspace = () => {
    dispatch?.({ type: "SET_ACTIVE_VIEW", payload: "chat" })
  }

  const router = useRouter()

  // Reusable inner content for both desktop sidebar and mobile drawer
  const SidebarInner = () => (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex h-[65px] flex-shrink-0 items-center border-b border-gray-300/50 px-3">
        {!isCollapsed ? (
          <button
            type="button"
            onClick={() => router.push("/")}
            className="group flex gap-3 overflow-hidden rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-gray-200 items-start"
            aria-label="Back to Home"
            title="Back to Home"
          >
            <div className="relative h-6 w-6 flex-shrink-0">
              <Image
                src="/logo.png"
                alt="Gordon AI Logo"
                width={24}
                height={24}
                className="rounded-md transition-opacity duration-150 group-hover:opacity-0"
              />
              <ArrowLeft className="absolute inset-0 m-auto h-4 w-4 text-gray-700 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
            </div>
            <div className="overflow-hidden">
              <h2 className="whitespace-nowrap text-gray-900 text-xs text-left font-medium">{dealName}</h2>
              <p className="whitespace-nowrap text-xs text-gray-500 text-left font-normal">Buy-Side</p>
            </div>
          </button>
        ) : (
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="group flex h-8 w-8 items-center justify-center rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-gray-200"
                  aria-label="Back to Home"
                >
                  <div className="relative h-6 w-6 flex-shrink-0">
                    <Image
                      src="/logo.png"
                      alt="Gordon AI Logo"
                      width={24}
                      height={24}
                      className="rounded-md transition-opacity duration-150 group-hover:opacity-0"
                    />
                    <ArrowLeft className="absolute inset-0 m-auto h-4 w-4 text-gray-700 opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{dealName}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Toggle */}
      {!isCollapsed && (
        <div className="p-3">
          <div className="flex items-center rounded-lg bg-gray-300/70 p-1">
            <Button
              variant={activeMode === "analyse" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 flex-1 text-xs"
              onClick={() => setActiveMode("analyse")}
            >
              Analyse
            </Button>
            <Button
              variant={activeMode === "report" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 flex-1 text-xs"
              onClick={() => setActiveMode("report")}
            >
              Report
            </Button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        <AnimatePresence mode="wait">
          {activeMode === "analyse" ? (
            <div key="analyse" className="h-full">
              <nav className="mb-8 flex flex-col gap-1 px-3">
                {navItems.map((item) => (
                  <TooltipProvider key={item.id} delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          className={cn(
                            "h-9 w-full justify-start gap-3 rounded-lg px-3 transition-colors",
                            isActive(item.id)
                              ? "bg-gray-100 text-black hover:bg-gray-200"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                            isCollapsed && "justify-center px-0",
                          )}
                          onClick={() => dispatch?.({ type: "SET_ACTIVE_VIEW", payload: item.id as any })}
                        >
                          <item.icon className="h-4 w-4 flex-shrink-0" />
                          {!isCollapsed && (
                            <span className="overflow-hidden whitespace-nowrap font-medium text-sm">{item.label}</span>
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{item.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </nav>
              {!isCollapsed && (
                <div id="sidebar-runs-section" className="mb-auto px-4 pl-6 pr-3">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="overflow-hidden whitespace-nowrap text-xs font-medium uppercase tracking-wider text-gray-500">
                      RUNS
                    </h3>
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn("h-6 w-6 p-0 text-gray-400 hover:text-gray-600")}
                            onClick={handleNewWorkspace}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <p>New Run</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="space-y-1">
                    {dealState?.workspaces &&
                      dealState.workspaces.map((workspace) => (
                        <TooltipProvider key={workspace.id} delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                className={cn(
                                  "h-8 w-full justify-start gap-3 rounded-lg px-3 text-xs transition-colors",
                                  dealState.activeWorkspaceId === workspace.id
                                    ? "bg-gray-100 text-black hover:bg-gray-200"
                                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                                )}
                                onClick={() =>
                                  dispatch?.({ type: "SET_ACTIVE_WORKSPACE", payload: { workspaceId: workspace.id } })
                                }
                              >
                                <div className="flex-shrink-0">
                                  {workspace.workflowId ? (
                                    <Users className="h-3 w-3" />
                                  ) : (
                                    <MessageSquare className="h-3 w-3" />
                                  )}
                                </div>
                                <span className="flex-1 overflow-hidden whitespace-nowrap text-left">
                                  {workspace.title}
                                </span>
                                {workspace.status === "running" && (
                                  <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-gray-400" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                              <p>{workspace.title}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div key="report" className="flex h-full flex-col">
              {!isCollapsed && (
                <div className="px-3 py-2">
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          className={cn(
                            "h-9 w-full justify-between rounded-lg bg-gray-100 px-3 font-medium text-gray-800 transition-colors hover:bg-gray-200/60",
                            dealState?.activeView === "full-report" && "bg-gray-200/60",
                          )}
                          onClick={() => {
                            dispatch?.({ type: "SET_ACTIVE_VIEW", payload: "full-report" })
                            setSelectedReportSection("")
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 flex-shrink-0" />
                            <span className="overflow-hidden whitespace-nowrap text-sm">Full Report</span>
                          </div>
                          <TooltipProvider delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className="overflow-hidden"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    dispatch?.({ type: "SET_ACTIVE_VIEW", payload: "report-customization" })
                                  }}
                                >
                                  <Settings className="h-4 w-4 text-gray-500" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p>Customize Report</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Full Report</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}

              {isCollapsed ? (
                <div className="px-3 py-2">
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          className={cn(
                            "h-9 w-full justify-center rounded-lg px-0 transition-colors",
                            dealState?.activeView === "full-report"
                              ? "bg-gray-100 text-black hover:bg-gray-200"
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                          )}
                          onClick={() => {
                            dispatch?.({ type: "SET_ACTIVE_VIEW", payload: "full-report" })
                            setSelectedReportSection("")
                          }}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Full Report</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              ) : (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Report Sections — directly under "Full Report" */}
                  <ScrollArea className="flex-1 px-3 py-4">
                    <div className="space-y-1">
                      {dealState?.activeView === "full-report" &&
                        reportSections.map((section, index) => (
                          <Button
                            key={section.id}
                            variant="ghost"
                            className={cn(
                              "h-9 w-full justify-start gap-3 rounded-lg px-3 text-gray-600 transition-colors hover:bg-gray-100/80",
                              selectedReportSection === section.id && "bg-gray-200/60 text-gray-900 font-medium",
                            )}
                            onClick={() => {
                              dispatch?.({ type: "SCROLL_TO_SECTION", payload: section.id })
                              setSelectedReportSection(section.id)
                            }}
                          >
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-800 text-xs font-bold text-white">
                              {index + 1}
                            </div>
                            <span className="text-sm">{section.title}</span>
                          </Button>
                        ))}
                    </div>
                  </ScrollArea>

                  <div className="px-3 pt-2 pb-2">
                    <Button
                      variant="ghost"
                      className={cn(
                        "h-9 w-full justify-start gap-3 rounded-lg px-3 transition-colors",
                        ["custom-reports", "report-template-detail", "custom-report-viewer"].includes(
                          dealState?.activeView || "",
                        )
                          ? "bg-gray-100 text-black hover:bg-gray-200"
                          : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                      )}
                      onClick={() => dispatch?.({ type: "SET_ACTIVE_VIEW", payload: "custom-reports" })}
                    >
                      <LayoutTemplate className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm">Custom Reports</span>
                    </Button>
                  </div>

                  <div id="sidebar-reports-section" className="px-3 pb-4 pt-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="overflow-hidden whitespace-nowrap text-xs font-medium uppercase tracking-wider text-gray-500">
                        REPORTS
                      </h3>
                    </div>
                    <div className="space-y-1">
                      {dealState?.customReports &&
                        dealState.customReports.map((report) => (
                          <TooltipProvider key={report.id} delayDuration={100}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className={cn(
                                    "h-8 w-full justify-start gap-3 rounded-lg px-3 text-xs transition-colors",
                                    dealState.activeCustomReportId === report.id
                                      ? "bg-gray-100 text-black hover:bg-gray-200"
                                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                                  )}
                                  onClick={() => dispatch?.({ type: "SET_ACTIVE_CUSTOM_REPORT", payload: report.id })}
                                >
                                  <div className="flex-shrink-0">
                                    <FileClock className="h-3 w-3" />
                                  </div>
                                  <span className="flex-1 overflow-hidden whitespace-nowrap text-left">
                                    {report.title}
                                  </span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="right">
                                <p>{report.title}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 border-t border-gray-300/50 px-3 py-3">
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "h-10 w-full rounded-lg px-3 text-gray-700 hover:bg-gray-50",
                  isCollapsed ? "justify-center px-0" : "justify-start",
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gray-300">
                    <span className="text-xs font-medium text-gray-600">E</span>
                  </div>
                  {!isCollapsed && (
                    <div className="flex flex-1 items-center justify-between overflow-hidden">
                      <span className="whitespace-nowrap text-sm">Eduardo</span>
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    </div>
                  )}
                </div>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Eduardo</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile/Tablet: Drawer with floating open button (only below lg) */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="secondary"
              size="icon"
              className="fixed left-3 top-3 z-40 h-10 w-10 rounded-full shadow-md"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-3/4 sm:max-w-sm">
            <SidebarInner />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: original sidebar (unchanged behavior) */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 56 : 256 }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="relative hidden lg:flex h-screen flex-col overflow-hidden bg-gray-200 shadow-lg"
      >
        <SidebarInner />

        {/* Desktop-only collapse toggle button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-[20px] -right-3 z-10 h-6 w-6 rounded-full border border-gray-200 bg-white shadow-md hover:bg-gray-100"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", isCollapsed && "rotate-180")} />
        </Button>
      </motion.aside>
    </>
  )
}
