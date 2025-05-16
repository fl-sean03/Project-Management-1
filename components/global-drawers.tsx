"use client"

import { usePathname } from "next/navigation"
import { TaskDetailDrawer } from "@/components/tasks/task-detail-drawer"
import { ActivityDetailDrawer } from "@/components/activity/activity-detail-drawer"
import { TeamMemberDetailDrawer } from "@/components/team/team-member-detail-drawer"
import { Suspense } from "react"

function DrawersContent() {
  const pathname = usePathname()
  
  // Don't render drawers on the 404 page or debug page
  if (pathname === '/404' || pathname === '/_not-found' || pathname === '/debug') {
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

export function GlobalDrawers() {
  return (
    <Suspense fallback={null}>
      <DrawersContent />
    </Suspense>
  )
} 