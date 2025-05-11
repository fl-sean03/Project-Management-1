"use client"

import { notFound } from "next/navigation"
import { useState, useEffect } from "react"
import { use } from 'react'
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Mail, Phone, Plus, MapPin, Calendar } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { projectService, userService, activityService } from "@/lib/services"
import { Project, User, Activity } from "@/lib/types"
import { TeamInviteDialog } from "@/components/projects/team-invite-dialog"
import { TeamMemberDetailDrawer } from "@/components/team/team-member-detail-drawer"

interface TeamPageProps {
  params: Promise<{
    id: string
  }>
}

export default function TeamPage({ params }: TeamPageProps) {
  // Unwrap params Promise with React.use()
  const { id } = use(params)
  const [project, setProject] = useState<Project | null>(null)
  const [teamMembers, setTeamMembers] = useState<User[]>([])
  const [teamActivities, setTeamActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      notFound()
    }

    const fetchData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // Fetch project
        const { data: projectData, error: projectError } = await projectService.getProjectById(id)
        
        if (projectError || !projectData) {
          console.error("Error fetching project:", projectError)
          setError("Failed to load project data")
          setLoading(false)
          return
        }
        
        setProject(projectData)
        
        // Fetch project members from the project_members table
        const { data: projectMembersData, error: projectMembersError } = 
          await projectService.getProjectMembers(id);
          
        if (projectMembersError) {
          console.error("Error fetching project members:", projectMembersError);
          setError("Failed to load team members");
          setLoading(false);
          return;
        }
        
        // Fetch team member details if we have project members
        if (projectMembersData && projectMembersData.length > 0) {
          const userIds = projectMembersData.map(member => member.user_id);
          const teamPromises = userIds.map(userId => userService.getUserById(userId));
          const teamResults = await Promise.all(teamPromises);
          
          // Create a map of project member roles by user_id
          const memberRolesMap: Record<string, string> = {};
          projectMembersData.forEach(member => {
            memberRolesMap[member.user_id] = member.role;
          });
          
          const validTeamMembers = teamResults
            .filter(result => !result.error && result.data)
            .map(result => {
              // Enrich user data with their project role
              const userData = result.data as User;
              return {
                ...userData,
                projectRole: memberRolesMap[userData.id] || 'member'
              } as User;
            });
          
          setTeamMembers(validTeamMembers);
          
          // Fetch activities
          const { data: activitiesData, error: activitiesError } = await activityService.getActivitiesByProject(id)
          
          if (!activitiesError && activitiesData) {
            // Filter activities for this project's team members and sort by time
            const filteredActivities = activitiesData
              .filter(activity => 
                userIds.includes(activity.user) && 
                activity.project === id
              )
              .sort((a, b) => {
                // Sort by created_at timestamp if available
                const timeA = a.created_at || a.time
                const timeB = b.created_at || b.time
                return new Date(timeB).getTime() - new Date(timeA).getTime()
              })
              .slice(0, 10)
            
            setTeamActivities(filteredActivities)
          }
        } else {
          // No team members found
          setTeamMembers([]);
          setTeamActivities([]);
        }
        
      } catch (err) {
        console.error("Error loading team data:", err)
        setError("An unexpected error occurred")
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [id])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(date)
    } catch (e) {
      return "Invalid date"
    }
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

  // Add this helper function near the formatDate function
  const getLastActive = (lastActiveDate?: string): string => {
    if (!lastActiveDate) return "Unknown";

    const lastActive = new Date(lastActiveDate);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - lastActive.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return formatDate(lastActiveDate);
  };

  if (loading) {
    return (
      <>
        <Header title="Loading Team..." />
        <div className="p-4 lg:p-6 flex items-center justify-center h-64">
          <p>Loading team data...</p>
        </div>
      </>
    )
  }
  
  if (error || !project) {
    return (
      <>
        <Header title="Error" />
        <div className="p-4 lg:p-6 flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-bold text-red-600 mb-2">Error Loading Team</h2>
            <p>{error || "Could not find project"}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-primary-blue hover:bg-primary-blue/90"
            >
              Try Again
            </Button>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header title={`${project.name} - Team`} />
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h2 className="text-xl font-bold">Project Team</h2>
          <TeamInviteDialog 
            projectId={id}
            onMemberAdded={(user) => {
              // Add the new member to the teamMembers state
              setTeamMembers(prev => [...prev, user]);
            }}
          >
            <Button className="bg-primary-blue hover:bg-primary-blue/90">
              <Plus className="mr-2 h-4 w-4" />
              Add Team Member
            </Button>
          </TeamInviteDialog>
        </div>

        <Tabs defaultValue="members">
          <TabsList>
            <TabsTrigger value="members">Team Members</TabsTrigger>
            <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-6">
            {teamMembers.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {teamMembers.map((member) => (
                  <Card
                    key={member.id}
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleTeamMemberClick(member.id)}
                  >
                    <CardHeader className="pb-2 pt-4 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-16 w-16 border-2 border-background">
                          <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                          <AvatarFallback className="text-lg font-semibold">
                            {member.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-base">{member.name}</h3>
                          <p className="text-sm text-muted-foreground">{member.projectRole}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 pt-0 space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-muted-foreground truncate">{member.email}</span>
                      </div>
                      {member.phone && (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground">{member.phone}</span>
                        </div>
                      )}
                      {member.location && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="text-muted-foreground">{member.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm pt-1">
                        <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          Joined {formatDate(member.joined_date || "")}
                        </span>
                      </div>
                      <div className="pt-1 flex flex-wrap gap-1">
                        {member.department && (
                          <Badge variant="outline" className="bg-muted/30">
                            {member.department}
                          </Badge>
                        )}
                        {member.skills?.map((skill, i) => (
                          <Badge key={i} variant="outline" className="bg-muted/30">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                      <div className="flex justify-between items-center pt-1 text-xs text-muted-foreground">
                        <span>Last active:</span>
                        <span>{getLastActive(member.last_active)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <h3 className="mb-1 text-lg font-medium">No team members yet</h3>
                <p className="mb-4 text-sm text-muted-foreground">Add team members to collaborate on this project</p>
                <Button className="bg-primary-blue hover:bg-primary-blue/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Team Member
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Team Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {teamActivities.length > 0 ? (
                  <div className="space-y-4">
                    {teamActivities.map((activity) => {
                      const member = teamMembers.find((m) => m.id === activity.user)

                      return (
                        <div
                          key={activity.id}
                          className="flex items-start gap-3 pb-4 border-b cursor-pointer hover:bg-muted/50"
                          onClick={() => handleActivityClick(activity.id)}
                        >
                          {member && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={member.avatar || "/placeholder.svg"} alt={member.name} />
                              <AvatarFallback>{member.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                            </Avatar>
                          )}
                          <div className="flex-1">
                            <div className="flex items-baseline justify-between">
                              <p className="font-medium">
                                {member?.name || "Unknown user"}{" "}
                                <span className="text-muted-foreground">{activity.action}</span>{" "}
                                <span className="text-primary-blue">{activity.targetName}</span>
                              </p>
                              <span className="text-xs text-muted-foreground">
                                {activity.created_at ? formatDate(activity.created_at) : activity.time}
                              </span>
                            </div>
                            {activity.content && <p className="mt-1 text-sm text-muted-foreground">{activity.content}</p>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-4 text-center text-muted-foreground">No recent activity from team members</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Add the TeamMemberDetailDrawer with current project ID */}
      <TeamMemberDetailDrawer projectId={id} />
    </>
  )
}
