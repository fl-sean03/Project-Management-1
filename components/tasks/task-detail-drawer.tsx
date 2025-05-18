"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { taskService, userService, projectService } from "@/lib/services"
import { TaskDetails } from "./components/task-details"
import { TaskComments } from "./components/task-comments"
import type { Task, User, Project } from "@/lib/types"
import { useTaskContext } from "@/contexts/task-context"

interface TaskDetailDrawerProps {
  projectId: string
}

// Inner component that uses search params
function TaskDetailContent({ projectId }: TaskDetailDrawerProps) {
  const { updateTaskStatus } = useTaskContext()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const taskId = searchParams.get("taskId")
  
  const [isMobile, setIsMobile] = useState(false)
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
        if (taskData.assignee_id) {
          const { data: assigneeData, error: assigneeError } = await userService.getUserById(taskData.assignee_id);
          
          if (!assigneeError && assigneeData) {
            setAssignee(assigneeData);
          }
        } else {
          setAssignee(null);
        }
        
        // Fetch project details
        if (taskData.project_id) {
          const { data: projectData, error: projectError } = await projectService.getProjectById(taskData.project_id);
          
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
  
  // Handle task status change
  const handleStatusChange = async (newStatus: string) => {
    if (!currentTaskId) return;
    
    try {
      await updateTaskStatus(currentTaskId, newStatus)
      await fetchTaskData()
    } catch (err) {
      console.error("Error updating task status:", err)
    }
  }
  
  // Helper function to fetch task data again
  const fetchTaskData = async () => {
    if (!currentTaskId) return;
    
    try {
      const { data: taskData, error: taskError } = await taskService.getTaskById(currentTaskId);
      
      if (taskError || !taskData) {
        console.error("Error refreshing task:", taskError);
        return;
      }
      
      setTask(taskData);
    } catch (err) {
      console.error("Error refreshing task data:", err);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-blue border-t-transparent"></div>
              <p className="mt-2 text-sm text-gray-500">Loading task details...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex h-full items-center justify-center">
            <div className="rounded-md bg-red-50 p-4 text-center">
              <p className="text-red-600">{error}</p>
              <button
                onClick={handleClose}
                className="mt-4 rounded-md bg-primary-blue px-4 py-2 text-sm text-white"
              >
                Close
              </button>
            </div>
          </div>
        ) : task ? (
          <div className="space-y-6 py-4">
            <SheetHeader>
              <SheetTitle>Task Details</SheetTitle>
            </SheetHeader>
            
            <TaskDetails 
              task={task} 
              assignee={assignee} 
              onStatusChange={handleStatusChange} 
            />
            
            <TaskComments 
              taskId={task.id} 
              projectId={task.project_id} 
            />
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

export function TaskDetailDrawer({ projectId }: TaskDetailDrawerProps) {
  return (
    <Suspense fallback={null}>
      <TaskDetailContent projectId={projectId} />
    </Suspense>
  )
}
