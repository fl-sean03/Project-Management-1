"use client"

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { commentService } from '@/lib/services/comment-service';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useProjectMember } from '@/hooks/use-project-member';
import type { Comment } from '@/lib/types';
import { notificationService } from '@/lib/services/notification-service';

export function TaskComments({ taskId, projectId }: { taskId: string; projectId: string }) {
  const { toast } = useToast();
  const currentUser = useCurrentUser();
  const { role: memberRole } = useProjectMember(projectId);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load comments
  useEffect(() => {
    const loadComments = async () => {
      try {
        const { data, error } = await commentService.getCommentsByTask(taskId);
        
        if (error) {
          throw error;
        }
        
        setComments(data || []);
      } catch (err) {
        console.error('Error loading comments:', err);
        toast({
          title: 'Error loading comments',
          description: err instanceof Error ? err.message : 'There was a problem loading the comments. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    if (taskId) {
      loadComments();
    }
  }, [taskId, toast]);

  // Add new comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      console.log("=== Starting comment submission ===");
      console.log("Comment data:", {
        content: commentText.trim(),
        task_id: taskId,
        project_id: projectId
      });

      const response = await commentService.addComment({
        content: commentText.trim(),
        task_id: taskId,
        project_id: projectId,
      });
      
      if (response.error) {
        throw response.error;
      }
      
      // Add new comment to the list
      if (response.data && response.data.length > 0) {
        const newComment = response.data[0];
        console.log("Comment created successfully:", newComment);

        // Create notification for comment
        if (currentUser) {
          console.log("Creating comment notification with data:", {
            commentId: newComment.id,
            taskId,
            projectId,
            commenterId: currentUser.id,
            commentContent: newComment.content
          });

          try {
            const { error: notificationError } = await notificationService.createCommentNotification(
              newComment.id,
              taskId,
              projectId,
              currentUser.id,
              newComment.content
            );

            if (notificationError) {
              console.error("Error creating comment notification:", notificationError);
            } else {
              console.log("Comment notification created successfully");
            }
          } catch (err) {
            console.error("Exception creating comment notification:", err);
          }
        } else {
          console.error("No current user found for notification");
        }

        setComments(prev => [newComment, ...prev]);
      }
      
      setCommentText('');
    } catch (err: any) {
      console.error("=== Error in comment submission ===");
      console.error("Error details:", err);
      toast({
        title: 'Error adding comment',
        description: err?.message || 'There was a problem adding your comment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Start editing comment
  const handleStartEdit = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.content);
    
    // Focus the textarea in the next render cycle
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditText('');
  };

  // Save edited comment
  const handleSaveEdit = async (commentId: string) => {
    if (!editText.trim()) return;
    
    try {
      const response = await commentService.updateComment(commentId, editText.trim());
      
      if (response.error) {
        throw response.error;
      }
      
      // Update comment in the list
      if (response.data && response.data.length > 0) {
        setComments(prev => 
          prev.map(comment => 
            comment.id === commentId ? response.data[0] : comment
          )
        );
      }
      
      setEditingCommentId(null);
      setEditText('');
    } catch (err: any) {
      console.error('Error updating comment:', err);
      toast({
        title: 'Error updating comment',
        description: err.message || 'There was a problem updating your comment. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Delete comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      const response = await commentService.deleteComment(commentId);
      
      if (response.error) {
        throw response.error;
      }
      
      // Remove comment from the list
      setComments(prev => prev.filter(comment => comment.id !== commentId));
      
      toast({
        title: 'Comment deleted',
        description: 'Your comment has been successfully deleted.',
      });
    } catch (err: any) {
      console.error('Error deleting comment:', err);
      toast({
        title: 'Error deleting comment',
        description: err.message || 'There was a problem deleting your comment. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Check if user can edit/delete comment
  const canModifyComment = (comment: Comment) => {
    if (!currentUser) return false;
    
    // User can modify their own comments
    if (comment.user_id === currentUser.id) return true;
    
    // Project admins and owners can modify any comment
    return ['admin', 'owner'].includes(memberRole || '');
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Comments</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Comment form */}
        <form onSubmit={handleAddComment} className="mb-6">
          <Textarea
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="mb-2 min-h-[100px]"
            disabled={isSubmitting}
          />
          <Button type="submit" disabled={!commentText.trim() || isSubmitting}>
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </Button>
        </form>
        
        {/* Comments list */}
        <div className="space-y-4">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 mb-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-1/3 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))
          ) : comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No comments yet. Be the first to add one!</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="p-4 border rounded-lg bg-card">
                <div className="flex items-start gap-4">
                  {/* User avatar */}
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={comment.users?.avatar || ''} alt={comment.users?.name || 'User'} />
                    <AvatarFallback>
                      {comment.users?.name?.split(' ').map(name => name[0]).join('').toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  {/* Comment content */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{comment.users?.name || 'Unknown User'}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                          {comment.updated_at && comment.updated_at !== comment.created_at && 
                            ' (edited)'}
                        </span>
                      </div>
                      
                      {/* Comment actions dropdown */}
                      {canModifyComment(comment) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleStartEdit(comment)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteComment(comment.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                    
                    {/* Editable comment or regular comment */}
                    {editingCommentId === comment.id ? (
                      <div className="mt-2">
                        <Textarea
                          ref={textareaRef}
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="mb-2"
                        />
                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleCancelEdit}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => handleSaveEdit(comment.id)}
                            disabled={!editText.trim()}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 whitespace-pre-line">{comment.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
} 