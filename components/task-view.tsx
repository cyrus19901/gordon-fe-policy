"use client"

import { useDealState, useDealDispatch } from "@/lib/deal-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, FileCheck, Mail, Clock, User } from "lucide-react"
import { ContentLayout } from "./content-layout"

const iconMap = {
  Search,
  FileCheck,
  Mail,
}

export function TaskView() {
  const { activeTask } = useDealState()!
  const dispatch = useDealDispatch()!

  if (!activeTask) {
    return (
      <ContentLayout title="Task Not Found" description="The requested task could not be found.">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No task selected or task not found.</p>
              <Button
                variant="outline"
                onClick={() => dispatch({ type: "SET_ACTIVE_VIEW", payload: "tasks" })}
                className="mt-4"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tasks
              </Button>
            </CardContent>
          </Card>
        </div>
      </ContentLayout>
    )
  }

  const Icon = iconMap[activeTask.icon as keyof typeof iconMap] || Search

  const headerActions = (
    <Button variant="outline" onClick={() => dispatch({ type: "SET_ACTIVE_VIEW", payload: "tasks" })}>
      <ArrowLeft className="h-4 w-4 mr-2" />
      Back to Tasks
    </Button>
  )

  return (
    <ContentLayout title={activeTask.title} description="Task details and actions" headerActions={headerActions}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Task Overview Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary rounded-lg flex items-center justify-center">
                <Icon className="h-6 w-6 text-gray-600" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-xl">{activeTask.title}</CardTitle>
                <div className="flex items-center gap-4 mt-2">
                  <Badge
                    variant={activeTask.status === "To Do" ? "outline" : "secondary"}
                    className={`text-sm font-medium ${
                      activeTask.status === "Pending Reply"
                        ? "bg-yellow-100 text-yellow-800 border-transparent"
                        : activeTask.status === "In Progress"
                          ? "bg-blue-100 text-blue-800 border-transparent"
                          : ""
                    }`}
                  >
                    {activeTask.status}
                  </Badge>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="h-4 w-4" />
                <span>Assigned to: You</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Created: Today</span>
              </div>
            </div>

            {activeTask.requiredInput && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">Required Input</h4>
                <p className="text-blue-800 text-sm">{activeTask.requiredInput}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {activeTask.status === "To Do" && <Button>Start Task</Button>}
              {activeTask.status === "In Progress" && <Button>Mark Complete</Button>}
              {activeTask.requiredInput && activeTask.status !== "Pending Reply" && (
                <Button
                  variant="outline"
                  onClick={() =>
                    dispatch({
                      type: "SHOW_EMAIL_DRAFT",
                      payload: { requiredInput: activeTask.requiredInput! },
                    })
                  }
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Request Information
                </Button>
              )}
              <Button variant="outline">Add Comment</Button>
              <Button variant="outline">Set Due Date</Button>
            </div>
          </CardContent>
        </Card>

        {/* Task History/Comments Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="text-gray-900">Task created</p>
                  <p className="text-gray-500 text-xs">Today at 2:30 PM</p>
                </div>
              </div>
              {activeTask.status === "Pending Reply" && (
                <div className="flex gap-3 text-sm">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-gray-900">Information request sent to client</p>
                    <p className="text-gray-500 text-xs">Today at 3:15 PM</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </ContentLayout>
  )
}
