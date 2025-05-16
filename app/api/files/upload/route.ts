import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { uploadFile } from '@/lib/spaces';
import { v4 as uuidv4 } from 'uuid';

// Initialize the Supabase client with service role key for admin operations
const getServiceSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
};

export async function POST(request: NextRequest) {
  try {
    // Create a response to later add cookies
    const response = NextResponse.next();
    
    // Create a Supabase client that uses cookies for auth
    const cookieSupabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return request.cookies.get(name)?.value;
          },
          set(name, value, options) {
            // Set cookies on the response
            response.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name, options) {
            response.cookies.set({
              name,
              value: '',
              ...options,
            });
          },
        },
      }
    );
    
    // Check authentication using the cookie-based Supabase client
    const { data: session } = await cookieSupabase.auth.getSession();
    
    if (!session.session || !session.session.user) {
      console.error('No authenticated user found in cookies');
      return NextResponse.json({ error: 'Unauthorized - Not logged in' }, { status: 401 });
    }
    
    // Get user from the session
    const user = session.session.user;
    console.log('Authenticated user:', user.id);
    
    // Get a service role client for database operations
    const supabase = getServiceSupabase();

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const description = formData.get('description') as string || '';
    const isPublic = formData.get('isPublic') === 'true';

    if (!file || !projectId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    console.log('Checking project membership for user:', user.id, 'project:', projectId);

    // Check if user is a member of the project or the owner
    const { data: projectMember, error: memberError } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single();
      
    if (memberError || !projectMember) {
      // Check if user is the project owner as a fallback
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('owner_id')
        .eq('id', projectId)
        .single();
        
      if (projectError || !project || project.owner_id !== user.id) {
        console.error('User is not a member of this project and not the owner');
        return NextResponse.json({ error: 'Not authorized to upload files to this project' }, { status: 403 });
      }
      
      console.log('User is the project owner');
    } else {
      console.log('User is a project member with role:', projectMember.role);
    }

    // Generate a unique file key
    const fileId = uuidv4();
    const fileExtension = file.name.split('.').pop();
    const fileName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    const fileKey = `projects/${projectId}/${user.id}/${fileId}-${fileName}.${fileExtension}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    console.log('Uploading file to DigitalOcean Spaces:', fileKey);

    // Upload to DigitalOcean Spaces
    const uploadResult = await uploadFile(
      buffer,
      fileKey,
      file.type,
      isPublic
    );

    if (!uploadResult.success) {
      console.error('Failed to upload file to DigitalOcean:', uploadResult.error);
      return NextResponse.json({ error: 'Failed to upload file to storage' }, { status: 500 });
    }
    
    console.log('File uploaded successfully to storage, saving metadata');

    // Store file metadata in Supabase
    const { data: fileData, error: fileError } = await supabase
      .from('files')
      .insert({
        id: fileId,
        name: file.name,
        type: fileExtension || '',
        size: formatFileSize(file.size),
        uploaded_by: user.id,
        project_id: projectId,
        path: fileKey,
        description,
        space_name: process.env.SPACES_NAME,
        space_key: fileKey,
        content_type: file.type,
        etag: uploadResult.etag,
        is_public: isPublic
      })
      .select()
      .single();

    if (fileError) {
      console.error('Database error saving file metadata:', fileError);
      return NextResponse.json({ error: 'Failed to save file metadata' }, { status: 500 });
    }
    
    console.log('File metadata saved successfully');

    return NextResponse.json({ 
      success: true, 
      file: fileData,
      url: isPublic ? uploadResult.url : null
    });
  } catch (error) {
    console.error('Error handling file upload:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  else return (bytes / 1073741824).toFixed(1) + ' GB';
} 