"use client"

import { useState, useEffect } from "react"
import { notFound } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { AlertTriangle, Save, Trash } from "lucide-react"
import { projectService } from "@/lib/services"
import { Project } from "@/lib/types"

interface SettingsPageProps {
  params: {
    id: string
  }
}

export default function SettingsPage({ params }: SettingsPageProps) {
  const id = params.id
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [status, setStatus] = useState("")
  const [priority, setPriority] = useState("")
  const [category, setCategory] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [notifications, setNotifications] = useState(true)
  const [publicProject, setPublicProject] = useState(false)

  // Fetch project data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch project
        const { data: projectData, error: projectError } = await projectService.getProjectById(id)
        if (projectError || !projectData) {
          console.error("Error fetching project:", projectError)
          throw new Error(projectError?.message || "Failed to fetch project")
        }
        setProject(projectData)
        
        // Initialize form state with project data
        setName(projectData.name || "")
        setDescription(projectData.description || "")
        setStatus(projectData.status || "")
        setPriority(projectData.priority || "")
        setCategory(projectData.category || "")
        setDueDate(projectData.due_date || "") // Note: using due_date from the DB schema
        
      } catch (err: any) {
        setError(err.message || "An error occurred")
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [id])

  // If loading or error, show appropriate UI
  if (loading) {
    return <div className="p-4">Loading project settings...</div>
  }
  
  if (error || !project) {
    return notFound()
  }

  const handleSave = async () => {
    // In a real app, this would update the project settings in Supabase
    // Example implementation:
    // const { error } = await projectService.updateProject(id, {
    //   name,
    //   description,
    //   status,
    //   priority,
    //   category,
    //   due_date: dueDate
    // });
    
    // if (error) {
    //   console.error("Error saving project:", error);
    //   return;
    // }
    
    alert("Settings saved!")
  }

  return (
    <>
      <Header title={`${project.name} - Settings`} />
      <div className="p-4 lg:p-6 space-y-6">
        <Tabs defaultValue="general">
          <TabsList className="mb-4">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="danger">Danger Zone</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
                <CardDescription>Update your project details and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select value={status} onValueChange={setStatus}>
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
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={priority} onValueChange={setPriority}>
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
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Development">Development</SelectItem>
                        <SelectItem value="Design">Design</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Research">Research</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button className="bg-primary-blue hover:bg-primary-blue/90" onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
                <CardDescription>Configure how you receive notifications for this project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">Receive email updates for important events</p>
                  </div>
                  <Switch checked={notifications} onCheckedChange={setNotifications} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Task Assignments</h4>
                    <p className="text-sm text-muted-foreground">Get notified when you're assigned to a task</p>
                  </div>
                  <Switch checked={true} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Task Comments</h4>
                    <p className="text-sm text-muted-foreground">Get notified when someone comments on your tasks</p>
                  </div>
                  <Switch checked={true} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Due Date Reminders</h4>
                    <p className="text-sm text-muted-foreground">Get reminders before tasks are due</p>
                  </div>
                  <Switch checked={true} />
                </div>
                <div className="flex justify-end">
                  <Button className="bg-primary-blue hover:bg-primary-blue/90" onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions">
            <Card>
              <CardHeader>
                <CardTitle>Project Permissions</CardTitle>
                <CardDescription>Manage who can access and edit this project</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Public Project</h4>
                    <p className="text-sm text-muted-foreground">
                      Make this project visible to everyone in your organization
                    </p>
                  </div>
                  <Switch checked={publicProject} onCheckedChange={setPublicProject} />
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>Access Level</Label>
                  <Select defaultValue="team">
                    <SelectTrigger>
                      <SelectValue placeholder="Select access level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="private">Private (Only specific members)</SelectItem>
                      <SelectItem value="team">Team (All team members)</SelectItem>
                      <SelectItem value="organization">Organization (Everyone in the organization)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end">
                  <Button className="bg-primary-blue hover:bg-primary-blue/90" onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="danger">
            <Card className="border-destructive/50">
              <CardHeader className="text-destructive">
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Actions here can't be undone. Be careful when making changes in this section.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border border-destructive/50 p-4">
                  <h4 className="font-medium text-destructive">Archive Project</h4>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Archiving will hide this project from active views but preserve all data.
                  </p>
                  <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                    Archive Project
                  </Button>
                </div>
                <div className="rounded-md border border-destructive/50 p-4">
                  <h4 className="font-medium text-destructive">Delete Project</h4>
                  <p className="mb-4 text-sm text-muted-foreground">
                    This action cannot be undone. All project data will be permanently removed.
                  </p>
                  <Button variant="destructive">
                    <Trash className="mr-2 h-4 w-4" />
                    Delete Project
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
