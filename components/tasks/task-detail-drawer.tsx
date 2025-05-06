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
import { Progress } from "@/components/ui/progress"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { taskService, userService, projectService, Task, User, Project } from "@/lib/supabase-service"

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
  
  const [task, setTask] = useState<Task | null>(null)
  const [assignee, setAssignee] = useState<User | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  // Listen for custom taskchange events
  useEffect(() => {
    const handleTaskChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ taskId: string }>
      if (customEvent.detail?.taskId) {
        setIsOpen(true)
        setCurrentTaskId(customEvent.detail.taskId)
      }
    }

    window.addEventListener("taskchange", handleTaskChange)

    return () => {
      window.removeEventListener("taskchange", handleTaskChange)
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

  // Fetch task data when currentTaskId changes
  useEffect(() => {
    const fetchTaskData = async () => {
      if (!currentTaskId) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch task details
        const { data: taskData, error: taskError } = await taskService.getTaskById(currentTaskId);
        
        if (taskError || !taskData) {
          console.error("Error fetching task:", taskError);
          setError("Failed to load task data");
          setLoading(false);
          return;
        }
        
        setTask(taskData);
        
        // Fetch assignee details if available
        if (taskData.assignee) {
          const { data: assigneeData, error: assigneeError } = await userService.getUserById(taskData.assignee);
          
          if (!assigneeError && assigneeData) {
            setAssignee(assigneeData);
          }
        }
        
        // Fetch project details
        if (taskData.project) {
          const { data: projectData, error: projectError } = await projectService.getProjectById(taskData.project);
          
          if (!projectError && projectData) {
            setProject(projectData);
          }
        }
        
      } catch (err) {
        console.error("Error loading task data:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };
    
    fetchTaskData();
  }, [currentTaskId]);

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

  // Format dates
  const formatDate = (dateString: string) => {
    if (!dateString) return "No date";
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  // If no task is found or while loading, still render the Sheet but keep it closed or show loading
  if (!task) {
    return (
      <Sheet 
        open={isOpen} 
        onOpenChange={(open) => {
          if (!open) handleClose()
        }}
      >
        <SheetContent 
          side={isMobile ? "bottom" : "right"} 
          className={`p-4 ${isMobile ? "h-[90%] rounded-t-lg" : "w-[600px] max-w-[60%]"}`}
        >
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <p>Loading task details...</p>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p>{error || "Task not found"}</p>
            </div>
          )}
        </SheetContent>
      </Sheet>
    )
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

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Description */}
            <div className="mb-6">
              <h3 className="mb-2 font-semibold">Description</h3>
              <p className="text-muted-foreground">{task.description || "No description provided."}</p>
            </div>

            <div className="grid gap-4 mb-6 md:grid-cols-2">
              {/* Due Date */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Due Date</p>
                  <p className="text-sm text-muted-foreground">{formatDate(task.dueDate)}</p>
                </div>
              </div>

              {/* Assignee */}
              <div className="flex items-center gap-2">
                <User2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Assignee</p>
                  {assignee ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={assignee.avatar || "/placeholder.svg"} alt={assignee.name} />
                        <AvatarFallback className="text-xs">
                          {assignee.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">{assignee.name}</span>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Unassigned</p>
                  )}
                </div>
              </div>

              {/* Estimated hours */}
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Estimated Hours</p>
                  <p className="text-sm text-muted-foreground">{task.estimatedHours || "Not estimated"}</p>
                </div>
              </div>

              {/* Project */}
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Project</p>
                  <p className="text-sm text-muted-foreground">{project?.name || "Unknown project"}</p>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            {/* Comments section */}
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" /> Comments
              </h3>

              {/* This would be populated with real comments in a full app */}
              <p className="text-center text-sm text-muted-foreground py-4">No comments yet</p>

              {/* Comment form */}
              <form onSubmit={handleCommentSubmit} className="space-y-2">
                <Textarea
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-end">
                  <Button type="submit" className="bg-primary-blue hover:bg-primary-blue/90">
                    Post Comment
                  </Button>
                </div>
              </form>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Created {formatDate(task.createdAt)}</span>
              <Button variant="outline" size="sm" className="text-primary-blue hover:bg-primary-blue/10">
                <CheckSquare className="mr-2 h-4 w-4" />
                Mark as Completed
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
