"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { users } from "@/mock/users"

interface Activity {
  id: string
  user: string
  action: string
  target: string
  targetId: string
  targetName: string
  project: string
  time: string
}

interface ActivityFeedProps {
  activities: Activity[]
  limit?: number
}

export function ActivityFeed({ activities, limit = 5 }: ActivityFeedProps) {
  const getUser = (userId: string) => {
    return users.find((user) => user.id === userId)
  }

  const getActionVerb = (action: string) => {
    switch (action) {
      case "completed":
        return "completed"
      case "started":
        return "started working on"
      case "created":
        return "created"
      case "commented":
        return "commented on"
      case "uploaded":
        return "uploaded"
      case "updated":
        return "updated"
      default:
        return action
    }
  }

  const getTargetType = (target: string) => {
    switch (target) {
      case "task":
        return "task"
      case "project":
        return "project"
      case "file":
        return "file"
      default:
        return target
    }
  }

  // Handle activity click
  const handleActivityClick = (activityId: string) => {
    // Update URL with activityId as a query parameter
    const params = new URLSearchParams(window.location.search)
    params.set("activityId", activityId)

    // Use window.history to update the URL without navigation
    window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`)

    // Dispatch a custom event to notify the ActivityDetailDrawer that the URL has changed
    const event = new CustomEvent("activitychange", { 
      detail: { activityId },
      bubbles: true 
    })
    window.dispatchEvent(event)
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.slice(0, limit).map((activity) => {
            const user = getUser(activity.user)

            return (
              <div
                key={activity.id}
                className="flex gap-3 cursor-pointer hover:bg-muted/50 p-2 rounded-md"
                onClick={() => handleActivityClick(activity.id)}
              >
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
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="font-medium">{user?.name}</span> {getActionVerb(activity.action)}{" "}
                    {getTargetType(activity.target)} <span className="font-medium">{activity.targetName}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            )
          })}
          {activities.length === 0 && (
            <div className="py-4 text-center text-sm text-muted-foreground">No recent activity</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
