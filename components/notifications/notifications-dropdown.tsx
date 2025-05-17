"use client"

import { useEffect, useState } from "react"
import { notificationService } from "@/lib/services"
import type { Notification } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Bell } from "lucide-react"
import { useRouter } from "next/navigation"

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const router = useRouter()

  useEffect(() => {
    fetchNotifications()
    fetchUnreadCount()

    // Set up polling for new notifications
    const interval = setInterval(() => {
      fetchNotifications()
      fetchUnreadCount()
    }, 30000) // Poll every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const fetchNotifications = async () => {
    try {
      const { data, error } = await notificationService.getNotifications()
      if (error) throw error
      if (data) {
        // Only show the 5 most recent notifications in the dropdown
        setNotifications(data.slice(0, 5))
      }
    } catch (err) {
      console.error("Error fetching notifications:", err)
    }
  }

  const fetchUnreadCount = async () => {
    try {
      const { count, error } = await notificationService.getUnreadCount()
      if (error) throw error
      setUnreadCount(count)
    } catch (err) {
      console.error("Error fetching unread count:", err)
    }
  }

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const { error } = await notificationService.markAsRead(notificationId)
      if (error) throw error
      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error("Error marking notification as read:", err)
    }
  }

  const handleViewAll = () => {
    router.push("/notifications")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between p-2">
          <h4 className="text-sm font-medium">Notifications</h4>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewAll}
              className="text-xs"
            >
              View all
            </Button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-2 text-center text-sm text-gray-500">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className={`flex flex-col items-start p-2 ${
                  !notification.read ? "bg-blue-50" : ""
                }`}
                asChild
              >
                <Link href={notification.link} className="w-full">
                  <div className="flex w-full items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm">{notification.content}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          handleMarkAsRead(notification.id)
                        }}
                        className="ml-2"
                      >
                        <span className="sr-only">Mark as read</span>
                        <div className="h-2 w-2 rounded-full bg-blue-500" />
                      </Button>
                    )}
                  </div>
                </Link>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 