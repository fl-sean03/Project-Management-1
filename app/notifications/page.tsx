"use client"

import { useEffect, useState } from "react"
import { notificationService } from "@/lib/services"
import type { Notification } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check, ChevronLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const { data, error } = await notificationService.getNotifications()
      if (error) throw error
      if (data) setNotifications(data)
    } catch (err) {
      console.error("Error fetching notifications:", err)
      setError("Failed to load notifications")
    } finally {
      setLoading(false)
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
    } catch (err) {
      console.error("Error marking notification as read:", err)
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      const { error } = await notificationService.markAllAsRead()
      if (error) throw error
      // Update local state
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, read: true }))
      )
    } catch (err) {
      console.error("Error marking all notifications as read:", err)
    }
  }

  const handleBack = () => {
    router.back()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Notifications" showLogo />
      
      <main className="container mx-auto py-8">
        <div className="mb-6 flex items-center gap-4">
          <Button
            variant="ghost"
            
            onClick={handleBack}
            className="h-8"
          >
            <ChevronLeft className="h-6 w-6" />
            <span className="">Back</span>
          </Button>
          
          {notifications.length > 0 && (
            <Button
              variant="outline"
              onClick={handleMarkAllAsRead}
              className="ml-auto flex items-center gap-2"
            >
              <Check className="h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex h-[calc(100vh-12rem)] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-blue border-t-transparent"></div>
          </div>
        ) : error ? (
          <div className="flex h-[calc(100vh-12rem)] items-center justify-center">
            <div className="text-red-500">{error}</div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex h-[calc(100vh-12rem)] items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="text-lg">No notifications</p>
              <p className="mt-2 text-sm">You're all caught up!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`rounded-lg border bg-white p-4 shadow-sm ${
                  notification.read ? "" : "border-blue-200"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link
                      href={notification.link}
                      className="block text-sm hover:underline"
                    >
                      {notification.content}
                    </Link>
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
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="ml-4"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
} 