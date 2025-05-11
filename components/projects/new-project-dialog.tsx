"use client"

import { useState } from "react"
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
import { projectService } from "@/lib/services"
import { Project } from "@/lib/types"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { PostgrestError } from '@supabase/supabase-js'

type NewProjectDialogProps = {
  children: React.ReactNode;
  onProjectCreated?: (project: Project) => void;
}

export function NewProjectDialog({ children, onProjectCreated }: NewProjectDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [date, setDate] = useState<Date>()
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    priority: "Medium",
    status: "Not Started",
    due_date: "",
    category: "General"
  })
  
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
      if (!formData.name.trim()) {
        setFormError("Project name is required")
        setLoading(false)
        return
      }
      
      // Log what we're sending to the API
      console.log("Creating project with data:", formData)
      
      // Create project in Supabase
      const { data, error } = await projectService.createProject(formData)
      
      if (error) {
        console.error("Error creating project:", error)
        // Handle PostgrestError correctly
        const errorMessage = (error as PostgrestError)?.message || 'Unknown error'
        
        // Check if the error message indicates an auth issue
        if (errorMessage.includes('auth') || errorMessage.includes('login') || errorMessage.includes('Authentication')) {
          setFormError("Authentication error: You need to be logged in to create projects. Please sign in and try again.")
        } else {
          setFormError(`Failed to create project: ${errorMessage}`)
        }
        return
      }
      
      // Log the created project
      console.log("Project created successfully:", data)
      
      // Close dialog and reset form
      setOpen(false)
      setFormData({
        name: "",
        description: "",
        priority: "Medium",
        status: "Not Started",
        due_date: "",
        category: "General"
      })
      setDate(undefined)
      
      // Call onProjectCreated callback if provided
      if (onProjectCreated && data) {
        // Log the raw data returned from Supabase for debugging
        console.log("Raw data returned from insert:", data);
        
        // IMPORTANT FIX: Supabase returns the inserted records in the data property
        // The shape of the returned data is different than expected
        // We need to safely access this data with proper type casting
        let projectData: Partial<Project> = {};
        
        // Handle both formats: array of projects or single project object
        if (Array.isArray(data) && data.length > 0) {
          // When .select() is used with insert(), Supabase returns an array
          projectData = data[0] as Partial<Project>;
        } else if (typeof data === 'object' && data !== null) {
          // In some cases it might return a direct object
          projectData = data as Partial<Project>;
        } else {
          console.error("Unexpected data format from Supabase:", data);
          return; // If we can't process the data, don't continue
        }
        
        // Log the extracted project data
        console.log("Extracted project data:", projectData);
        
        // Make sure all required fields are present before passing to the callback
        const completeProject: Project = {
          id: projectData.id || '',
          name: projectData.name || '',
          description: projectData.description || '',
          team: projectData.team || [],
          progress: projectData.progress || 0,
          priority: projectData.priority || 'Medium',
          status: projectData.status || 'Not Started',
          due_date: projectData.due_date || '',
          created_at: projectData.created_at || new Date().toISOString(),
          category: projectData.category || 'General',
          // Add required fields that might be missing with default values
          tasks: 0,
          completed_tasks: 0,
          start_date: '',
          budget: 0,
          client: '',
          owner_id: projectData.owner_id || '',
          objectives: [],
          milestones: []
        };
        
        // Log the complete project being passed to the callback
        console.log("Complete project passed to callback:", completeProject);
        
        // Pass the complete project to the callback
        onProjectCreated(completeProject);
      }
      
    } catch (error: any) {
      console.error("Error creating project:", error)
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
          name: "",
          description: "",
          priority: "Medium",
          status: "Not Started",
          due_date: "",
          category: "General"
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
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new project to your workspace. Fill out the required fields and click Create when you're done.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid items-center gap-2">
              <Label htmlFor="name">Project Name*</Label>
              <Input
                id="name"
                name="name"
                placeholder="Enter project name"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid items-center gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter project description"
                value={formData.description}
                onChange={handleInputChange}
                className="min-h-[80px]"
              />
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
                    <SelectItem value="Not Started">Not Started</SelectItem>
                    <SelectItem value="Planning">Planning</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
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
            <div className="grid items-center gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleSelectChange("category", value)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Development">Development</SelectItem>
                  <SelectItem value="Design">Design</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Research">Research</SelectItem>
                </SelectContent>
              </Select>
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
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 