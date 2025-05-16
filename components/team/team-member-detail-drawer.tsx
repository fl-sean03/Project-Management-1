"use client"

import { useState, useEffect, Suspense } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Users,
  Clock,
  CheckCircle2,
  MessageSquare,
  Link2,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { User, Task } from "@/lib/types"
import { userService, taskService } from "@/lib/services"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { activities } from "@/mock/activities"

interface TeamMemberDetailDrawerProps {
  projectId?: string
}

// Inner component that uses search params
function TeamMemberDetailContent({ projectId }: TeamMemberDetailDrawerProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const userId = searchParams.get("userId")
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [userTasks, setUserTasks] = useState<Task[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [loading, setLoading] = useState(false)

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

  // Update our state when userId changes in the URL
  useEffect(() => {
    if (userId) {
      setIsOpen(true)
      setCurrentUserId(userId)
      fetchUserData(userId)
    } else {
      setIsOpen(false)
    }
  }, [userId])

  // Fetch user data from Supabase
  const fetchUserData = async (id: string) => {
    try {
      setLoading(true)
      const { data, error } = await userService.getUserById(id)
      if (error) throw error
      setUser(data)
      
      // Fetch user's tasks once we have the user
      fetchUserTasks(id)
    } catch (err) {
      console.error("Error fetching user:", err)
    } finally {
      setLoading(false)
    }
  }
  
  // Fetch user tasks from Supabase
  const fetchUserTasks = async (userId: string) => {
    try {
      setTasksLoading(true)
      
      // If projectId is provided, fetch only tasks for that project
      if (projectId) {
        // Filter by both project and assignee
        const { data, error } = await taskService.getTasksByProject(projectId);
        
        if (error) throw error;
        
        // Filter for the current user's tasks
        const userProjectTasks = data.filter(task => task.assignee === userId);
        setUserTasks(userProjectTasks || []);
      } else {
        // Fetch all tasks assigned to the user
        const { data, error } = await taskService.getTasksByAssignee(userId);
        if (error) throw error;
        setUserTasks(data || []);
      }
    } catch (err) {
      console.error("Error fetching user tasks:", err);
      setUserTasks([]);
    } finally {
      setTasksLoading(false);
    }
  }

  // Listen for custom urlchange events for team members
  useEffect(() => {
    const handleUrlChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ userId: string }>
      if (customEvent.detail?.userId) {
        setIsOpen(true)
        setCurrentUserId(customEvent.detail.userId)
        fetchUserData(customEvent.detail.userId)
      }
    }

    window.addEventListener("userchange", handleUrlChange)

    return () => {
      window.removeEventListener("userchange", handleUrlChange)
    }
  }, [])

  // Add a popstate event listener to handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const userIdFromUrl = urlParams.get("userId")

      if (userIdFromUrl) {
        setIsOpen(true)
        setCurrentUserId(userIdFromUrl)
        fetchUserData(userIdFromUrl)
      } else {
        setIsOpen(false)
      }
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  // If no user is found, still render the Sheet but keep it closed
  if (!user) {
    return (
      <Sheet open={false} onOpenChange={() => {}}>
        <SheetContent side="right" className="hidden" />
      </Sheet>
    )
  }

  // Filter tasks for the user based on projectId if provided
  const filteredTasks = projectId 
    ? userTasks.filter(task => task.project === projectId)
    : userTasks

  // Get user's activities
  const userActivities = activities.filter((activity) => activity.user === user.id)

  // If projectId is provided, filter activities for that project
  const filteredActivities = projectId
    ? userActivities.filter((activity) => activity.project === projectId)
    : userActivities

  // Format dates
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(date)
    } catch (e) {
      return 'Invalid date'
    }
  }

  // Handle close with a direct approach to URL updating
  const handleClose = () => {
    // First update our local state
    setIsOpen(false)

    // Create a new URLSearchParams object
    const params = new URLSearchParams(searchParams.toString())
    params.delete("userId")

    // Use window.history directly to update the URL without a full navigation
    window.history.pushState({}, "", `${pathname}${params.toString() ? `?${params.toString()}` : ""}`)
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-blue border-t-transparent"></div>
          </div>
        ) : (
          <div className="flex h-full flex-col overflow-hidden">
            {/* Header */}
            <SheetHeader className="border-b p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback>
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <SheetTitle className="text-xl font-bold">{user.name}</SheetTitle>
                    <p className="text-sm text-muted-foreground">{user.role}</p>
                  </div>
                </div>
              </div>
            </SheetHeader>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="tasks">Tasks ({filteredTasks.length})</TabsTrigger>
                  <TabsTrigger value="activity">Activity ({filteredActivities.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="profile" className="p-4 space-y-6">
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="text-sm font-medium">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Phone</p>
                            <p className="text-sm font-medium">{user.phone || 'Not provided'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Location</p>
                            <p className="text-sm font-medium">{user.location || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Joined</p>
                            <p className="text-sm font-medium">{formatDate(user.joined_date || '')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Department</p>
                            <p className="text-sm font-medium">{user.department || 'Not assigned'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Team</p>
                            <p className="text-sm font-medium">{user.team || 'Not assigned'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h3 className="text-sm font-medium mb-2">Bio</h3>
                      <p className="text-sm">{user.bio || 'No bio provided'}</p>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium mb-2">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {user.skills && user.skills.length > 0 ? (
                          user.skills.map((skill, idx) => (
                            <Badge key={idx} variant="outline">{skill}</Badge>
                          ))
                        ) : (
                          <p className="text-sm text-muted-foreground">No skills listed</p>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="tasks" className="p-4 space-y-4">
                  {tasksLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-blue border-t-transparent"></div>
                    </div>
                  ) : filteredTasks.length > 0 ? (
                    filteredTasks.map((task) => (
                      <div key={task.id} className="flex items-start justify-between border-b pb-4 last:border-0">
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
                              <Badge
                                className={
                                  task.status === "Completed"
                                    ? "bg-success-green text-white"
                                    : task.status === "In Progress"
                                      ? "bg-primary-blue text-white"
                                      : "bg-slate text-white"
                                }
                              >
                                {task.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">Due {formatDate(task.dueDate)}</div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <h3 className="mb-2 text-lg font-medium">No tasks assigned</h3>
                      <p className="text-sm text-muted-foreground">
                        This team member doesn't have any tasks assigned {projectId ? "in this project" : ""}.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="activity" className="p-4 space-y-4">
                  {filteredActivities.length > 0 ? (
                    filteredActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3 border-b pb-4 last:border-0">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                          <AvatarFallback>
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-start justify-between">
                            <p className="text-sm">
                              <span className="font-medium">{activity.action}</span> {activity.target}{" "}
                              <span className="font-medium">{activity.targetName}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                          </div>
                          {activity.content && <p className="mt-1 text-sm text-muted-foreground">"{activity.content}"</p>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center">
                      <h3 className="mb-2 text-lg font-medium">No recent activity</h3>
                      <p className="text-sm text-muted-foreground">
                        This team member doesn't have any recent activity {projectId ? "in this project" : ""}.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Footer */}
            <div className="border-t p-4">
              <div className="flex justify-between">
                <Button variant="outline" size="sm">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Message
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  className="bg-primary-blue hover:bg-primary-blue/90"
                  onClick={() => window.open(`/profile/${user.id}`, '_blank')}
                >
                  <Link2 className="mr-2 h-4 w-4" />
                  View Full Profile
                </Button>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// Main component with Suspense
export function TeamMemberDetailDrawer({ projectId }: TeamMemberDetailDrawerProps) {
  return (
    <Suspense fallback={null}>
      <TeamMemberDetailContent projectId={projectId} />
    </Suspense>
  )
}
