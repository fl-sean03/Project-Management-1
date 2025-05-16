"use client"

import { useState, useEffect } from "react"
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
import { projectService, userService, emailService } from "@/lib/services"
import { User } from "@/lib/types"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/hooks/auth"

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
  const [projectName, setProjectName] = useState("")
  const [useManualEmail, setUseManualEmail] = useState(false)
  const { toast } = useToast()
  const { user: currentUser } = useAuth()

  // Get project name for invitation email
  useEffect(() => {
    if (projectId && open) {
      const fetchProjectName = async () => {
        try {
          const { data, error } = await projectService.getProjectById(projectId)
          if (error) throw error
          if (data) {
            setProjectName(data.name)
          }
        } catch (err) {
          console.error("Error fetching project name:", err)
        }
      }
      
      fetchProjectName()
    }
  }, [projectId, open])

  const handleEmailChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setEmail(value)
    setSelectedUser(null)
    setFormError(null)
    setUseManualEmail(false)
    
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
    setUseManualEmail(false)
  }
  
  const handleUseEmail = () => {
    if (email && email.includes('@') && email.includes('.')) {
      setUseManualEmail(true)
      setSearchResults([])
    } else {
      setFormError("Please enter a valid email address")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFormError(null)
    
    try {
      // For existing users
      if (selectedUser) {
        // Add existing user to project
        const { data, error } = await projectService.addProjectMember(
          projectId, 
          selectedUser.id,
          role
        )
        
        if (error) {
          if (typeof error === 'object' && error !== null && 'code' in error && error.code === "23505") {
            setFormError("This user is already a member of this project")
            setLoading(false)
            return
          }
          throw new Error(`Failed to add team member: ${error instanceof Error ? error.message : JSON.stringify(error)}`)
        }
        
        // Check if this was an existing membership
        const isExistingMember = data && !Array.isArray(data)
        
        // Send invitation email - only if this is a new member
        if (!isExistingMember && currentUser) {
          try {
            await emailService.sendTeamInvitation({
              projectName,
              projectId,
              memberName: selectedUser.name,
              memberEmail: selectedUser.email,
              inviterName: currentUser.user_metadata?.name || 'A team member',
              role
            });
          } catch (emailError) {
            console.error("Error sending invitation email:", emailError);
            // Don't fail the process if email fails, just log it
          }
        }
        
        // Success
        toast({
          title: isExistingMember ? "Already a team member" : "Team member added",
          description: isExistingMember 
            ? `${selectedUser.name} is already part of this project.`
            : `${selectedUser.name} has been added to the project and invitation email sent.`,
        })
        
        // Call callback - only if this is a new member and the callback exists
        if (!isExistingMember && onMemberAdded) {
          // Add projectRole to user object
          const userWithRole = {
            ...selectedUser,
            projectRole: role,
            // Make sure we have consistent field names
            joined_date: selectedUser.joined_date || new Date().toISOString(),
            last_active: new Date().toISOString()
          };
          onMemberAdded(userWithRole);
        }
      } 
      // For email invites (non-existing users)
      else if (useManualEmail) {
        if (!email || !email.includes('@') || !email.includes('.')) {
          setFormError("Please enter a valid email address")
          setLoading(false)
          return
        }
        
        // Use the inviteUserByEmail function
        const { data, error } = await projectService.inviteUserByEmail(
          projectId,
          email,
          role
        )
        
        if (error) {
          throw new Error(`Failed to invite user: ${error instanceof Error ? error.message : JSON.stringify(error)}`)
        }
        
        // If the server returned data, it means the invitation was successful
        if (data) {
          // Try to send an invitation email
          if (currentUser) {
            try {
              await emailService.sendTeamInvitation({
                projectName,
                projectId,
                memberName: email.split('@')[0], // Use part of email as name
                memberEmail: email,
                inviterName: currentUser.user_metadata?.name || 'A team member',
                role
              });
            } catch (emailError) {
              console.error("Error sending invitation email:", emailError);
              // Don't fail the process if email fails, just log it
            }
          }
          
          // Show success toast
          toast({
            title: "Invitation sent",
            description: `An invitation has been sent to ${email}. They'll be added to the project when they sign up.`,
          })
        }
      } else {
        setFormError("Please select a user or enter a valid email address")
        setLoading(false)
        return
      }
      
      // Reset form
      setOpen(false)
      setEmail("")
      setRole("member")
      setSelectedUser(null)
      setUseManualEmail(false)
      
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
          setUseManualEmail(false)
        }
        setOpen(newOpen)
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="md:max-w-[525px] max-w-[95vw]">
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
                {searchResults.length > 0 && !selectedUser && !useManualEmail && (
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
                    
                    {/* Option to invite by email if no exact match */}
                    {email && email.includes('@') && (
                      <div
                        className="flex items-center gap-2 p-2 cursor-pointer hover:bg-muted rounded mt-1 border-t pt-2"
                        onClick={handleUseEmail}
                      >
                        <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-medium">
                          +
                        </div>
                        <div>
                          <p className="text-sm font-medium">Invite by email</p>
                          <p className="text-xs text-muted-foreground">{email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Show when manually entering an email */}
              {!selectedUser && email && !searchResults.length && email.includes('@') && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={handleUseEmail}
                  className="mt-1"
                >
                  Invite {email} to join the project
                </Button>
              )}
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
            
            {useManualEmail && (
              <div className="flex items-center gap-2 p-2 rounded bg-muted">
                <div className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                  @
                </div>
                <div>
                  <p className="text-sm font-medium">Invite by Email</p>
                  <p className="text-xs text-muted-foreground">{email}</p>
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
              disabled={loading || (!selectedUser && !useManualEmail)}
            >
              {loading ? "Processing..." : (selectedUser ? "Add to Project" : "Send Invitation")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 