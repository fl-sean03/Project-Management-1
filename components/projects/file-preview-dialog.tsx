"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { FileIcon } from "@/components/file/file-icon"
import { Download, ExternalLink } from "lucide-react"
import { getSupabaseClient } from "@/lib/services/supabase-client"

interface FilePreviewDialogProps {
  children: React.ReactNode
  file: {
    id: string
    name: string
    type: string
    size: string
    uploadedBy: string
    uploadedAt: string
  }
}

export function FilePreviewDialog({ children, file }: FilePreviewDialogProps) {
  const [open, setOpen] = useState(false)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchFileData = async () => {
      if (!open) return
      
      try {
        setLoading(true)
        const supabase = getSupabaseClient()
        
        // Get file metadata from database
        const { data: fileData, error: fileError } = await supabase
          .from('files')
          .select('*')
          .eq('id', file.id)
          .single()

        if (fileError || !fileData) {
          throw new Error('File not found')
        }

        const fileType = file.type.toLowerCase()
        const isTextFile = ['txt', 'md', 'json', 'csv', 'html', 'css', 'js', 'ts', 'py', 'java', 'c', 'cpp'].includes(fileType)

        // For text files, fetch the content directly
        if (isTextFile) {
          try {
            // Get a signed URL for the file
            const response = await fetch(`/api/files/download?key=${fileData.space_key}`)
            if (!response.ok) {
              throw new Error('Failed to get download URL')
            }
            const { url } = await response.json()

            // Fetch the content using the signed URL
            const contentResponse = await fetch(url)
            if (!contentResponse.ok) {
              throw new Error('Failed to fetch file content')
            }

            const text = await contentResponse.text()
            setFileContent(text)
          } catch (err) {
            console.error('Error fetching text file:', err)
            throw new Error('Failed to fetch file content')
          }
          return
        }

        // For public files, use the direct URL
        if (fileData.is_public) {
          const publicUrl = `https://${fileData.space_name}.${process.env.NEXT_PUBLIC_SPACES_REGION}.digitaloceanspaces.com/${fileData.space_key}`
          setFileUrl(publicUrl)
          return
        }

        // For private files, get a signed URL
        const response = await fetch(`/api/files/download?key=${fileData.space_key}`)
        if (!response.ok) {
          throw new Error('Failed to get download URL')
        }
        const { url } = await response.json()
        setFileUrl(url)
      } catch (err) {
        console.error('Error fetching file data:', err)
        setError('Failed to load file')
      } finally {
        setLoading(false)
      }
    }

    fetchFileData()
  }, [file.id, file.type, open])

  const renderPreview = () => {
    if (loading) {
      return (
        <div className="flex h-[80vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-blue border-t-transparent"></div>
        </div>
      )
    }

    if (error || (!fileUrl && !fileContent)) {
      return (
        <div className="flex h-[80vh] items-center justify-center">
          <div className="text-destructive">{error || 'Failed to load file'}</div>
        </div>
      )
    }

    const fileType = file.type.toLowerCase()

    // Image preview
    if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(fileType)) {
      return (
        <div className="flex h-[80vh] items-center justify-center bg-black/5">
          <img
            src={fileUrl || ''}
            alt={file.name}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )
    }

    // PDF preview
    if (fileType === 'pdf') {
      return (
        <div className="h-[80vh] w-full">
          <iframe
            src={`${fileUrl || ''}#toolbar=0`}
            className="h-full w-full"
            title={file.name}
          />
        </div>
      )
    }

    // Video preview
    if (['mp4', 'webm', 'ogg'].includes(fileType)) {
      return (
        <div className="flex h-[80vh] items-center justify-center bg-black/5">
          <video
            src={fileUrl || ''}
            controls
            className="max-h-full max-w-full"
          />
        </div>
      )
    }

    // Audio preview
    if (['mp3', 'wav', 'm4a', 'aac'].includes(fileType)) {
      return (
        <div className="flex h-[80vh] items-center justify-center bg-black/5">
          <audio
            src={fileUrl || ''}
            controls
            className="w-full max-w-md"
          />
        </div>
      )
    }

    // Text preview (txt, md, etc.)
    if (['txt', 'md', 'json', 'csv', 'html', 'css', 'js', 'ts', 'py', 'java', 'c', 'cpp'].includes(fileType)) {
      return (
        <div className="h-[90vh] w-full overflow-auto bg-black/5 p-4">
          <pre className="whitespace-pre-wrap font-mono text-sm">
            {fileContent || 'Content not available'}
          </pre>
        </div>
      )
    }

    // Default preview for unsupported files
    return (
      <div className="flex h-[90vh] flex-col items-center justify-center gap-4 bg-black/5">
        <FileIcon extension={file.type} size={64} />
        <p className="text-muted-foreground">Preview not available for this file type</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fileUrl && window.open(fileUrl, '_blank')}
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Open in New Tab
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (!fileUrl) return
              const a = document.createElement('a')
              a.href = fileUrl
              a.download = file.name
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-7xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex items-center gap-2 min-w-[300px]">
              <FileIcon extension={file.type} size={24} />
              <div className="min-w-[270px]">{file.name}</div>
            </div>
          </DialogTitle>
        </DialogHeader>
        {renderPreview()}
      </DialogContent>
    </Dialog>
  )
} 