import { CheckCircle2, Clock, FolderKanban, Users } from "lucide-react"
import { StatsCard } from "@/components/dashboard/stats-card"
import { ProjectCard } from "@/components/dashboard/project-card"
import { TaskList } from "@/components/dashboard/task-list"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { projects } from "@/mock/projects"
import { tasks } from "@/mock/tasks"
import { activities } from "@/mock/activities"
import { Header } from "@/components/layout/header"

export default function DashboardPage() {
  // Filter tasks that are not completed
  const pendingTasks = tasks.filter((task) => task.status !== "Completed")

  // Get recent projects
  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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
            <div className="grid gap-4 sm:grid-cols-2">
              {recentProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  name={project.name}
                  description={project.description}
                  progress={project.progress}
                  dueDate={project.dueDate}
                  team={project.team}
                  status={project.status}
                  priority={project.priority}
                />
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <TaskList tasks={tasks} title="Upcoming Tasks" limit={5} />
            <ActivityFeed activities={activities} limit={5} />
          </div>
        </div>
      </div>
    </>
  )
}
