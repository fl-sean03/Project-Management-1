"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, ListTodo, Calendar, FileText, Users, Settings, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Logo } from "@/components/ui/logo"
import { Button } from "@/components/ui/button"
import { projects } from "@/mock/projects"

interface SidebarProps {
  className?: string
  projectId?: string | null
}

export function Sidebar({ className, projectId }: SidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(projectId)

  // Extract project ID from pathname if not provided as prop
  useEffect(() => {
    if (!projectId) {
      const match = pathname.match(/\/project\/([^/]+)/)
      if (match && match[1]) {
        setCurrentProjectId(match[1])
      }
    } else {
      setCurrentProjectId(projectId)
    }
  }, [pathname, projectId])

  const project = currentProjectId ? projects.find((p) => p.id === currentProjectId) : null

  const navItems = currentProjectId
    ? [
        {
          name: "Overview",
          href: `/project/${currentProjectId}`,
          icon: LayoutDashboard,
        },
        {
          name: "Tasks",
          href: `/project/${currentProjectId}/tasks`,
          icon: ListTodo,
        },
        {
          name: "Timeline",
          href: `/project/${currentProjectId}/timeline`,
          icon: Calendar,
        },
        {
          name: "Files",
          href: `/project/${currentProjectId}/files`,
          icon: FileText,
        },
        {
          name: "Team",
          href: `/project/${currentProjectId}/team`,
          icon: Users,
        },
        {
          name: "Settings",
          href: `/project/${currentProjectId}/settings`,
          icon: Settings,
        },
      ]
    : []

  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r bg-white transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className,
      )}
    >
      <div className="flex h-16 items-center justify-between border-b px-4">
        <div className={cn("transition-opacity", collapsed && "opacity-0")}>
          {project ? (
            <h2 className="font-heading text-lg font-semibold truncate">{project.name}</h2>
          ) : (
            <Logo withText />
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => setCollapsed(!collapsed)} className="h-8 w-8">
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </Button>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
              pathname === item.href
                ? "bg-primary-blue/10 text-primary-blue"
                : "text-slate hover:bg-muted hover:text-primary-blue",
              collapsed && "justify-center px-0",
            )}
          >
            <item.icon className={cn("h-5 w-5", collapsed ? "mr-0" : "mr-3")} />
            {!collapsed && <span>{item.name}</span>}
          </Link>
        ))}
      </nav>
    </div>
  )
}
