"use client"

import { usePathname } from "next/navigation"
import { TaskDetailDrawer } from "@/components/tasks/task-detail-drawer"
import { ActivityDetailDrawer } from "@/components/activity/activity-detail-drawer"
import { TeamMemberDetailDrawer } from "@/components/team/team-member-detail-drawer"

export function GlobalDrawers() {
  const pathname = usePathname()
  
  // Don't render drawers on the 404 page
  if (pathname === '/404' || pathname === '/_not-found') {
    return null
  }
  
  return (
    <>
      <TaskDetailDrawer projectId="" />
      <ActivityDetailDrawer projectId="" />
      <TeamMemberDetailDrawer projectId="" />
    </>
  )
} 