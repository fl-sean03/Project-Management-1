import type React from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { ProjectAccessProvider } from "@/contexts/project-access-context"
import { AuthProvider } from "@/hooks/auth"

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
        <AuthProvider>
          <ProjectAccessProvider>
            <main className="flex-1 overflow-y-auto">{children}</main>
          </ProjectAccessProvider>
        </AuthProvider>
      </div>
    </div>
  )
}
