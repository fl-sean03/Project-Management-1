"use client"

import { useState, useEffect } from "react"
import { notFound } from "next/navigation"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  FileText,
  FileImage,
  FileArchive,
  File,
  Plus,
  Search,
  Grid,
  List,
  Download,
  MoreHorizontal,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { projectService, userService, Project, User, File as FileType } from "@/lib/supabase-service"

interface ProjectFilesPageProps {
  params: {
    id: string
  }
}

export default function ProjectFilesPage({ params }: ProjectFilesPageProps) {
  const id = params.id
  
  const [project, setProject] = useState<Project | null>(null)
  const [files, setFiles] = useState<FileType[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [view, setView] = useState("grid")

  // Fetch project, files, and users data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Fetch project
        const { data: projectData, error: projectError } = await projectService.getProjectById(id)
        if (projectError || !projectData) {
          console.error("Error fetching project:", projectError)
          throw new Error(projectError?.message || "Failed to fetch project")
        }
        setProject(projectData)
        
        // For files, we would need a service method to fetch files by project
        // This is a placeholder - you would need to implement this in your service
        // const { data: filesData, error: filesError } = await fileService.getFilesByProject(id)
        // For now, we'll use an empty array
        setFiles([])
        
        // Fetch users
        const { data: usersData, error: usersError } = await userService.getAllUsers()
        if (usersError) {
          console.error("Error fetching users:", usersError)
          throw new Error(usersError.message)
        }
        setUsers(usersData || [])
        
      } catch (err: any) {
        setError(err.message || "An error occurred")
      } finally {
        setLoading(false)
      }
    }
    
    fetchData()
  }, [id])

  // If loading or error, show appropriate UI
  if (loading) {
    return <div className="p-4">Loading files data...</div>
  }
  
  if (error || !project) {
    return notFound()
  }

  // Filter files based on search query and type
  const filteredFiles = files.filter((file) => {
    const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || file.type === typeFilter

    return matchesSearch && matchesType
  })

  const getUser = (userId: string) => {
    return users.find((user) => user.id === userId)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown date";
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date)
  }

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "pdf":
      case "word":
      case "powerpoint":
      case "markdown":
        return <FileText className="h-10 w-10 text-primary-blue" />
      case "figma":
      case "sketch":
      case "image":
      case "png":
      case "jpg":
      case "jpeg":
        return <FileImage className="h-10 w-10 text-secondary-purple" />
      case "zip":
      case "rar":
        return <FileArchive className="h-10 w-10 text-slate" />
      default:
        return <File className="h-10 w-10 text-slate" />
    }
  }

  // Get unique file types for this project
  const fileTypes = Array.from(new Set(files.map((file) => file.type)))

  return (
    <>
      <Header title={`${project.name} - Files`} />
      <div className="p-4 lg:p-6 space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search files..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="File Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {fileTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex rounded-md border">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setView("grid")}
                className={view === "grid" ? "bg-muted" : ""}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setView("list")}
                className={view === "list" ? "bg-muted" : ""}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button className="bg-primary-blue hover:bg-primary-blue/90">
              <Plus className="mr-2 h-4 w-4" />
              Upload File
            </Button>
          </div>
        </div>

        {filteredFiles.length > 0 ? (
          view === "grid" ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredFiles.map((file) => {
                const uploader = getUser(file.uploadedBy)

                return (
                  <Card key={file.id} className="cursor-pointer hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center">
                        <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-md bg-muted">
                          {getFileIcon(file.type)}
                        </div>
                        <h4 className="mb-1 text-center text-sm font-medium">{file.name}</h4>
                        <p className="text-xs text-muted-foreground">{file.size}</p>
                        <div className="mt-2 flex items-center gap-1">
                          {uploader && (
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={uploader.avatar || "/placeholder.svg"} alt={uploader.name} />
                              <AvatarFallback className="text-[10px]">
                                {uploader.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <span className="text-xs text-muted-foreground">{formatDate(file.uploadedAt)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Size</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Uploaded By</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                        <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFiles.map((file) => {
                        const uploader = getUser(file.uploadedBy)

                        return (
                          <tr key={file.id} className="border-b hover:bg-muted/50">
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {getFileIcon(file.type)}
                                <span className="text-sm font-medium">{file.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              {file.type.charAt(0).toUpperCase() + file.type.slice(1)}
                            </td>
                            <td className="px-4 py-3 text-sm">{file.size}</td>
                            <td className="px-4 py-3">
                              {uploader && (
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={uploader.avatar || "/placeholder.svg"} alt={uploader.name} />
                                    <AvatarFallback className="text-xs">
                                      {uploader.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{uploader.name}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm">{formatDate(file.uploadedAt)}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon">
                                  <Download className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>View Details</DropdownMenuItem>
                                    <DropdownMenuItem>Share</DropdownMenuItem>
                                    <DropdownMenuItem>Rename</DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive-red">Delete</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center">
            <h3 className="mb-1 text-lg font-medium">No files found</h3>
            <p className="mb-4 text-sm text-muted-foreground">Upload files to this project to get started</p>
            <Button className="bg-primary-blue hover:bg-primary-blue/90">
              <Plus className="mr-2 h-4 w-4" />
              Upload File
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
