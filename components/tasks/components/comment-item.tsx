"use client"

import { useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { MoreHorizontal, Pencil, Trash2, X, Check } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { commentService } from "@/lib/services"

interface CommentItemProps {
  id: string
  content: string
  createdAt: string
  updatedAt?: string | null
  userId: string
  taskId: string
  projectId: string
  userName: string
  userAvatar: string | null
  currentUserId: string
  onCommentDeleted: () => void
  onCommentUpdated: () => void
}

export function CommentItem({
  id,
  content,
  createdAt,
  updatedAt,
  userId,
  taskId,
  projectId,
  userName,
  userAvatar,
  currentUserId,
  onCommentDeleted,
  onCommentUpdated
}: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(content)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const isOwner = userId === currentUserId
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2)
  }
  
  const formattedDate = () => {
    try {
      return formatDistanceToNow(new Date(createdAt), { addSuffix: true })
    } catch (e) {
      return 'some time ago'
    }
  }
  
  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    
    try {
      await commentService.deleteComment(id)
      onCommentDeleted()
    } catch (err: any) {
      setError(err.message || 'Failed to delete comment')
      setIsDeleting(false)
    }
  }
  
  const handleUpdate = async () => {
    if (!editedContent.trim()) return
    
    setIsSaving(true)
    setError(null)
    
    try {
      await commentService.updateComment(id, editedContent)
      setIsEditing(false)
      onCommentUpdated()
    } catch (err: any) {
      setError(err.message || 'Failed to update comment')
    } finally {
      setIsSaving(false)
    }
  }
  
  const handleCancel = () => {
    setIsEditing(false)
    setEditedContent(content)
    setError(null)
  }
  
  return (
    <div className="flex gap-3 py-3">
      <Avatar className="h-8 w-8">
        <AvatarImage src={userAvatar || undefined} alt={userName} />
        <AvatarFallback>{getInitials(userName)}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{userName}</span>
            <span className="text-xs text-gray-500">{formattedDate()}</span>
            {updatedAt && <span className="text-xs text-gray-500">(edited)</span>}
          </div>
          
          {isOwner && !isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-[80px] text-sm"
            />
            
            {error && (
              <div className="text-sm text-red-500">{error}</div>
            )}
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleUpdate}
                disabled={isSaving}
                className="h-8"
              >
                {isSaving ? (
                  <>
                    <div className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-1 h-3 w-3" />
                    Save
                  </>
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={isSaving}
                className="h-8"
              >
                <X className="mr-1 h-3 w-3" />
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-sm whitespace-pre-wrap">{content}</div>
        )}
      </div>
    </div>
  )
} 