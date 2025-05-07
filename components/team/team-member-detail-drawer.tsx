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
import { users } from "@/mock/users"
import { tasks } from "@/mock/tasks"
import { activities } from "@/mock/activities"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
    } else {
      setIsOpen(false)
    }
  }, [userId])

  // Listen for custom urlchange events for team members
  useEffect(() => {
    const handleUrlChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ userId: string }>
      if (customEvent.detail?.userId) {
        setIsOpen(true)
        setCurrentUserId(customEvent.detail.userId)
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
      } else {
        setIsOpen(false)
      }
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  // Find the user based on userId
  const user = users.find((u) => u.id === currentUserId)

  // If no user is found, still render the Sheet but keep it closed
  if (!user) {
    return (
      <Sheet open={false} onOpenChange={() => {}}>
        <SheetContent side="right" className="hidden" />
      </Sheet>
    )
  }

  // Get user's tasks
  const userTasks = tasks.filter((task) => task.assignee === user.id)

  // Get user's activities
  const userActivities = activities.filter((activity) => activity.user === user.id)

  // If projectId is provided, filter tasks and activities for that project
  const filteredTasks = projectId ? userTasks.filter((task) => task.project === projectId) : userTasks

  const filteredActivities = projectId
    ? userActivities.filter((activity) => activity.project === projectId)
    : userActivities

  // Format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date)
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
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={`p-0 ${isMobile ? "h-[90%] rounded-t-lg" : "w-[600px] max-w-[60%]"}`}
      >
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
              {/* Removed our custom close button */}
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
                          <p className="text-sm font-medium">{user.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Location</p>
                          <p className="text-sm font-medium">{user.location}</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Joined</p>
                          <p className="text-sm font-medium">{formatDate(user.joinedDate)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Department</p>
                          <p className="text-sm font-medium">{user.department}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Team</p>
                          <p className="text-sm font-medium">{user.team}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="text-sm font-medium mb-2">Bio</h3>
                    <p className="text-sm">{user.bio}</p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {/* Mock skills based on role */}
                      {user.role === "Product Manager" && (
                        <>
                          <Badge variant="outline">Agile</Badge>
                          <Badge variant="outline">Roadmapping</Badge>
                          <Badge variant="outline">User Research</Badge>
                          <Badge variant="outline">Strategy</Badge>
                        </>
                      )}
                      {user.role === "UX Designer" && (
                        <>
                          <Badge variant="outline">UI Design</Badge>
                          <Badge variant="outline">Wireframing</Badge>
                          <Badge variant="outline">Prototyping</Badge>
                          <Badge variant="outline">User Testing</Badge>
                        </>
                      )}
                      {user.role === "Frontend Developer" && (
                        <>
                          <Badge variant="outline">React</Badge>
                          <Badge variant="outline">TypeScript</Badge>
                          <Badge variant="outline">CSS</Badge>
                          <Badge variant="outline">Responsive Design</Badge>
                        </>
                      )}
                      {user.role === "Backend Developer" && (
                        <>
                          <Badge variant="outline">Node.js</Badge>
                          <Badge variant="outline">Databases</Badge>
                          <Badge variant="outline">API Design</Badge>
                          <Badge variant="outline">Cloud Services</Badge>
                        </>
                      )}
                      {user.role === "Marketing Manager" && (
                        <>
                          <Badge variant="outline">Content Strategy</Badge>
                          <Badge variant="outline">Social Media</Badge>
                          <Badge variant="outline">Analytics</Badge>
                          <Badge variant="outline">Campaign Management</Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tasks" className="p-4 space-y-4">
                {filteredTasks.length > 0 ? (
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
              <Button variant="default" size="sm" className="bg-primary-blue hover:bg-primary-blue/90">
                <Link2 className="mr-2 h-4 w-4" />
                View Full Profile
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Main component with Suspense
export function TeamMemberDetailDrawer(props: TeamMemberDetailDrawerProps) {
  return (
    <Suspense fallback={<div className="hidden">Loading team member details...</div>}>
      <TeamMemberDetailContent {...props} />
    </Suspense>
  )
}
