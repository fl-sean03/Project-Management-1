"use client"

import { useState, useEffect, Suspense } from "react"
import { usePathname, useSearchParams } from "next/navigation"
import { Calendar, Clock, User2, FileText, MessageSquare, ExternalLink, ThumbsUp, Share2 } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { userService, activityService, taskService, projectService, fileService } from "@/lib/services"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

interface ActivityDetailDrawerProps {
  projectId?: string
}

// Inner component that uses search params
function ActivityDetailContent({ projectId }: ActivityDetailDrawerProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activityId = searchParams.get("activityId")
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [currentActivityId, setCurrentActivityId] = useState<string | null>(null)
  const [activity, setActivity] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [project, setProject] = useState<any>(null)
  const [targetDetails, setTargetDetails] = useState<any>(null)
  const [relatedActivities, setRelatedActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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

  // Update our state when activityId changes in the URL
  useEffect(() => {
    if (activityId) {
      setIsOpen(true)
      setCurrentActivityId(activityId)
    } else {
      setIsOpen(false)
    }
  }, [activityId])

  // Listen for custom urlchange events for activities
  useEffect(() => {
    const handleUrlChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ activityId: string }>
      if (customEvent.detail?.activityId) {
        setIsOpen(true)
        setCurrentActivityId(customEvent.detail.activityId)
      }
    }

    window.addEventListener("activitychange", handleUrlChange)

    return () => {
      window.removeEventListener("activitychange", handleUrlChange)
    }
  }, [])

  // Add a popstate event listener to handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const urlParams = new URLSearchParams(window.location.search)
      const activityIdFromUrl = urlParams.get("activityId")

      if (activityIdFromUrl) {
        setIsOpen(true)
        setCurrentActivityId(activityIdFromUrl)
      } else {
        setIsOpen(false)
      }
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
    }
  }, [])

  // Fetch activity and related data
  useEffect(() => {
    const fetchData = async () => {
      if (!currentActivityId) return

      setLoading(true)
      try {
        // Fetch activity
        const { data: activityData, error: activityError } = await activityService.getActivityById(currentActivityId)
        if (activityError || !activityData) {
          console.error("Error fetching activity:", activityError)
          return
        }
        setActivity(activityData)

        // Fetch user
        const { data: userData, error: userError } = await userService.getUserById(activityData.user)
        if (!userError && userData) {
          setUser(userData)
        }

        // Fetch project
        const { data: projectData, error: projectError } = await projectService.getProjectById(activityData.project)
        if (!projectError && projectData) {
          setProject(projectData)
        }

        // Fetch target details based on activity type
        if (activityData.target === "task") {
          const { data: taskData } = await taskService.getTaskById(activityData.targetId)
          setTargetDetails(taskData)
        } else if (activityData.target === "file") {
          const { data: fileData } = await fileService.getFileById(activityData.targetId)
          setTargetDetails(fileData)
        } else if (activityData.target === "project") {
          const { data: projectData } = await projectService.getProjectById(activityData.targetId)
          setTargetDetails(projectData)
        }

        // Fetch related activities
        const { data: relatedActivitiesData } = await activityService.getActivitiesByProject(activityData.project)
        if (relatedActivitiesData) {
          setRelatedActivities(
            relatedActivitiesData
              .filter((a: any) => a.id !== activityData.id && a.targetId === activityData.targetId && a.target === activityData.target)
              .slice(0, 3)
          )
        }
      } catch (err) {
        console.error("Error fetching activity details:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentActivityId])

  // If no activity is found, still render the Sheet but keep it closed
  if (!activity) {
    return (
      <Sheet open={false} onOpenChange={() => {}}>
        <SheetContent side="right" className="hidden" />
      </Sheet>
    )
  }

  // Format dates
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date)
  }

  // Handle close with a direct approach to URL updating
  const handleClose = () => {
    // First update our local state
    setIsOpen(false)

    // Create a new URLSearchParams object
    const params = new URLSearchParams(searchParams.toString())
    params.delete("activityId")

    // Use window.history directly to update the URL without a full navigation
    window.history.pushState({}, "", `${pathname}${params.toString() ? `?${params.toString()}` : ""}`)
  }

  // Get activity icon based on action type
  const getActivityIcon = () => {
    switch (activity.action) {
      case "commented":
        return <MessageSquare className="h-5 w-5 text-primary-blue" />
      case "completed":
        return <Clock className="h-5 w-5 text-success-green" />
      case "created":
        return <FileText className="h-5 w-5 text-secondary-purple" />
      case "updated":
        return <FileText className="h-5 w-5 text-primary-blue" />
      case "uploaded":
        return <FileText className="h-5 w-5 text-primary-blue" />
      default:
        return <Clock className="h-5 w-5 text-primary-blue" />
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>Activity Details</SheetTitle>
        </SheetHeader>
        <div className="flex h-full flex-col overflow-hidden">
          {/* Header */}
          <SheetHeader className="border-b p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getActivityIcon()}
                <SheetTitle className="text-xl font-bold">
                  {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)} {activity.target}
                </SheetTitle>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline">{activity.target.charAt(0).toUpperCase() + activity.target.slice(1)}</Badge>
              <Badge variant="outline">{project?.name}</Badge>
            </div>
          </SheetHeader>

          {/* Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-6">
              {/* Activity details */}
              <div className="flex items-start gap-3">
                {user && (
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                    <AvatarFallback>
                      {user.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <p className="text-base">
                    <span className="font-medium">{user?.name}</span> {activity.action} {activity.target}{" "}
                    <span className="font-medium">{activity.targetName}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">{formatDate(activity.created_at || activity.time)}</p>
                </div>
              </div>

              {/* Content if available */}
              {activity.content && (
                <div className="rounded-md border p-4 bg-muted/20">
                  <p className="text-sm">{activity.content}</p>
                </div>
              )}

              <Separator />

              {/* Target details */}
              <div>
                <h3 className="text-sm font-medium mb-3">Details</h3>
                <div className="space-y-4">
                  {targetDetails && (
                    <div className="rounded-md border p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{targetDetails.name || targetDetails.title}</h4>
                        {activity.target === "task" && (
                          <Badge
                            className={
                              targetDetails.status === "Completed"
                                ? "bg-success-green text-white"
                                : targetDetails.status === "In Progress"
                                  ? "bg-primary-blue text-white"
                                  : "bg-slate text-white"
                            }
                          >
                            {targetDetails.status}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{targetDetails.description}</p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Date</p>
                              <p className="text-sm">
                                {formatDate(
                                  targetDetails.dueDate || targetDetails.uploadedAt || targetDetails.createdAt,
                                )}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">
                                {activity.target === "task" ? "Assignee" : "Owner"}
                              </p>
                              <p className="text-sm">
                                {activity.target === "task"
                                  ? user?.name || "Unassigned"
                                  : activity.target === "file"
                                    ? user?.name
                                    : user?.name}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Related activities */}
              <div>
                <h3 className="text-sm font-medium mb-3">Related Activity</h3>
                <div className="space-y-3">
                  {relatedActivities.map((relatedActivity) => {
                    const relatedUser = user // Since we're using the same user for now
                    return (
                      <div key={relatedActivity.id} className="flex items-start gap-3 border-b pb-3 last:border-0">
                        {relatedUser && (
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={relatedUser.avatar || "/placeholder.svg"} alt={relatedUser.name} />
                            <AvatarFallback className="text-[10px]">
                              {relatedUser.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          <p className="text-sm">
                            <span className="font-medium">{relatedUser?.name}</span> {relatedActivity.action}{" "}
                            {relatedActivity.action !== "commented" && "this " + relatedActivity.target}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDate(relatedActivity.created_at || relatedActivity.time)}</p>
                        </div>
                      </div>
                    )
                  })}

                  {relatedActivities.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">No related activity found</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t p-4">
            <div className="flex justify-between">
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <ThumbsUp className="mr-2 h-4 w-4" />
                  Like
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </div>
              <Button
                variant="default"
                size="sm"
                className="bg-primary-blue hover:bg-primary-blue/90"
                onClick={() => {
                  // Navigate to the target item
                  if (activity.target === "task") {
                    const params = new URLSearchParams(searchParams.toString())
                    params.delete("activityId")
                    params.set("taskId", activity.targetId)
                    window.history.pushState({}, "", `${pathname}?${params.toString()}`)
                    window.dispatchEvent(new CustomEvent("urlchange", { detail: { taskId: activity.targetId } }))
                  }
                }}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View {activity.target.charAt(0).toUpperCase() + activity.target.slice(1)}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Main component with Suspense
export function ActivityDetailDrawer({ projectId }: ActivityDetailDrawerProps) {
  return (
    <Suspense fallback={null}>
      <ActivityDetailContent projectId={projectId} />
    </Suspense>
  )
}
