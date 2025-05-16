'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, ExternalLink, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { FileIcon } from './file-icon';

interface FileViewerProps {
  file: {
    id: string;
    name: string;
    type: string;
    size: string;
    description?: string;
    uploaded_by: string;
    uploaded_at: string;
    is_public: boolean;
  };
  onDelete?: () => void;
  canDelete?: boolean;
}

export function FileViewer({ file, onDelete, canDelete = false }: FileViewerProps) {
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchFileUrl = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/files/${file.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch file URL');
        }
        
        const data = await response.json();
        setFileUrl(data.url);
      } catch (err) {
        console.error('Error fetching file URL:', err);
        setError('Failed to load file');
      } finally {
        setLoading(false);
      }
    };

    fetchFileUrl();
  }, [file.id]);

  const handleDelete = async () => {
    if (!canDelete) return;
    
    try {
      setDeleting(true);
      const response = await fetch(`/api/files/${file.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete file');
      }
      
      if (onDelete) {
        onDelete();
      }
    } catch (err) {
      console.error('Error deleting file:', err);
      setError('Failed to delete file');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 flex-shrink-0">
            <FileIcon extension={file.type.toLowerCase()} />
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium truncate">{file.name}</h3>
            <p className="text-sm text-muted-foreground">{file.size} • {formatDate(file.uploaded_at)}</p>
            {file.description && (
              <p className="text-sm mt-1">{file.description}</p>
            )}
          </div>
          
          <div className="flex gap-2">
            {loading ? (
              <Button variant="outline" size="sm" disabled>
                <span className="animate-pulse">Loading...</span>
              </Button>
            ) : error ? (
              <Button variant="outline" size="sm" disabled>
                Error
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(fileUrl!, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = fileUrl!;
                    a.download = file.name;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                
                {canDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={deleting}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deleting ? 'Deleting...' : 'Delete'}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the file
                          "{file.name}" and remove it from our servers.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 