"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Bell, Search, Menu, ChevronLeft, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "@/components/layout/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { currentUser } from "@/mock/users"
import { notifications } from "@/mock/notifications"
import { Logo } from "@/components/ui/logo"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from "@/hooks/auth"
import { TeamInviteDialog } from "@/components/projects/team-invite-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationsDropdown } from "@/components/notifications/notifications-dropdown"
import { getSupabaseClient } from "@/lib/services/supabase-client"

interface HeaderProps {
  title?: string
  showLogo?: boolean
  projectId?: string
  onMemberAdded?: (user: any) => void
}

export function Header({ title, showLogo = false, projectId, onMemberAdded }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [userAvatar, setUserAvatar] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const { signOut, user } = useAuth()

  const isProjectPage = pathname.includes("/project/")
  const currentProjectId = isProjectPage ? pathname.split("/")[2] : projectId

  useEffect(() => {
    const fetchUserAvatar = async () => {
      if (!user?.id) return;
      
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('users')
        .select('avatar')
        .eq('id', user.id)
        .single();

      if (!error && data?.avatar) {
        setUserAvatar(data.avatar);
      }
    };

    fetchUserAvatar();
  }, [user?.id]);

  const handleBackToProjects = () => {
    router.push("/projects")
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      // The auth context will handle the redirect
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6">
      <div className="flex items-center gap-4">
        {isProjectPage ? (
          <Button variant="ghost" size="icon" onClick={handleBackToProjects} className="mr-2">
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Back to projects</span>
          </Button>
        ) : null}

        {isProjectPage && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
              <Sidebar projectId={currentProjectId} />
            </SheetContent>
          </Sheet>
        )}

        {showLogo && <Logo withText />}

        {title && <h1 className="text-xl font-bold tracking-tight">{title}</h1>}
      </div>

      <div className="flex flex-1 items-center justify-end gap-4">
        {currentProjectId && (
          <TeamInviteDialog 
            projectId={currentProjectId}
            onMemberAdded={onMemberAdded}
          >
            <Button className="bg-primary-blue rounded-full hover:bg-primary-blue/90">
              <Plus className="h-6 w-6" />
              
            </Button>
          </TeamInviteDialog>
        )}

        <div className="relative hidden w-full max-w-sm lg:block">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full bg-muted pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <NotificationsDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={userAvatar || "/placeholder.svg"} alt={user?.user_metadata?.name || currentUser.name} />
                <AvatarFallback>
                  {(user?.user_metadata?.name || currentUser.name)
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/profile/${user?.id}`}>Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
