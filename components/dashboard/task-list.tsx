"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { CheckCircle2, Circle, Clock } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { users } from "@/mock/users"

interface Task {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string
  assignee: string
  project: string
}

interface TaskListProps {
  tasks: Task[]
  title: string
  limit?: number
}

export function TaskList({ tasks, title, limit = 5 }: TaskListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const priorityColors = {
    High: "bg-destructive-red/10 text-destructive-red",
    Medium: "bg-amber-100 text-amber-800",
    Low: "bg-slate-100 text-slate-800",
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date)
  }

  const isOverdue = (dateString: string) => {
    const dueDate = new Date(dateString)
    const today = new Date()
    return dueDate < today && dateString !== ""
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Completed":
        return <CheckCircle2 className="h-4 w-4 text-success-green" />
      case "In Progress":
        return <Clock className="h-4 w-4 text-primary-blue" />
      default:
        return <Circle className="h-4 w-4 text-slate" />
    }
  }

  const getAssignee = (userId: string) => {
    return users.find((user) => user.id === userId)
  }

  const handleTaskClick = (task: Task) => {
    // Instead of navigating to the tasks page, update the current URL with the taskId parameter
    const params = new URLSearchParams(searchParams.toString())
    params.set("taskId", task.id)

    // Use window.history to update the URL without navigation
    window.history.pushState({}, "", `${pathname}?${params.toString()}`)

    // Dispatch a custom event to notify the TaskDetailDrawer that the URL has changed
    window.dispatchEvent(new CustomEvent("urlchange", { detail: { taskId: task.id } }))
  }

  const handleViewAllTasks = () => {
    // This function should still navigate to the tasks page
    router.push(`/project/${tasks[0]?.project}/tasks`)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.slice(0, limit).map((task) => {
            const assignee = getAssignee(task.assignee)
            const priorityColor =
              priorityColors[task.priority as keyof typeof priorityColors] || "bg-slate-100 text-slate-800"

            return (
              <div
                key={task.id}
                className="flex items-start justify-between cursor-pointer hover:bg-muted/50 p-1 rounded-md"
                onClick={() => handleTaskClick(task)}
              >
                <div className="flex items-start gap-2">
                  {getStatusIcon(task.status)}
                  <div>
                    <div className="font-medium hover:underline">{task.title}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Due {formatDate(task.dueDate)}</span>
                      {isOverdue(task.dueDate) && task.status !== "Completed" && (
                        <Badge variant="destructive" className="text-[10px]">
                          Overdue
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={priorityColor}>{task.priority}</Badge>
                  {assignee && (
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={assignee.avatar || "/placeholder.svg"} alt={assignee.name} />
                      <AvatarFallback className="text-xs">
                        {assignee.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            )
          })}
          {tasks.length > limit && (
            <div
              className="block text-center text-sm text-primary-blue hover:underline cursor-pointer"
              onClick={handleViewAllTasks}
            >
              View all tasks
            </div>
          )}
          {tasks.length === 0 && (
            <div className="py-4 text-center text-sm text-muted-foreground">No tasks to display</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
