import { getSupabaseClient } from './supabase-client'
import type { Notification } from '@/lib/types'

export const notificationService = {
  /**
   * Get notifications for the current user
   */
  async getNotifications() {
    const supabase = getSupabaseClient()
    
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select(`
          *,
          related_user:related_user_id (
            id,
            name,
            avatar
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      
      return { data: notifications, error: null }
    } catch (err) {
      return { data: null, error: err }
    }
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string) {
    const supabase = getSupabaseClient()
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
      
      if (error) throw error
      
      return { error: null }
    } catch (err) {
      return { error: err }
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead() {
    const supabase = getSupabaseClient()
    
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false)
      
      if (error) throw error
      
      return { error: null }
    } catch (err) {
      return { error: err }
    }
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount() {
    const supabase = getSupabaseClient()
    
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('read', false)
      
      if (error) throw error
      
      return { count: count || 0, error: null }
    } catch (err) {
      return { count: 0, error: err }
    }
  },

  /**
   * Create a notification for a task assignment
   */
  async createTaskAssignmentNotification(
    taskId: string,
    taskTitle: string,
    assigneeId: string,
    assignerId: string
  ) {
    const supabase = getSupabaseClient()
    
    try {
      console.log("Creating task assignment notification:", {
        taskId,
        taskTitle,
        assigneeId,
        assignerId
      })

      // Get assigner details
      const { data: assigner, error: assignerError } = await supabase
        .from('users')
        .select('name')
        .eq('id', assignerId)
        .single()

      if (assignerError) {
        console.error("Error fetching assigner:", assignerError)
        throw assignerError
      }

      console.log("Found assigner:", assigner)

      // Create notification for assignee
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          type: 'task_assigned',
          content: `${assigner.name} assigned you to task: ${taskTitle}`,
          link: `/tasks/${taskId}`,
          user_id: assigneeId,
          related_user_id: assignerId
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating task assignment notification:", error)
        throw error
      }

      console.log("Task assignment notification created:", data)
      return { data, error: null }
    } catch (error) {
      console.error("Error in createTaskAssignmentNotification:", error)
      return { data: null, error }
    }
  },

  /**
   * Create a notification for a comment
   */
  async createCommentNotification(
    commentId: string,
    taskId: string,
    projectId: string,
    commenterId: string,
    commentContent: string
  ) {
    const supabase = getSupabaseClient()
    
    try {
      console.log("=== Starting comment notification creation ===")
      console.log("Input parameters:", {
        commentId,
        taskId,
        projectId,
        commenterId,
        commentContent
      })

      // Get task details
      console.log("Fetching task details for taskId:", taskId)
      const { data: task, error: taskError } = await supabase
        .from('tasks')
        .select('title, assignee_id, created_by')
        .eq('id', taskId)
        .single()

      if (taskError) {
        console.error("Error fetching task:", taskError)
        throw taskError
      }

      if (!task) {
        console.error("Task not found for taskId:", taskId)
        throw new Error("Task not found")
      }

      console.log("Found task:", {
        title: task.title,
        assignee_id: task.assignee_id,
        created_by: task.created_by
      })

      // Get commenter details
      console.log("Fetching commenter details for commenterId:", commenterId)
      const { data: commenter, error: commenterError } = await supabase
        .from('users')
        .select('name')
        .eq('id', commenterId)
        .single()

      if (commenterError) {
        console.error("Error fetching commenter:", commenterError)
        throw commenterError
      }

      if (!commenter) {
        console.error("Commenter not found for commenterId:", commenterId)
        throw new Error("Commenter not found")
      }

      console.log("Found commenter:", commenter)

      // Create a Set of unique users to notify
      const usersToNotify = new Set<string>()
      
      // Only add assignee if they exist and are not the commenter
      if (task.assignee_id && task.assignee_id !== commenterId) {
        console.log("Adding assignee to notify:", task.assignee_id)
        usersToNotify.add(task.assignee_id)
      } else {
        console.log("Skipping assignee notification:", {
          assignee_id: task.assignee_id,
          is_commenter: task.assignee_id === commenterId
        })
      }
      
      // Only add creator if they exist and are not the commenter
      if (task.created_by && task.created_by !== commenterId) {
        console.log("Adding creator to notify:", task.created_by)
        usersToNotify.add(task.created_by)
      } else {
        console.log("Skipping creator notification:", {
          created_by: task.created_by,
          is_commenter: task.created_by === commenterId
        })
      }

      console.log("Final users to notify:", Array.from(usersToNotify))

      if (usersToNotify.size === 0) {
        console.log("No users to notify, exiting")
        return { data: null, error: null }
      }

      // Create notifications for each user
      const notifications = Array.from(usersToNotify).map(userId => ({
        type: 'comment',
        content: `${commenter.name} commented on task "${task.title}": ${commentContent}`,
        link: `/tasks/${taskId}`,
        user_id: userId,
        related_user_id: commenterId,
        read: false
      }))

      console.log("Prepared notifications to create:", notifications)

      // Create notifications one by one to ensure proper return values
      const results = []
      for (const notification of notifications) {
        console.log("Creating notification for user:", notification.user_id)
        console.log("Notification data:", notification)
        
        const { data, error } = await supabase
          .from('notifications')
          .insert(notification)
          .select()
          .single()

        if (error) {
          console.error("Error creating comment notification:", error)
          console.error("Failed notification data:", notification)
          throw error
        }

        if (data) {
          console.log("Successfully created notification:", data)
          results.push(data)
        } else {
          console.warn("No data returned for notification:", notification)
        }
      }

      console.log("=== Comment notification creation completed ===")
      console.log("Total notifications created:", results.length)
      console.log("Created notifications:", results)
      return { data: results, error: null }
    } catch (error) {
      console.error("=== Error in createCommentNotification ===")
      console.error("Error details:", error)
      return { data: null, error }
    }
  },

  /**
   * Create a notification for a file upload
   */
  async createFileUploadNotification(
    fileId: string,
    fileName: string,
    projectId: string,
    uploaderId: string
  ) {
    const supabase = getSupabaseClient()
    
    try {
      console.log('Creating file upload notification:', {
        fileId,
        fileName,
        projectId,
        uploaderId
      })

      // Get project members (excluding uploader) with DISTINCT to prevent duplicates
      const { data: members, error: membersError } = await supabase
        .from('project_members')
        .select('user_id')
        .eq('project_id', projectId)
        .neq('user_id', uploaderId)
        .order('user_id')
      
      if (membersError) {
        console.error('Error fetching project members:', membersError)
        throw membersError
      }
      
      if (!members || members.length === 0) {
        console.log('No project members to notify')
        return { error: null }
      }

      // Remove duplicate user_ids
      const uniqueMembers = Array.from(new Set(members.map(m => m.user_id)))
        .map(userId => ({ user_id: userId }))
      
      console.log('Unique project members to notify:', uniqueMembers)
      
      // Get uploader details
      const { data: uploader, error: userError } = await supabase
        .from('users')
        .select('name')
        .eq('id', uploaderId)
        .single()
      
      if (userError) {
        console.error('Error fetching uploader details:', userError)
        throw userError
      }

      if (!uploader) {
        console.error('Uploader not found')
        return { error: new Error('Uploader not found') }
      }
      
      // Create notifications for unique project members
      const notifications = uniqueMembers.map(member => ({
        type: 'file_uploaded',
        content: `${uploader.name} uploaded "${fileName}"`,
        link: `/files/${fileId}`,
        user_id: member.user_id,
        related_user_id: uploaderId,
        read: false
      }))
      
      console.log('Creating notifications:', notifications)
      
      const { error } = await supabase
        .from('notifications')
        .insert(notifications)
      
      if (error) {
        console.error('Error inserting file upload notifications:', error)
        throw error
      }
      
      return { error: null }
    } catch (err) {
      console.error('Error in createFileUploadNotification:', err)
      return { error: err }
    }
  }
} 