"use client"

import { useDealState, useDealDispatch } from "@/lib/deal-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronRight, Search, FileCheck, Mail, Plus } from "lucide-react"
import { ContentLayout } from "./content-layout"

const iconMap = {
  Search,
  FileCheck,
  Mail,
}

export function TasksView() {
  const { tasks } = useDealState()!
  const dispatch = useDealDispatch()!

  const headerActions = (
    <Button size="sm">
      <Plus className="h-4 w-4 mr-2" />
      New Task
    </Button>
  )

  return (
    <ContentLayout
      title="Tasks"
      description="Track all your to-dos and automated actions."
      headerActions={headerActions}
    >
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardContent className="p-4">
            {tasks.length > 0 ? (
              <div className="space-y-1">
                {tasks.map((task) => {
                  const Icon = iconMap[task.icon as keyof typeof iconMap] || Search
                  return (
                    <div
                      key={task.id}
                      onClick={() => dispatch({ type: "VIEW_TASK", payload: task })}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-800">{task.title}</p>
                          <p className="text-xs text-gray-500">Assigned to: You</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge
                          variant={task.status === "To Do" ? "outline" : "secondary"}
                          className={`text-xs font-medium ${
                            task.status === "Pending Reply"
                              ? "bg-yellow-100 text-yellow-800 border-transparent pulse-badge"
                              : ""
                          }`}
                        >
                          {task.status}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center text-sm text-gray-500 py-12">
                <p>No active tasks. Good job!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ContentLayout>
  )
}
