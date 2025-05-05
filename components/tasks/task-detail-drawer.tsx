"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Clock, Calendar, User2, Tag, Paperclip, MessageSquare, CheckSquare } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { tasks } from "@/mock/tasks"
import { users } from "@/mock/users"
import { projects } from "@/mock/projects"
import { activities } from "@/mock/activities"
import { files } from "@/mock/files"
import { Progress } from "@/components/ui/progress"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface TaskDetailDrawerProps {
  projectId: string
}

export function TaskDetailDrawer({ projectId }: TaskDetailDrawerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const taskId = searchParams.get("taskId")
  const [isMobile, setIsMobile] = useState(false)
  const [newComment, setNewComment] = useState("")
  const [isOpen, setIsOpen] = useState(false)
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null)

  // Check if we're on mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkIfMobile()
    window.addEventListener("resize", checkIfMobile)

    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  // Update our state when taskId changes in the URL
  useEffect(() => {
    if (taskId) {
      setIsOpen(true)
      setCurrentTaskId(taskId)
    } else {
      setIsOpen(false)
    }
  }, [taskId])

  // Listen for custom urlchange events
  useEffect(() => {
    const handleUrlChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ taskId: string }>
      if (customEvent.detail?.taskId) {
        setIsOpen(true)
        setCurrentTaskId(customEvent.detail.taskId)
      }
    }

    window.addEventListener("urlchange", handleUrlChange)

    return () => {
      window.removeEventListener("urlchange", handleUrlChange)
    }
  }, [])

  // Add a popstate event listener to handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const taskIdFromUrl = urlParams.get("taskId")

      if (taskIdFromUrl) {
        setIsOpen(true)
        setCurrentTaskId(taskIdFromUrl)
      } else {
        setIsOpen(false)
      }
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  // Find the task based on taskId
  const task = tasks.find((t) => t.id === currentTaskId)

  // If no task is found, still render the Sheet but keep it closed
  if (!task) {
    return (
      <Sheet open={false} onOpenChange={() => {}}>
        <SheetContent side="right" className="hidden" />
      </Sheet>
    )
  }

  // Get related data
  const assignee = users.find((user) => user.id === task.assignee)
  const project = projects.find((p) => p.id === task.project)

  // Get task activities
  const taskActivities = activities.filter((activity) => activity.targetId === task.id && activity.target === "task")

  // Get task attachments
  const taskAttachments = files.filter((file) => file.project === task.project).slice(0, 2) // Just take the first 2 files for demo purposes

  // Format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  // Handle close with a more direct approach to URL updating
  const handleClose = () => {
    // First update our local state
    setIsOpen(false)

    // Create a new URLSearchParams object
    const params = new URLSearchParams(searchParams.toString())
    params.delete("taskId")

    // Use window.history directly to update the URL without a full navigation
    window.history.pushState({}, "", `${pathname}${params.toString() ? `?${params.toString()}` : ""}`)
  }

  // Handle comment submission
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, this would submit the comment to the backend
    alert("Comment submitted: " + newComment)
    setNewComment("")
  }

  // Determine status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-success-green text-white"
      case "In Progress":
        return "bg-primary-blue text-white"
      case "Review":
        return "bg-secondary-purple text-white"
      default:
        return "bg-slate text-white"
    }
  }

  // Determine priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-destructive-red/10 text-destructive-red"
      case "Medium":
        return "bg-amber-100 text-amber-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={`p-0 ${isMobile ? "h-[90%] rounded-t-lg" : "w-[600px] max-w-[60%]"}`}
      >
        <div className="flex h-full flex-col overflow-hidden">
          {/* Header */}
          <SheetHeader className="border-b p-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-xl font-bold">{task.title}</SheetTitle>
              {/* Removed our custom close button */}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
              <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
              {task.tags?.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </SheetHeader>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
                <p className="text-sm">{task.description}</p>
              </div>

              {/* Details */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Due Date</p>
                      <p className="text-sm font-medium">{formatDate(task.dueDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Estimated Time</p>
                      <p className="text-sm font-medium">{task.estimatedHours} hours</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Assignee</p>
                      <div className="flex items-center gap-2">
                        {assignee && (
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={assignee.avatar || "/placeholder.svg"} alt={assignee.name} />
                            <AvatarFallback className="text-[10px]">
                              {assignee.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <p className="text-sm font-medium">{assignee?.name || "Unassigned"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Project</p>
                      <p className="text-sm font-medium">{project?.name || "No project"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {task.status === "Completed" ? "100" : task.status === "In Progress" ? "50" : "0"}%
                  </span>
                </div>
                <Progress
                  value={task.status === "Completed" ? 100 : task.status === "In Progress" ? 50 : 0}
                  className="h-2"
                />
              </div>

              <Separator />

              {/* Attachments */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
                  <Paperclip className="h-4 w-4" />
                  Attachments ({taskAttachments.length})
                </h3>
                {taskAttachments.length > 0 ? (
                  <div className="space-y-2">
                    {taskAttachments.map((file) => (
                      <div key={file.id} className="flex items-center justify-between rounded-md border p-2">
                        <div className="flex items-center gap-2">
                          <div className="rounded-md bg-muted p-1">
                            <Paperclip className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{file.size}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No attachments</p>
                )}
                <Button variant="outline" size="sm" className="mt-2">
                  <Paperclip className="mr-2 h-4 w-4" />
                  Add Attachment
                </Button>
              </div>

              <Separator />

              {/* Comments */}
              <div>
                <h3 className="flex items-center gap-2 text-sm font-medium mb-3">
                  <MessageSquare className="h-4 w-4" />
                  Comments ({task.comments})
                </h3>
                <div className="space-y-4">
                  {taskActivities
                    .filter((activity) => activity.action === "commented")
                    .map((activity) => {
                      const user = users.find((u) => u.id === activity.user)
                      return (
                        <div key={activity.id} className="flex gap-3">
                          {user && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                              <AvatarFallback>
                                {user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium">{user?.name}</p>
                              <p className="text-xs text-muted-foreground">{activity.time}</p>
                            </div>
                            <p className="text-sm">{activity.content || "No comment content available."}</p>
                          </div>
                        </div>
                      )
                    })}

                  {/* New comment form */}
                  <form onSubmit={handleCommentSubmit} className="mt-4">
                    <Textarea
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="mb-2"
                    />
                    <Button type="submit" size="sm" disabled={!newComment.trim()}>
                      Add Comment
                    </Button>
                  </form>
                </div>
              </div>

              <Separator />

              {/* Activity */}
              <div>
                <h3 className="text-sm font-medium mb-3">Activity</h3>
                <div className="space-y-3">
                  {taskActivities.map((activity) => {
                    const user = users.find((u) => u.id === activity.user)
                    return (
                      <div key={activity.id} className="flex items-start gap-3">
                        {user && (
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                            <AvatarFallback className="text-xs">
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          <p className="text-sm">
                            <span className="font-medium">{user?.name}</span> {activity.action}{" "}
                            {activity.action !== "commented" && "this task"}
                          </p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="flex justify-between">
              <Button variant="outline" size="sm">
                <CheckSquare className="mr-2 h-4 w-4" />
                {task.status === "Completed" ? "Reopen Task" : "Mark Complete"}
              </Button>
              <Button variant="default" size="sm" className="bg-primary-blue hover:bg-primary-blue/90">
                Edit Task
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
