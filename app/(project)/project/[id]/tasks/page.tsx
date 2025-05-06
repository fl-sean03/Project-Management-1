"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { notFound } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, Plus, Search } from "lucide-react"
import { projectService, taskService, userService, Task, User, Project } from "@/lib/supabase-service"

interface ProjectTasksPageProps {
  params: {
    id: string
  }
}

// Define task statuses (this could be moved to the Supabase service later)
const taskStatuses = [
  { id: "todo", name: "To Do", color: "#E2E8F0" },
  { id: "in-progress", name: "In Progress", color: "#236EFF" },
  { id: "review", name: "Review", color: "#9D27F2" },
  { id: "completed", name: "Completed", color: "#30D158" },
]

export default function ProjectTasksPage({ params }: ProjectTasksPageProps) {
  const id = params.id
  const router = useRouter()
  const searchParams = useSearchParams()

  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [assigneeFilter, setAssigneeFilter] = useState("all")
  const [view, setView] = useState("kanban")

  // Fetch project, tasks, and users data
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
  }, [id])

  // If loading or error, show appropriate UI
  if (loading) {
    return <div className="p-4">Loading project data...</div>
  }
  
  if (error || !project) {
    return notFound()
  }

  // Filter tasks based on search query, status, and assignee
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || task.status === statusFilter
    const matchesAssignee = assigneeFilter === "all" || task.assignee === assigneeFilter

    return matchesSearch && matchesStatus && matchesAssignee
  })

  // Group tasks by status for Kanban view
  const tasksByStatus = taskStatuses.reduce(
    (acc, status) => {
      acc[status.name] = filteredTasks.filter((task) => task.status === status.name)
      return acc
    },
    {} as Record<string, Task[]>,
  )

  const getUser = (userId: string) => {
    return users.find((user) => user.id === userId)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "No date"
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
    }).format(date)
  }

  const isOverdue = (dateString: string) => {
    if (!dateString) return false
    const dueDate = new Date(dateString)
    const today = new Date()
    return dueDate < today
  }

  // Handle task click
  const handleTaskClick = (taskId: string) => {
    // Update URL with taskId as a query parameter
    const params = new URLSearchParams(searchParams.toString())
    params.set("taskId", taskId)
    router.push(`${window.location.pathname}?${params.toString()}`)
  }

  return (
    <>
      <Header title={`${project.name} - Tasks`} />
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tasks..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {taskStatuses.map((status) => (
                  <SelectItem key={status.id} value={status.name}>
                    {status.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="bg-primary-blue hover:bg-primary-blue/90">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={view === "kanban" ? "default" : "outline"}
            onClick={() => setView("kanban")}
            className={view === "kanban" ? "bg-primary-blue hover:bg-primary-blue/90" : ""}
          >
            Kanban
          </Button>
          <Button
            variant={view === "list" ? "default" : "outline"}
            onClick={() => setView("list")}
            className={view === "list" ? "bg-primary-blue hover:bg-primary-blue/90" : ""}
          >
            List
          </Button>
        </div>

        {view === "kanban" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {taskStatuses.map((status) => (
              <div key={status.id} className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: status.color }}></div>
                  <h3 className="font-medium">{status.name}</h3>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                    {tasksByStatus[status.name]?.length || 0}
                  </span>
                </div>
                <div className="space-y-3">
                  {tasksByStatus[status.name]?.map((task) => {
                    const assignee = getUser(task.assignee)

                    return (
                      <Card
                        key={task.id}
                        className="cursor-pointer hover:shadow-md"
                        onClick={() => handleTaskClick(task.id)}
                      >
                        <CardContent className="p-4">
                          <h4 className="mb-1 font-medium">{task.title}</h4>
                          <p className="mb-3 line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">{formatDate(task.dueDate)}</span>
                              {isOverdue(task.dueDate) && task.status !== "Completed" && (
                                <Badge variant="destructive" className="text-[10px]">
                                  Overdue
                                </Badge>
                              )}
                            </div>
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
                        </CardContent>
                      </Card>
                    )
                  })}
                  {(tasksByStatus[status.name]?.length || 0) === 0 && (
                    <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                      No tasks
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>All Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => {
                    const assignee = getUser(task.assignee)

                    return (
                      <div
                        key={task.id}
                        className="flex items-start justify-between border-b pb-4 cursor-pointer hover:bg-muted/50"
                        onClick={() => handleTaskClick(task.id)}
                      >
                        <div className="flex items-start gap-3">
                          {task.status === "Completed" ? (
                            <CheckCircle2 className="mt-0.5 h-5 w-5 text-success-green" />
                          ) : (
                            <Clock className="mt-0.5 h-5 w-5 text-primary-blue" />
                          )}
                          <div>
                            <h4 className="font-medium">{task.title}</h4>
                            <p className="line-clamp-1 text-sm text-muted-foreground">{task.description}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <span className="text-xs text-muted-foreground">Due {formatDate(task.dueDate)}</span>
                              {isOverdue(task.dueDate) && task.status !== "Completed" && (
                                <Badge variant="destructive" className="text-[10px]">
                                  Overdue
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              task.priority === "High"
                                ? "bg-destructive-red/10 text-destructive-red"
                                : task.priority === "Medium"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-slate-100 text-slate-800"
                            }
                          >
                            {task.priority}
                          </Badge>
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
                  })
                ) : (
                  <div className="py-4 text-center text-muted-foreground">No tasks found</div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
