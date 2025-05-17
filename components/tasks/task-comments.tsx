"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { commentService, notificationService, userService } from "@/lib/services"
import { Comment } from "@/lib/types"

interface TaskCommentsProps {
  taskId: string
  projectId: string
  onCommentAdded?: (comment: Comment) => void
}

export function TaskComments({ taskId, projectId, onCommentAdded }: TaskCommentsProps) {
  const [comment, setComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Log props when component mounts
  console.log("TaskComments props:", { taskId, projectId })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    setIsSubmitting(true)
    try {
      // Get current user first
      const { data: currentUser, error: userError } = await userService.getCurrentUser()
      if (userError) {
        console.error("Error getting current user:", userError)
        throw new Error("User not authenticated")
      }

      if (!currentUser) {
        console.error("No current user found")
        throw new Error("User not found")
      }

      // Validate projectId
      if (!projectId) {
        console.error("No projectId provided")
        throw new Error("Project ID is required")
      }

      console.log("Current user for comment:", currentUser)
      console.log("Creating comment with data:", {
        content: comment,
        task_id: taskId,
        project_id: projectId
      })

      // Double check the data before sending
      const commentData = {
        content: comment,
        task_id: taskId,
        project_id: projectId
      }

      console.log("Final comment data being sent:", commentData)

      const { data, error } = await commentService.addComment(commentData)

      if (error) {
        console.error("Error creating comment:", error)
        throw error
      }

      if (data && data.length > 0) {
        const newComment = data[0] as Comment
        
        console.log("Comment created successfully:", newComment)
        console.log("Creating comment notification for:", {
          commentId: newComment.id,
          taskId,
          projectId,
          commenterId: currentUser.id,
          commentContent: newComment.content
        })
        
        try {
          // Create notification for comment
          const { error: notificationError } = await notificationService.createCommentNotification(
            newComment.id,
            taskId,
            projectId,
            currentUser.id,
            newComment.content
          )

          if (notificationError) {
            console.error("Error creating comment notification:", notificationError)
          } else {
            console.log("Comment notification created successfully")
          }
        } catch (err) {
          console.error("Exception creating comment notification:", err)
        }

        setComment("")
        if (onCommentAdded) {
          onCommentAdded(newComment)
        }
      }
    } catch (err) {
      console.error("Error adding comment:", err)
      setError("Failed to add comment. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          placeholder="Add a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="min-h-[100px]"
        />
        {error && <p className="text-sm text-destructive-red">{error}</p>}
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={isSubmitting || !comment.trim()}
            className="bg-primary-blue hover:bg-primary-blue/90"
          >
            {isSubmitting ? "Posting..." : "Post Comment"}
          </Button>
        </div>
      </form>
    </div>
  )
} 