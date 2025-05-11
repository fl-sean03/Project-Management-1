import type React from "react"
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/hooks/auth"
import { TaskDetailDrawer } from "@/components/tasks/task-detail-drawer"
import { TeamMemberDetailDrawer } from "@/components/team/team-member-detail-drawer"
import { ActivityDetailDrawer } from "@/components/activity/activity-detail-drawer"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600", "700"],
})

export const metadata = {
  title: "Zyra - Organize Everything Effortlessly",
  description: "Simplify and streamline how individuals and teams plan, manage, and complete work.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            {children}
            {/* Add global drawer instances so they're available throughout the app */}
            <TaskDetailDrawer projectId="" />
            <TeamMemberDetailDrawer projectId="" />
            <ActivityDetailDrawer projectId="" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
