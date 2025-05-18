"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { getSignedFileUrl } from "@/lib/spaces"
import { File } from "@/lib/types"
import { useSupabase } from "@/hooks/use-supabase"
import { Spinner } from "@/components/ui/spinner"

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
  const { supabase } = useSupabase()
  
  const handleDownload = async () => {
    if (!supabase) {
      console.error('Supabase client not initialized');
      return;
    }

    try {
      setLoading(true)
      
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Not authenticated');
      }
      
      // Always use our backend API to handle the download
      const response = await fetch(`/api/files/${file.id}/download`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download file');
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a blob URL and trigger download
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
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
      {loading ? (
        <Spinner className="h-4 w-4" />
      ) : (
        <Download className="h-4 w-4" />
      )}
    </Button>
  )
} 