"use client"

import React, { createContext, useContext, useState, useCallback } from 'react'
import { Task } from '@/lib/types'
import { taskService } from '@/lib/services'

interface TaskContextType {
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>
  updateTaskStatus: (taskId: string, newStatus: string) => Promise<void>
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([])

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      const { data, error } = await taskService.updateTask(taskId, updates)
      
      if (error) {
        console.error("Error updating task:", error)
        return
      }
      
      if (data && data.length > 0) {
        const updatedTask = data[0]
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId ? { ...task, ...updatedTask } : task
          )
        )
      }
    } catch (err) {
      console.error("Error updating task:", err)
    }
  }, [])

  const updateTaskStatus = useCallback(async (taskId: string, newStatus: string) => {
    try {
      const { data, error } = await taskService.updateTaskStatus(taskId, newStatus)
      
      if (error) {
        console.error("Error updating task status:", error)
        return
      }
      
      if (data && data.length > 0) {
        const updatedTask = data[0]
        setTasks(prevTasks => 
          prevTasks.map(task => 
            task.id === taskId ? { ...task, ...updatedTask } : task
          )
        )
      }
    } catch (err) {
      console.error("Error updating task status:", err)
    }
  }, [])

  return (
    <TaskContext.Provider value={{ tasks, setTasks, updateTask, updateTaskStatus }}>
      {children}
    </TaskContext.Provider>
  )
}

export function useTaskContext() {
  const context = useContext(TaskContext)
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider')
  }
  return context
} 