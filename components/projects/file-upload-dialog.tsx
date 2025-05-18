"use client"

import { useState, useRef } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select"
import { fileService, notificationService } from "@/lib/services"
import { File as FileRecord } from "@/lib/types"
import { FileIcon, UploadCloud } from "lucide-react"

type FileUploadDialogProps = {
  children: React.ReactNode;
  projectId: string;
  onFileUploaded?: (file: FileRecord) => void;
}

// Define a type for the file selection state
interface FileSelectionState {
  name: string;
  size: string;
  type: string;
  content_type: string;
  rawFile: globalThis.File;
}

// Helper to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' bytes';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  else return (bytes / 1073741824).toFixed(1) + ' GB';
}

// Helper to get file extension and mime type
function getFileInfo(fileName: string): { extension: string, mimeType: string } {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  let mimeType = 'application/octet-stream'; // default
  
  // Common mime types
  const mimeTypes: {[key: string]: string} = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
    'txt': 'text/plain',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    'md': 'text/markdown',
  }
  
  if (extension in mimeTypes) {
    mimeType = mimeTypes[extension];
  }
  
  return { extension, mimeType };
}

export function FileUploadDialog({ children, projectId, onFileUploaded }: FileUploadDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fileSelected, setFileSelected] = useState<FileSelectionState | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    description: "",
    is_public: true,
  })
  
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (!files || files.length === 0) return

    const file = files[0]
    const { extension, mimeType } = getFileInfo(file.name)
    
    setFileSelected({
      name: file.name,
      size: formatFileSize(file.size),
      type: extension,
      rawFile: file,
      content_type: mimeType
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) {
      setFileSelected(null)
      return
    }
    
    const file = files[0]
    const { extension, mimeType } = getFileInfo(file.name)
    
    setFileSelected({
      name: file.name,
      size: formatFileSize(file.size),
      type: extension,
      rawFile: file,  // Store the actual File object with a different property name
      content_type: mimeType
    })
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value === 'true' ? true : false
    }))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setFormError(null)
    setUploadProgress(0)
    
    try {
      // Validate form
      if (!fileSelected || !fileSelected.rawFile) {
        setFormError("Please select a file to upload")
        setLoading(false)
        return
      }
      
      // Create a file path in DO Spaces - projectId/uuid-filename.ext
      const timestamp = new Date().getTime()
      const randomId = Math.random().toString(36).substring(2, 15)
      const safeName = fileSelected.name.replace(/[^a-zA-Z0-9.-]/g, '_')
      const spaceKey = `${projectId}/${timestamp}-${randomId}-${safeName}`
      
      // Create FormData to submit the file and metadata 
      const formDataToSend = new FormData()
      formDataToSend.append('file', fileSelected.rawFile)
      formDataToSend.append('projectId', projectId)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('isPublic', formData.is_public.toString())
      
      console.log("Uploading file:", fileSelected.name);
      console.log("Project ID:", projectId);
      
      // Upload directly to the API route
      const uploadResponse = await fetch('/api/files/upload', {
        method: 'POST',
        body: formDataToSend,
        credentials: 'include' // Include cookies for authentication
      })
      
      // Handle 401 errors specifically
      if (uploadResponse.status === 401) {
        throw new Error("Unauthorized: Check if you're logged in and have permission to upload files. Server might be missing DigitalOcean Spaces credentials.")
      }
      
      const result = await uploadResponse.json()
      
      if (!uploadResponse.ok || !result.success) {
        const errorMessage = result.error || 'Failed to upload file'
        console.error("Upload error:", errorMessage)
        throw new Error(errorMessage)
      }
      
      console.log("File uploaded successfully:", result);
      
      // Reset form
      setOpen(false)
      setFileSelected(null)
      setFormData({
        description: "",
        is_public: true,
      })
      
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      
      // Call onFileUploaded callback
      if (onFileUploaded && result.file) {
        onFileUploaded(result.file as FileRecord)
      }
      
      // Create notification for file upload
      await notificationService.createFileUploadNotification(
        result.file.id,
        result.file.name,
        projectId,
        result.file.uploaded_by
      )
      
    } catch (error: any) {
      console.error("Error uploading file:", error)
      setFormError(`An unexpected error occurred: ${error?.message || 'Unknown error'}`)
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!loading) {
        if (!newOpen) {
          setFileSelected(null)
          setFormData({
            description: "",
            is_public: true,
          })
          setFormError(null)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }
        setOpen(newOpen)
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Upload File</DialogTitle>
            <DialogDescription>
              Upload a file to this project. The file will be available to all project members.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div 
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
                isDragging 
                  ? 'border-primary-blue bg-primary-blue/10' 
                  : fileSelected 
                    ? 'border-primary-blue bg-primary-blue/5' 
                    : 'border-gray-300 hover:border-primary-blue/50'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {!fileSelected ? (
                <>
                  <UploadCloud className={`mb-2 h-10 w-10 ${isDragging ? 'text-primary-blue' : 'text-gray-400'}`} />
                  <p className="mb-1 text-sm font-medium">Drag and drop or click to upload</p>
                  <p className="text-xs text-muted-foreground">Supports files up to 100MB</p>
                </>
              ) : (
                <div className="flex w-full items-center gap-3">
                  <FileIcon className="h-10 w-10 text-primary-blue" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{fileSelected.name}</p>
                    <p className="text-xs text-muted-foreground">{fileSelected.size}</p>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setFileSelected(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                  >
                    Remove
                  </Button>
                </div>
              )}
              <Input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => fileInputRef.current?.click()}
              >
                Select File
              </Button>
            </div>
            
            <div className="grid items-center gap-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter a description for this file"
                value={formData.description}
                onChange={handleInputChange}
                className="min-h-[80px]"
              />
            </div>
            
            <div className="grid items-center gap-2">
              <Label htmlFor="is_public">Access</Label>
              <Select
                value={formData.is_public ? 'true' : 'false'}
                onValueChange={(value) => handleSelectChange("is_public", value)}
              >
                <SelectTrigger id="is_public">
                  <SelectValue placeholder="Select access level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Public (Anyone with the link)</SelectItem>
                  <SelectItem value="false">Private (Project members only)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-primary-blue h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
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
              disabled={loading || !fileSelected}
            >
              {loading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}