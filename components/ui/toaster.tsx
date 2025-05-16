"use client"

import { useState, useEffect } from "react"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"

export function Toaster() {
  const { toast } = useToast()
  const [toasts, setToasts] = useState<any[]>([])

  useEffect(() => {
    // This creates a listener that updates our state when toasts change
    const listeners = (state: any) => {
      setToasts(state.toasts)
    }
    
    // Add listener to the useToast hook
    const unsubscribe = toast.subscribe(listeners)
    
    // Clean up on unmount
    return () => {
      unsubscribe()
    }
  }, [toast])

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && (
              <ToastDescription>{description}</ToastDescription>
            )}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
