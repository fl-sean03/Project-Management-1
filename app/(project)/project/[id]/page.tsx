import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { notFound } from "next/navigation"
import { Suspense } from "react"
import { CheckCircle2, Clock, FolderKanban, Users } from "lucide-react"
import { StatsCard } from "@/components/dashboard/stats-card"
import { TaskList } from "@/components/dashboard/task-list"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { Header } from "@/components/layout/header"
import { projectService, taskService, activityService } from "@/lib/services"
import { ActivityDetailDrawer } from "@/components/activity/activity-detail-drawer"

interface ProjectPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  // Using the await approach instead of React.use()
  const { id } = await params
  
  if (!id) {
    notFound()
  }

  // Fetch project data from Supabase
  const { data: projectData, error: projectError } = await projectService.getProjectById(id)

  if (projectError || !projectData) {
    console.error("Error fetching project:", projectError)
    notFound()
  }
  
  // Sanitize project data to handle missing fields
  const project = {
    ...projectData,
    name: projectData.name || 'Untitled Project',
    description: projectData.description || 'No description available',
    status: projectData.status || 'Not Started',
    priority: projectData.priority || 'Medium',
    progress: projectData.progress || 0,
    team: Array.isArray(projectData.team) ? projectData.team : []
  }

  // Fetch tasks for this project
  const { data: projectTasks = [], error: tasksError } = await taskService.getTasksByProject(project.id)
  
  if (tasksError) {
    console.error("Error fetching tasks:", tasksError)
  }
  
  // Ensure projectTasks is an array, even if null was returned
  const tasks = (projectTasks || [])
  const pendingTasks = tasks.filter((task) => task.status !== "Completed")

  // Fetch activities for this project
  const { data: projectActivities = [], error: activitiesError } = await activityService.getActivitiesByProject(project.id)
  
  if (activitiesError) {
    console.error("Error fetching activities:", activitiesError)
  }
  
  // Ensure projectActivities is an array, even if null was returned
  const activities = (projectActivities || [])

  return (
    <>
      <Header title={project.name} />
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex items-center gap-2">
            <Badge
              className={
                project.status === "Completed"
                  ? "bg-success-green text-white"
                  : project.status === "In Progress"
                    ? "bg-primary-blue text-white"
                    : project.status === "Planning"
                      ? "bg-secondary-purple text-white"
                      : "bg-slate text-white"
              }
            >
              {project.status}
            </Badge>
            <Badge
              className={
                project.priority === "High"
                  ? "bg-destructive-red/10 text-destructive-red"
                  : project.priority === "Medium"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-slate-100 text-slate-800"
              }
            >
              {project.priority}
            </Badge>
          </div>
          <p className="text-muted-foreground">{project.description}</p>
          <div className="mt-2">
            <div className="mb-1 flex justify-between text-sm">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>
            <Progress value={project.progress} className="h-2" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard title="Total Tasks" value={tasks.length} icon={FolderKanban} />
          <StatsCard title="Active Tasks" value={pendingTasks.length} icon={Clock} />
          <StatsCard
            title="Completed Tasks"
            value={tasks.filter((task) => task.status === "Completed").length}
            icon={CheckCircle2}
          />
          <StatsCard title="Team Members" value={project.team.length} icon={Users} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <TaskList tasks={tasks} title="Project Tasks" limit={10} />
          <ActivityFeed activities={activities} limit={10} />
        </div>
      </div>
      <ActivityDetailDrawer projectId={id} />
    </>
  )
}
