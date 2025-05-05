import type React from "react"
import { use } from "react"
import { Sidebar } from "@/components/layout/sidebar"

export default function ProjectLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode
  params: Promise<{ id?: string }>
}>) {
  const resolvedParams = use(params)
  
  // Extract projectId from the URL path
  const pathname = typeof window !== "undefined" ? window.location.pathname : ""
  const projectIdMatch = pathname.match(/\/project\/([^/]+)/)
  const projectId = projectIdMatch ? projectIdMatch[1] : resolvedParams.id || null

  return (
    <div className="flex h-screen bg-cloud-gray">
      <Sidebar className="hidden lg:block" projectId={projectId} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  )
}
