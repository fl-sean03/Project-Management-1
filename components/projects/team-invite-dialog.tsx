"use client"

import { useState } from "react"
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { projectService, userService, User } from "@/lib/supabase-service"
import { useToast } from "@/components/ui/use-toast"

type TeamInviteDialogProps = {
  children: React.ReactNode;
  projectId: string;
  onMemberAdded?: (user: User) => void;
}

export function TeamInviteDialog({ children, projectId, onMemberAdded }: TeamInviteDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("member")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const { toast } = useToast()

  const handleEmailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    setSelectedUser(null)
    setFormError(null)
    
    if (value.trim().length > 2) {
      try {
        // Search users by email
        const { data, error } = await userService.searchUsersByEmail(value.trim())
        if (error) throw error
        setSearchResults(data || [])
      } catch (error) {
        console.error("Error searching users:", error)
        setSearchResults([])
      }
    } else {
      setSearchResults([])
    }
  }

  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
    setEmail(user.email)
    setSearchResults([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFormError(null)
    
    try {
      if (!selectedUser) {
        setFormError("Please select a valid user")
        return
      }
      
      // Check if user is already a member
      const { data: existingMembers, error: checkError } = await projectService.getProjectMembers(projectId)
      
      if (checkError) {
        throw new Error("Failed to check existing members")
      }
      
      const isAlreadyMember = existingMembers?.some(member => member.user_id === selectedUser.id)
      
      if (isAlreadyMember) {
        setFormError("This user is already a member of this project")
        return
      }
      
      // Add user to project
      const { error } = await projectService.addProjectMember(
        projectId, 
        selectedUser.id,
        role
      )
      
      if (error) {
        throw new Error(`Failed to add team member: ${error.message}`)
      }
      
      // Success
      toast({
        title: "Team member added",
        description: `${selectedUser.name} has been added to the project.`,
      })
      
      // Reset form
      setOpen(false)
      setEmail("")
      setRole("member")
      setSelectedUser(null)
      
      // Call callback
      if (onMemberAdded) {
        onMemberAdded(selectedUser)
      }
      
    } catch (error: any) {
      console.error("Error adding team member:", error)
      setFormError(`An unexpected error occurred: ${error?.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!loading) {
        if (!newOpen) {
          setEmail("")
          setRole("member")
          setSelectedUser(null)
          setFormError(null)
          setSearchResults([])
        }
        setOpen(newOpen)
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Add a team member to collaborate on this project.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid items-center gap-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Input
                  id="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={handleEmailChange}
                  autoComplete="off"
                />
                {searchResults.length > 0 && !selectedUser && (
                  <div className="absolute left-0 right-0 z-10 mt-1 max-h-60 overflow-auto rounded-md border bg-background p-1 shadow-md">
                    {searchResults.map(user => (
                      <div
                        key={user.id}
                        className="flex items-center gap-2 p-2 cursor-pointer hover:bg-muted rounded"
                        onClick={() => handleUserSelect(user)}
                      >
                        <div className="h-6 w-6 rounded-full bg-primary-blue text-white flex items-center justify-center text-xs font-medium">
                          {user.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{user.name}</p>
                          <p className="text-xs text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="grid items-center gap-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {selectedUser && (
              <div className="flex items-center gap-2 p-2 rounded bg-muted">
                <div className="h-8 w-8 rounded-full bg-primary-blue text-white flex items-center justify-center text-sm font-medium">
                  {selectedUser.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-medium">{selectedUser.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
            )}
            
            {formError && (
              <div className="text-sm text-destructive-red">{formError}</div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-primary-blue hover:bg-primary-blue/90"
              disabled={loading || !selectedUser}
            >
              {loading ? "Adding..." : "Add to Project"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 