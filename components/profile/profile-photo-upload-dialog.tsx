import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { UploadCloud } from "lucide-react";
import { getSupabaseClient } from "@/lib/services/supabase-client";

interface ProfilePhotoUploadDialogProps {
  userId: string;
  onUploaded: (url: string) => void;
}

export function ProfilePhotoUploadDialog({ userId, onUploaded }: ProfilePhotoUploadDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a photo");
      return;
    }
    setUploading(true);
    setProgress(0);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", userId);
      formData.append("isAvatar", "true");

      // Get the session token
      const supabase = getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("No authentication token found");
      }

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = Math.round((event.loaded / event.total) * 100);
          setProgress(percentComplete);
        }
      });
      xhr.addEventListener("load", () => {
        setUploading(false);
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          if (response.success && response.url) {
            onUploaded(response.url);
            setOpen(false);
            setFile(null);
            setProgress(0);
          } else {
            setError(response.error || "Upload failed");
          }
        } else {
          setError("Upload failed");
        }
      });
      xhr.addEventListener("error", () => {
        setUploading(false);
        setError("Network error during upload");
      });
      xhr.open("POST", "/api/profile/avatar-upload");
      xhr.setRequestHeader("Authorization", `Bearer ${session.access_token}`);
      xhr.send(formData);
    } catch (err) {
      setUploading(false);
      setError("Unexpected error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Upload Photo</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Profile Photo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
          {file && (
            <div className="text-sm text-muted-foreground">{file.name}</div>
          )}
          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <div className="text-xs text-center text-muted-foreground">Uploading... {progress}%</div>
            </div>
          )}
          {error && <div className="text-sm text-destructive">{error}</div>}
          <Button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="w-full"
          >
            {uploading ? (
              <span className="flex items-center gap-2">
                <UploadCloud className="h-4 w-4 animate-pulse" />
                Uploading...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <UploadCloud className="h-4 w-4" />
                Upload Photo
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 