'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileUploader } from '@/components/file/file-uploader';
import { FileViewer } from '@/components/file/file-viewer';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(supabaseUrl, supabaseAnonKey);
};

interface FilePageProps {
  params: {
    id: string;
  };
}

export default function FilePage({ params }: FilePageProps) {
  const projectId = params.id;
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  
  // Fetch project files
  useEffect(() => {
    async function fetchFiles() {
      try {
        setLoading(true);
        const supabase = getSupabaseClient();
        
        const { data, error } = await supabase
          .from('files')
          .select('*')
          .eq('project_id', projectId)
          .order('uploaded_at', { ascending: false });
        
        if (error) {
          throw error;
        }
        
        setFiles(data || []);
      } catch (err) {
        console.error('Error fetching files:', err);
        setError('Failed to load files. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchFiles();
  }, [projectId]);
  
  const handleFileUploadComplete = (file: any) => {
    setFiles((prev) => [file, ...prev]);
    setShowUploader(false);
  };
  
  const handleFileDelete = (fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId));
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Project Files</h1>
        
        <Button onClick={() => setShowUploader(!showUploader)}>
          <Plus className="h-4 w-4 mr-2" />
          {showUploader ? 'Cancel' : 'Upload File'}
        </Button>
      </div>
      
      {showUploader && (
        <Card>
          <CardHeader>
            <CardTitle>Upload New File</CardTitle>
            <CardDescription>
              Add files to this project. Supported file types include documents, images, and more.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FileUploader
              projectId={projectId}
              onUploadComplete={handleFileUploadComplete}
            />
          </CardContent>
        </Card>
      )}
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Files</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="other">Other</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading files...</p>
          ) : error ? (
            <p className="text-center py-8 text-destructive">{error}</p>
          ) : files.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No files uploaded yet. Click the "Upload File" button to add files.</p>
          ) : (
            <div className="grid gap-4">
              {files.map((file) => (
                <FileViewer
                  key={file.id}
                  file={file}
                  canDelete={true}
                  onDelete={() => handleFileDelete(file.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="documents" className="space-y-4">
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading files...</p>
          ) : error ? (
            <p className="text-center py-8 text-destructive">{error}</p>
          ) : (
            <div className="grid gap-4">
              {files
                .filter(file => ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'].includes(file.type.toLowerCase()))
                .map((file) => (
                  <FileViewer
                    key={file.id}
                    file={file}
                    canDelete={true}
                    onDelete={() => handleFileDelete(file.id)}
                  />
                ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="images" className="space-y-4">
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading files...</p>
          ) : error ? (
            <p className="text-center py-8 text-destructive">{error}</p>
          ) : (
            <div className="grid gap-4">
              {files
                .filter(file => ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'].includes(file.type.toLowerCase()))
                .map((file) => (
                  <FileViewer
                    key={file.id}
                    file={file}
                    canDelete={true}
                    onDelete={() => handleFileDelete(file.id)}
                  />
                ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="other" className="space-y-4">
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Loading files...</p>
          ) : error ? (
            <p className="text-center py-8 text-destructive">{error}</p>
          ) : (
            <div className="grid gap-4">
              {files
                .filter(file => {
                  const type = file.type.toLowerCase();
                  const docTypes = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'];
                  const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp'];
                  return !docTypes.includes(type) && !imageTypes.includes(type);
                })
                .map((file) => (
                  <FileViewer
                    key={file.id}
                    file={file}
                    canDelete={true}
                    onDelete={() => handleFileDelete(file.id)}
                  />
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 