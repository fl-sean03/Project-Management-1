"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useState, useEffect } from "react"
import { userService } from "@/lib/services"
import { User } from "@/lib/types"

interface ProjectCardProps {
  id: string
  name: string
  description: string
  progress: number
  created_at: string
  team: string[] | null
  status: string
  priority: string
  userRole?: string
}

export function ProjectCard({ id, name, description, progress, created_at, team = [], status, priority, userRole }: ProjectCardProps) {
  const [teamMembers, setTeamMembers] = useState<User[]>([])
  
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        if (!team || !Array.isArray(team) || team.length === 0) return;
        
        const promises = team.map(userId => userService.getUserById(userId))
        const results = await Promise.all(promises)
        const validUsers = results
          .filter(result => !result.error && result.data)
          .map(result => result.data)
          .filter(user => user !== null) as User[]
        setTeamMembers(validUsers)
      } catch (error) {
        console.error('Error fetching team members:', error)
      }
    }
    
    fetchTeamMembers()
  }, [team])

  const statusColors = {
    Completed: "bg-success-green text-white",
    "In Progress": "bg-primary-blue text-white",
    Planning: "bg-secondary-purple text-white",
    "Not Started": "bg-slate text-white",
  }

  const priorityColors = {
    High: "bg-destructive-red/10 text-destructive-red",
    Medium: "bg-amber-100 text-amber-800",
    Low: "bg-slate-100 text-slate-800",
  }

  const statusColor = statusColors[status as keyof typeof statusColors] || "bg-slate text-white"
  const priorityColor = priorityColors[priority as keyof typeof priorityColors] || "bg-slate-100 text-slate-800"

  const formatDate = (dateString: string) => {
    if (!dateString) {
      console.warn('No date string provided');
      return 'N/A';
    }

    try {
      // Log the incoming date string for debugging
      console.log('Raw date string:', dateString);
      
      // Handle ISO string format
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString);
        return 'N/A';
      }

      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
    } catch (e) {
      console.error("Error formatting date:", e);
      return 'N/A';
    }
  }

  // Ensure team is an array
  const safeTeam = team || []

  return (
    <Card className="h-full transition-all hover:shadow-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="line-clamp-1 text-lg">{name}</CardTitle>
          <div className="flex gap-2">
            <Badge className={priorityColor}>{priority}</Badge>
            <Badge className={statusColor}>{status}</Badge>
          </div>
        </div>
        <p className="line-clamp-2 text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Started: <span className="font-medium">{formatDate(created_at)}</span>
          </div>
          <div className="flex -space-x-2">
            {teamMembers.slice(0, 3).map((user, i) => (
              <Avatar key={i} className="h-6 w-6 border-2 border-white">
                <AvatarImage src={user?.avatar || "/placeholder.svg"} alt={user?.name} />
                <AvatarFallback className="text-xs">
                  {user?.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
            ))}
            {safeTeam.length > 3 && (
              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-muted text-xs">
                +{safeTeam.length - 3}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-xs text-primary-blue">View details</div>
        {userRole && (
          <div className="text-xs">
            <Badge variant="outline" className="text-xs">
              {userRole === 'owner' ? 'Owner' : userRole === 'admin' ? 'Admin' : 'Member'}
            </Badge>
          </div>
        )}
      </CardFooter>
    </Card>
  )
}
