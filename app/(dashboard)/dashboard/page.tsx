import { CheckCircle2, Clock, FolderKanban, Users } from "lucide-react"
import { StatsCard } from "@/components/dashboard/stats-card"
import { ProjectCard } from "@/components/dashboard/project-card"
import { TaskList } from "@/components/dashboard/task-list"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { Header } from "@/components/layout/header"
import { projectService, taskService, activityService } from "@/lib/services"
import { Task, Activity, Project } from "@/lib/types"

export default async function DashboardPage() {
  // Fetch projects from Supabase
  const { data: projectsData = [], error: projectsError } = await projectService.getAllProjects()
  if (projectsError) {
    console.error("Error fetching projects:", projectsError)
  }
  
  // Ensure projects is an array, even if null was returned
  const projectsRaw = (projectsData || []) as Project[]
  
  // Sanitize project data to handle null values
  const projects = projectsRaw.map(project => ({
    ...project,
    team: project.team || [],
    progress: project.progress || 0,
    priority: project.priority || 'Medium',
    status: project.status || 'Not Started',
    description: project.description || '',
    due_date: project.due_date || new Date().toISOString()
  }))
  
  // Fetch tasks from Supabase - we'll get all tasks for simplicity in this example
  let tasks: Task[] = []
  try {
    if (projects.length > 0) {
      const allTasksPromises = projects.map(project => taskService.getTasksByProject(project.id))
      const allTaskResults = await Promise.all(allTasksPromises)
      
      // Flatten and filter out errors
      tasks = allTaskResults
        .filter(result => !result.error && result.data)
        .flatMap(result => result.data || [])
    }
  } catch (error) {
    console.error("Error fetching tasks:", error)
  }
  
  // Filter tasks that are not completed
  const pendingTasks = tasks.filter((task) => task.status !== "Completed")

  // Get all activities for the dashboard
  let activities: Activity[] = []
  try {
    if (projects.length > 0) {
      const allActivitiesPromises = projects.map(project => activityService.getActivitiesByProject(project.id))
      const allActivitiesResults = await Promise.all(allActivitiesPromises)
      
      // Flatten and filter out errors
      activities = allActivitiesResults
        .filter(result => !result.error && result.data)
        .flatMap(result => result.data || [])
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)  // Get only the 5 most recent activities
    }
  } catch (error) {
    console.error("Error fetching activities:", error)
  }

  // Get recent projects
  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
    .slice(0, 3)

  return (
    <>
      <Header title="Dashboard" />
      <div className="p-4 lg:p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Projects"
            value={projects.length}
            icon={FolderKanban}
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="Active Tasks"
            value={pendingTasks.length}
            icon={Clock}
            trend={{ value: 8, isPositive: true }}
          />
          <StatsCard
            title="Completed Tasks"
            value={tasks.filter((task) => task.status === "Completed").length}
            icon={CheckCircle2}
            trend={{ value: 24, isPositive: true }}
          />
          <StatsCard title="Team Members" value={5} icon={Users} trend={{ value: 2, isPositive: true }} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 text-xl font-bold">Recent Projects</h2>
            {recentProjects.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {recentProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    id={project.id}
                    name={project.name}
                    description={project.description}
                    progress={project.progress}
                    dueDate={project.due_date}
                    team={project.team}
                    status={project.status}
                    priority={project.priority}
                  />
                ))}
              </div>
            ) : (
              <div className="p-4 text-center border border-dashed rounded-md">
                <p>No projects found. Create your first project to get started.</p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <TaskList tasks={tasks.slice(0, 5)} title="Upcoming Tasks" limit={5} />
            <ActivityFeed activities={activities} limit={5} />
          </div>
        </div>
      </div>
    </>
  )
}
