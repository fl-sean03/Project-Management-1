"use client"

import { notFound } from "next/navigation"
import { use } from "react"
import { Header } from "@/components/layout/header"
import { projects } from "@/mock/projects"
import { users } from "@/mock/users"
import { activities } from "@/mock/activities"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, Plus, MapPin, Calendar } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TeamPageProps {
  params: Promise<{
    id: string
  }>
}

export default function TeamPage({ params }: TeamPageProps) {
  const { id } = use(params)
  const project = projects.find((p) => p.id === id)
  if (!project) {
    notFound()
  }

  // Get team members for this project
  const teamMembers = project.team
    .map((userId) => users.find((user) => user.id === userId))
    .filter(Boolean) as typeof users

  // Get activities for this project's team members
  const teamActivities = activities
    .filter((activity) => project.team.includes(activity.user) && activity.project === project.id)
    .sort((a, b) => {
      // Sort by time (assuming newer items have "ago" in their time string)
      const timeA = a.time
      const timeB = b.time
      return timeA.localeCompare(timeB)
    })
    .slice(0, 10)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  // Handle team member click
  const handleTeamMemberClick = (userId: string) => {
    // Update URL with userId as a query parameter
    const params = new URLSearchParams(window.location.search)
    params.set("userId", userId)

    // Use window.history to update the URL without navigation
    window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`)

    // Dispatch a custom event to notify the TeamMemberDetailDrawer that the URL has changed
    window.dispatchEvent(new CustomEvent("userchange", { detail: { userId } }))
  }

  // Handle activity click
  const handleActivityClick = (activityId: string) => {
    // Update URL with activityId as a query parameter
    const params = new URLSearchParams(window.location.search)
    params.set("activityId", activityId)

    // Use window.history to update the URL without navigation
    window.history.pushState({}, "", `${window.location.pathname}?${params.toString()}`)

    // Dispatch a custom event to notify the ActivityDetailDrawer that the URL has changed
    window.dispatchEvent(new CustomEvent("activitychange", { detail: { activityId } }))
  }

  return (
    <>
      <Header title={`${project.name} - Team`} />
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h2 className="text-xl font-bold">Project Team</h2>
          <Button className="bg-primary-blue hover:bg-primary-blue/90">
            <Plus className="mr-2 h-4 w-4" />
            Add Team Member
          </Button>
        </div>

        <Tabs defaultValue="members">
          <TabsList>
            <TabsTrigger value="members">Team Members</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {teamMembers.map((member) => (
                <Card
                  key={member.id}
                  className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleTeamMemberClick(member.id)}
                >
                  <CardHeader className="bg-muted/30 pb-2">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                        <AvatarFallback>
                          {member.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{member.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{member.role}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span>{member.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{member.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{member.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Joined {formatDate(member.joinedDate)}</span>
                      </div>
                      <div className="pt-2">
                        <Badge variant="outline">{member.department}</Badge>
                        <Badge variant="outline" className="ml-2">
                          {member.team}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between pt-2 text-sm">
                        <span className="text-muted-foreground">Last active:</span>
                        <span>{member.lastActive}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Team Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamActivities.map((activity) => {
                    const user = users.find((u) => u.id === activity.user)
                    if (!user) return null

                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 border-b pb-4 last:border-0 cursor-pointer hover:bg-muted/50 p-2 rounded-md"
                        onClick={() => handleActivityClick(activity.id)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                          <AvatarFallback>
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm">
                            <span className="font-medium">{user.name}</span> {activity.action} {activity.target}{" "}
                            <span className="font-medium">{activity.targetName}</span>
                            {activity.content && (
                              <span className="block mt-1 text-muted-foreground">"{activity.content}"</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                        </div>
                      </div>
                    )
                  })}

                  {teamActivities.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground">No recent activity for this team</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
