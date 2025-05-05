import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { notFound } from "next/navigation"
import { use } from "react"
import { CheckCircle2, Clock, FolderKanban, Users } from "lucide-react"
import { StatsCard } from "@/components/dashboard/stats-card"
import { TaskList } from "@/components/dashboard/task-list"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { projects } from "@/mock/projects"
import { tasks } from "@/mock/tasks"
import { activities } from "@/mock/activities"
import { Header } from "@/components/layout/header"

interface ProjectPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { id } = use(params)
  
  if (!id) {
    notFound()
  }

  const project = projects.find((p) => p.id === id)

  if (!project) {
    notFound()
  }

  // Filter tasks for this project
  const projectTasks = tasks.filter((task) => task.project === project.id)
  const pendingTasks = projectTasks.filter((task) => task.status !== "Completed")

  // Filter activities for this project
  const projectActivities = activities.filter((activity) => activity.project === project.id)

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
          <StatsCard title="Total Tasks" value={projectTasks.length} icon={FolderKanban} />
          <StatsCard title="Active Tasks" value={pendingTasks.length} icon={Clock} />
          <StatsCard
            title="Completed Tasks"
            value={projectTasks.filter((task) => task.status === "Completed").length}
            icon={CheckCircle2}
          />
          <StatsCard title="Team Members" value={project.team.length} icon={Users} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <TaskList tasks={projectTasks} title="Project Tasks" limit={10} />
          <ActivityFeed activities={projectActivities} limit={10} />
        </div>
      </div>
    </>
  )
}
