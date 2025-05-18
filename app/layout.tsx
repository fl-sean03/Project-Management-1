import type { Metadata } from "next"
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/hooks/auth"
import { Toaster } from "@/components/ui/toaster"
import { GlobalDrawers } from "@/components/global-drawers"
import { TaskProvider } from "@/contexts/task-context"

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
        <TaskProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
            <AuthProvider>
              {children}
              <GlobalDrawers />
              <Toaster />
            </AuthProvider>
          </ThemeProvider>
        </TaskProvider>
      </body>
    </html>
  )
}
