"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Clock, Calendar, User2, Tag, CheckSquare } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { taskService } from "@/lib/services"
import type { Task, User } from "@/lib/types"

interface TaskDetailsProps {
  task: Task
  assignee: User | null
  onStatusChange: () => void
}

export function TaskDetails({ task, assignee, onStatusChange }: TaskDetailsProps) {
  const [isChangingStatus, setIsChangingStatus] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState(task.status)
  const [error, setError] = useState<string | null>(null)
  
  const getInitials = (name: string) => {
    if (!name) return "??"
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }
  
  const formatDate = (dateString: string) => {
    if (!dateString) return "No date"
    try {
      return format(new Date(dateString), "MMM d, yyyy")
    } catch (e) {
      return dateString
    }
  }
  
  // Determine status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-success-green text-white"
      case "In Progress":
        return "bg-primary-blue text-white"
      case "Review":
        return "bg-secondary-purple text-white"
      default:
        return "bg-slate-500 text-white"
    }
  }

  // Determine priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High":
        return "bg-destructive-red/10 text-destructive-red"
      case "Medium":
        return "bg-amber-100 text-amber-800"
      default:
        return "bg-slate-100 text-slate-800"
    }
  }
  
  // Handle status change
  const handleStatusChange = async (newStatus: string) => {
    setSelectedStatus(newStatus)
    setIsChangingStatus(true)
    setError(null)
    
    try {
      await taskService.updateTaskStatus(task.id, newStatus)
      onStatusChange()
    } catch (err: any) {
      setError(err.message || "Failed to update status")
      // Revert to previous status
      setSelectedStatus(task.status)
    } finally {
      setIsChangingStatus(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{task.title}</h2>
        <p className="mt-2 text-sm text-gray-600">{task.description || "No description provided."}</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {/* First Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">Created:</span>
            <span className="text-sm">{formatDate(task.createdAt)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">Due:</span>
            <span className="text-sm">{formatDate(task.dueDate)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <User2 className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">Assignee:</span>
            {assignee ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={assignee.avatar || undefined} alt={assignee.name} />
                  <AvatarFallback>{getInitials(assignee.name)}</AvatarFallback>
                </Avatar>
                <span className="text-sm">{assignee.name}</span>
              </div>
            ) : (
              <span className="text-sm">Unassigned</span>
            )}
          </div>
        </div>
        
        {/* Second Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">Status:</span>
            <Select
              value={selectedStatus}
              onValueChange={handleStatusChange}
              disabled={isChangingStatus}
            >
              <SelectTrigger className="h-7 w-[140px] text-xs">
                <SelectValue placeholder={task.status} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="To Do">To Do</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Review">Review</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            
            {isChangingStatus && (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-blue border-t-transparent"></div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">Priority:</span>
            <Badge className={`${getPriorityColor(task.priority)}`}>
              {task.priority}
            </Badge>
          </div>
          
          {task.estimatedHours > 0 && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Estimated:</span>
              <span className="text-sm">{task.estimatedHours} hours</span>
            </div>
          )}
          
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Tag className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">Tags:</span>
              <div className="flex flex-wrap gap-1">
                {task.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}
      
      <Separator />
    </div>
  )
} 