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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("newest")
  const router = useRouter()

  const fetchProjects = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await projectService.searchProjects(searchQuery, statusFilter, sortBy)
      
      if (error) {
        console.error('Error fetching projects:', error)
        setError('Failed to load projects. Please try again later.')
        return
      }
      
      // Make sure we have an array even if data is null
      const projects = data || []
      
      // Ensure each project has the required fields
      const sanitizedProjects = projects.map(project => ({
        ...project,
        team: project.team || [],
        progress: project.progress || 0,
        priority: project.priority || 'Medium',
        status: project.status || 'Not Started',
        description: project.description || ''
      }))
      
      setProjects(sanitizedProjects)
    } catch (error) {
      console.error('Error fetching projects:', error)
      setError('An unexpected error occurred. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [searchQuery, statusFilter, sortBy])

  const handleProjectClick = (projectId: string) => {
    router.push(`/project/${projectId}`)
  }

  const handleProjectCreated = (newProject: Project) => {
    // Refresh the projects list after creating a new project
    fetchProjects()
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

        {loading ? (
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
