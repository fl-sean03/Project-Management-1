"use client"

import { useState, useEffect } from "react"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { taskService } from "@/lib/services"
import { Task, User } from "@/lib/types"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type NewTaskDialogProps = {
  children: React.ReactNode;
  projectId: string;
  users: User[];
  onTaskCreated?: (task: Task) => void;
  initialDueDate?: Date | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NewTaskDialog({ 
  children, 
  projectId, 
  users, 
  onTaskCreated, 
  initialDueDate,
  open: controlledOpen,
  onOpenChange
}: NewTaskDialogProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [date, setDate] = useState<Date | undefined>(initialDueDate || undefined)
  
  // Use controlled or uncontrolled open state
  const open = controlledOpen ?? uncontrolledOpen
  const setOpen = onOpenChange ?? setUncontrolledOpen

  // Default values for the form
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "Medium",
    status: "To Do",
    due_date: initialDueDate ? initialDueDate.toISOString().split('T')[0] : "",
    assignee_id: "unassigned",
    project_id: projectId,
    estimated_hours: 0
  })
  
  // Update date when initialDueDate changes
  useEffect(() => {
    if (initialDueDate) {
      setDate(initialDueDate)
      setFormData(prev => ({
        ...prev,
        due_date: initialDueDate.toISOString().split('T')[0]
      }))
    }
  }, [initialDueDate])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleNumberChange = (name: string, value: string) => {
    const numValue = parseFloat(value) || 0
    setFormData(prev => ({
      ...prev,
      [name]: numValue
    }))
  }
  
  const handleDateChange = (newDate: Date | undefined) => {
    setDate(newDate)
    if (newDate) {
      // Format date as YYYY-MM-DD for PostgreSQL
      const formattedDate = newDate.toISOString().split('T')[0];
      setFormData(prev => ({
        ...prev,
        due_date: formattedDate
      }))
    } else {
      // Clear the date if no date is selected
      setFormData(prev => ({
        ...prev,
        due_date: ""
      }))
    }
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFormError(null)
    
    try {
      // Validate form
      if (!formData.title.trim()) {
        setFormError("Task title is required")
        setLoading(false)
        return
      }
      
      // Log what we're sending to the API
      console.log("Creating task with data:", formData)
      
      // Create a copy of the form data and handle the unassigned case
      const taskToCreate = {
        ...formData,
        // Convert "unassigned" to undefined for the database
        assignee_id: formData.assignee_id === "unassigned" ? undefined : formData.assignee_id
      }
      
      // Create task in Supabase
      const { data, error } = await taskService.createTask(taskToCreate)
      
      if (error) {
        console.error("Error creating task:", error)
        setFormError(`Failed to create task: ${error.message}`)
        return
      }
      
      // Log the created task
      console.log("Task created successfully:", data)
      
      // Close dialog and reset form
      setOpen(false)
      setFormData({
        title: "",
        description: "",
        priority: "Medium",
        status: "To Do",
        due_date: "",
        assignee_id: "unassigned",
        project_id: projectId,
        estimated_hours: 0
      })
      setDate(undefined)
      
      // Call onTaskCreated callback if provided
      if (onTaskCreated && data && data.length > 0) {
        onTaskCreated(data[0] as Task)
      }
      
    } catch (error: any) {
      console.error("Error creating task:", error)
      setFormError(`An unexpected error occurred: ${error?.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      // When dialog is closed, reset the form
      if (!newOpen) {
        setFormData({
          title: "",
          description: "",
          priority: "Medium",
          status: "To Do",
          due_date: "",
          assignee_id: "unassigned",
          project_id: projectId,
          estimated_hours: 0
        });
        setDate(undefined);
        setFormError(null);
      }
      setOpen(newOpen);
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to this project. Fill out the required fields and click Create when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid items-center gap-2">
              <Label htmlFor="title">Task Title*</Label>
              <Input
                id="title"
                name="title"
                placeholder="Enter task title"
                value={formData.title}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid items-center gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter task description"
                value={formData.description}
                onChange={handleInputChange}
                className="min-h-[80px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid items-center gap-2">
                <Label htmlFor="assignee_id">Assignee</Label>
                <Select
                  value={formData.assignee_id}
                  onValueChange={(value) => handleSelectChange("assignee_id", value)}
                >
                  <SelectTrigger id="assignee_id">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid items-center gap-2">
                <Label htmlFor="estimated_hours">Estimated Hours</Label>
                <Input
                  id="estimated_hours"
                  name="estimated_hours"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="0"
                  value={formData.estimated_hours}
                  onChange={(e) => handleNumberChange("estimated_hours", e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid items-center gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleSelectChange("priority", value)}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low">Low</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid items-center gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleSelectChange("status", value)}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="To Do">To Do</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Review">Review</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid items-center gap-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={handleDateChange}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            {formError && (
              <div className="text-sm text-destructive-red">{formError}</div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary-blue hover:bg-primary-blue/90" disabled={loading}>
              {loading ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 