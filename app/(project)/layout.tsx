import type React from "react"
import { Sidebar } from "@/components/layout/sidebar"

interface ProjectLayoutProps {
  children: React.ReactNode
  params: Promise<{ id?: string }>
}

export default async function ProjectLayout({ children, params }: Readonly<ProjectLayoutProps>) {
  // Resolve params using await
  const resolvedParams = await params;
  const projectId = resolvedParams.id || null;
  
  return (
    <div className="flex h-screen bg-cloud-gray">
      <Sidebar className="hidden lg:block" projectId={projectId} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
