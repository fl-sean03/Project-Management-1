"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { getSignedFileUrl } from "@/lib/spaces"
import { File } from "@/lib/supabase-service"

// Extend the File type to include properties from the database
interface FileWithStorage extends File {
  space_key: string;
  space_name: string;
  is_public: boolean;
}

type FileDownloadButtonProps = {
  file: FileWithStorage
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function FileDownloadButton({ file, variant = "ghost", size = "icon", className }: FileDownloadButtonProps) {
  const [loading, setLoading] = useState(false)
  
  const handleDownload = async () => {
    try {
      setLoading(true)
      
      // If the file is public, we can download it directly
      if (file.url) {
        // For public files, use the direct URL
        window.open(file.url, '_blank')
        return
      }
      
      // For private files, we need to get a signed URL
      const response = await fetch(`/api/files/download?key=${encodeURIComponent(file.space_key)}`)
      const data = await response.json()
      
      if (!response.ok || !data.success || !data.url) {
        throw new Error('Failed to get download URL')
      }
      
      // Open the file in a new tab or download it
      window.open(data.url, '_blank')
      
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Error downloading file. Please try again.')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleDownload}
      disabled={loading}
    >
      <Download className="h-4 w-4" />
    </Button>
  )
} 