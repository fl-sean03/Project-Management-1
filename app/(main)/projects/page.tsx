"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/layout/header"
import { ProjectCard } from "@/components/dashboard/project-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search } from "lucide-react"
import { projectService, Project } from "@/lib/supabase-service"
import { NewProjectDialog } from "@/components/projects/new-project-dialog"
import { useAuth } from "@/lib/auth-context"

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && !user) {
      console.log("User not authenticated, redirecting to login...")
      router.push('/login')
    }
  }, [user, authLoading, router])

  const fetchProjects = async () => {
    console.log("Starting fetchProjects()...");
    setLoading(true)
    setError(null)
    try {
      if (!user) {
        console.log("No authenticated user, not fetching projects")
        setProjects([])
        setLoading(false)
        return
      }

      console.log("Fetching projects for user:", user.id)
      const { data, error } = await projectService.searchProjects(searchQuery, statusFilter, sortBy)
      
      console.log("Raw data returned from searchProjects:", data);
      
      if (error) {
        console.error('Error fetching projects:', error)
        setError('Failed to load projects. Please try again later.')
        return
      }
      
      const projects = data || []
      
      const sanitizedProjects = projects.map(project => ({
        ...project,
        team: project.team || [],
        progress: project.progress || 0,
        priority: project.priority || 'Medium',
        status: project.status || 'Not Started',
        description: project.description || ''
      }))
      
      console.log("Sanitized projects to set state:", sanitizedProjects);
      
      setProjects(sanitizedProjects)
      console.log("Projects state updated successfully");
    } catch (error) {
      console.error('Error fetching projects:', error)
      setError('An unexpected error occurred. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      console.log("useEffect triggered with refreshTrigger:", refreshTrigger);
      fetchProjects();
    }
  }, [searchQuery, statusFilter, sortBy, refreshTrigger, user])

  const handleProjectClick = (projectId: string) => {
    router.push(`/project/${projectId}`)
  }

  const handleProjectCreated = (newProject: Project) => {
    console.log("ProjectsPage received new project:", newProject);
    console.log("Current projects state before update:", projects);
    
    const sanitizedNewProject = {
      ...newProject,
      team: newProject.team || [],
      progress: newProject.progress || 0,
      priority: newProject.priority || 'Medium',
      status: newProject.status || 'Not Started',
      description: newProject.description || ''
    }
    
    console.log("Sanitized project to add to state:", sanitizedNewProject);
    
    setLoading(false);
    
    const updatedProjects = [...projects];
    
    const existingIndex = updatedProjects.findIndex(p => p.id === newProject.id);
    
    if (existingIndex >= 0) {
      console.log("Project already exists in state, updating...");
      updatedProjects[existingIndex] = sanitizedNewProject;
    } else {
      console.log("Adding new project to state...");
      if (sortBy === 'newest') {
        updatedProjects.unshift(sanitizedNewProject);
      } else {
        updatedProjects.push(sanitizedNewProject);
      }
    }
    
    console.log("Setting projects state to:", updatedProjects);
    setProjects(updatedProjects);
    console.log("Projects state after direct update:", updatedProjects);
    
    setTimeout(() => {
      console.log("Refreshing projects from server...");
      setRefreshTrigger(prev => prev + 1);
    }, 500);
  }

  return (
    <>
      <Header title="Projects" showLogo />
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search projects..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Planning">Planning</SelectItem>
                <SelectItem value="Not Started">Not Started</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="due-soon">Due Date (Soon First)</SelectItem>
              </SelectContent>
            </Select>
            <NewProjectDialog onProjectCreated={handleProjectCreated}>
              <Button className="bg-primary-blue hover:bg-primary-blue/90">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </NewProjectDialog>
          </div>
        </div>

        {loading && projects.length === 0 ? (
          <div className="flex h-60 items-center justify-center">
            <p>Loading projects...</p>
          </div>
        ) : error ? (
          <div className="flex h-60 flex-col items-center justify-center rounded-lg border border-dashed bg-white p-8 text-center">
            <h3 className="mb-2 text-lg font-medium text-red-600">Error</h3>
            <p className="mb-4 text-sm text-muted-foreground">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-primary-blue hover:bg-primary-blue/90"
            >
              Try Again
            </Button>
          </div>
        ) : projects.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <div key={project.id} onClick={() => handleProjectClick(project.id)} className="cursor-pointer">
                <ProjectCard
                  id={project.id}
                  name={project.name}
                  description={project.description}
                  progress={project.progress}
                  dueDate={project.due_date}
                  team={project.team}
                  status={project.status}
                  priority={project.priority}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-60 flex-col items-center justify-center rounded-lg border border-dashed bg-white p-8 text-center">
            <h3 className="mb-2 text-lg font-medium">No projects found</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Create your first project to get started"}
            </p>
            <NewProjectDialog onProjectCreated={handleProjectCreated}>
              <Button className="bg-primary-blue hover:bg-primary-blue/90">
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </NewProjectDialog>
          </div>
        )}
      </div>
    </>
  )
}
