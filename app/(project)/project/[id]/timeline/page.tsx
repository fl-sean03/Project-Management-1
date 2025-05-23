"use client"

import { useState, useEffect } from "react"
import { use } from 'react'
import { notFound } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { projectService, taskService, userService } from "@/lib/services"
import { Task, User, Project } from "@/lib/types"
import { NewTaskDialog } from "@/components/projects/new-task-dialog"
import { TaskDetailDrawer } from "@/components/tasks/task-detail-drawer"
import { ActivityDetailDrawer } from "@/components/activity/activity-detail-drawer"
import { useRouter, useSearchParams } from "next/navigation"
import { useTaskContext } from "@/contexts/task-context"
import { Spinner } from "@/components/ui/spinner"

interface TimelinePageProps {
  params: Promise<{
    id: string
  }>
}

export default function TimelinePage({ params }: TimelinePageProps) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { tasks, setTasks, updateTaskStatus } = useTaskContext()
  const [timeframe, setTimeframe] = useState("month")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isNewTaskDialogOpen, setIsNewTaskDialogOpen] = useState(false)
  
  const [project, setProject] = useState<Project | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch project and users data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch project
        const { data: projectData, error: projectError } = await projectService.getProjectById(id)
        if (projectError || !projectData) {
          console.error("Error fetching project:", projectError)
          throw new Error(projectError?.message || "Failed to fetch project")
        }
        setProject(projectData)
        
        // Fetch tasks
        const { data: tasksData, error: tasksError } = await taskService.getTasksByProject(id)
        if (tasksError) {
          console.error("Error fetching tasks:", tasksError)
          throw new Error(tasksError.message)
        }
        setTasks(tasksData || [])
        
        // Fetch users
        const { data: usersData, error: usersError } = await userService.getAllUsers()
        if (usersError) {
          console.error("Error fetching users:", usersError)
          throw new Error(usersError.message)
        }
        setUsers(usersData || [])
        
      } catch (err: any) {
        setError(err.message || "An error occurred")
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [id, setTasks])

  // If loading or error, show appropriate UI
  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Spinner size="lg" className="text-primary-blue" />
      </div>
    )
  }
  
  if (error || !project) {
    return notFound()
  }

  // Format date for display
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  // Get month name
  const getMonthName = (date: Date): string => {
    return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date)
  }

  // Generate days for the timeline
  const generateDays = (): Date[] => {
    const days: Date[] = []
    const startDate = new Date(currentDate)
    startDate.setDate(1) // Start from the first day of the month

    const endDate = new Date(currentDate)
    endDate.setMonth(endDate.getMonth() + 1, 0) // Last day of the month

    for (let day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
      days.push(new Date(day))
    }

    return days
  }

  const days = generateDays()

  // Navigate to previous/next month
  const navigatePrevious = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() - 1)
    setCurrentDate(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + 1)
    setCurrentDate(newDate)
  }

  // Check if a task falls on a specific day
  const getTasksForDay = (day: Date): Task[] => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate)
      return (
        taskDate.getDate() === day.getDate() &&
        taskDate.getMonth() === day.getMonth() &&
        taskDate.getFullYear() === day.getFullYear()
      )
    })
  }

  // Get user by ID
  const getUser = (userId: string) => {
    return users.find((user) => user.id === userId)
  }

  // Handle task click
  const handleTaskClick = (taskId: string) => {
    // Update URL with taskId as a query parameter
    const params = new URLSearchParams(searchParams.toString())
    params.set("taskId", taskId)
    router.push(`${window.location.pathname}?${params.toString()}`)
  }

  // Handle date click
  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setIsNewTaskDialogOpen(true)
  }

  // Handle task created
  const handleTaskCreated = (newTask: Task) => {
    // Add the new task to the list
    setTasks(prevTasks => [...prevTasks, newTask])
    // Reset selected date and close dialog
    setSelectedDate(null)
    setIsNewTaskDialogOpen(false)
  }

  return (
    <>
      <Header title={`${project.name} - Timeline`} />
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={navigatePrevious}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-bold">{getMonthName(currentDate)}</h2>
            <Button variant="outline" size="icon" onClick={navigateNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={timeframe} onValueChange={setTimeframe}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="View" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="day">Day</SelectItem>
              </SelectContent>
            </Select>
            <NewTaskDialog 
              projectId={id} 
              onTaskCreated={handleTaskCreated}
              initialDueDate={selectedDate}
              open={isNewTaskDialogOpen}
              onOpenChange={setIsNewTaskDialogOpen}
            >
              <Button 
                className="bg-primary-blue hover:bg-primary-blue/90"
                onClick={() => {
                  setSelectedDate(null)
                  setIsNewTaskDialogOpen(true)
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </NewTaskDialog>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                {/* Timeline header */}
                <div className="grid grid-cols-7 border-b">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                    <div key={day} className="p-2 text-center font-medium">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 auto-rows-fr">
                  {/* Empty cells for days before the 1st of the month */}
                  {Array.from({ length: days[0].getDay() }).map((_, index) => (
                    <div key={`empty-start-${index}`} className="min-h-[120px] border-b border-r p-1 bg-muted/20"></div>
                  ))}

                  {/* Days of the month */}
                  {days.map((day) => {
                    const dayTasks = getTasksForDay(day)
                    const isToday =
                      day.getDate() === new Date().getDate() &&
                      day.getMonth() === new Date().getMonth() &&
                      day.getFullYear() === new Date().getFullYear()

                    return (
                      <div
                        key={day.toISOString()}
                        className={`min-h-[120px] border-b border-r p-1 ${isToday ? "bg-primary-blue/5" : ""} cursor-pointer hover:bg-muted/10`}
                        onClick={() => handleDateClick(day)}
                      >
                        <div className="mb-1 text-right text-sm font-medium">{day.getDate()}</div>
                        <div className="space-y-1">
                          {dayTasks.map((task) => {
                            const assignee = task.assignee_id ? getUser(task.assignee_id) : null
                            return (
                              <div
                                key={task.id}
                                className={`rounded p-1 text-xs cursor-pointer ${
                                  task.priority === "High"
                                    ? "bg-destructive-red/10"
                                    : task.priority === "Medium"
                                      ? "bg-amber-100"
                                      : "bg-slate-100"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation() // Prevent date click when clicking task
                                  handleTaskClick(task.id)
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{task.title}</span>
                                  {assignee && (
                                    <Avatar className="h-4 w-4">
                                      <AvatarImage src={assignee.avatar || "/placeholder.svg"} alt={assignee.name} />
                                      <AvatarFallback className="text-[8px]">
                                        {assignee.name
                                          .split(" ")
                                          .map((n) => n[0])
                                          .join("")}
                                      </AvatarFallback>
                                    </Avatar>
                                  )}
                                </div>
                                <Badge
                                  className={`mt-1 text-[10px] ${
                                    task.status === "Completed"
                                      ? "bg-success-green text-white"
                                      : task.status === "In Progress"
                                        ? "bg-primary-blue text-white"
                                        : "bg-slate text-white"
                                  }`}
                                >
                                  {task.status}
                                </Badge>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}

                  {/* Empty cells for days after the end of the month */}
                  {Array.from({ length: 6 - days[days.length - 1].getDay() }).map((_, index) => (
                    <div key={`empty-end-${index}`} className="min-h-[120px] border-b border-r p-1 bg-muted/20"></div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add TaskDetailDrawer */}
      <TaskDetailDrawer projectId={id} />
      {/* Add ActivityDetailDrawer */}
      <ActivityDetailDrawer projectId={id} />
    </>
  )
}
