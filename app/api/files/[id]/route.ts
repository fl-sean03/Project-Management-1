import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSignedFileUrl, deleteFile } from '@/lib/spaces';

// Initialize the Supabase client with service role key for admin operations
const getServiceSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
};

// Get a file (or a signed URL for private files)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getServiceSupabase();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fileId = params.id;

    // Get file metadata from database
    const { data: file, error } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (error || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check if user is a member of the project
    const { data: projectMember, error: memberError } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', file.project_id)
      .eq('user_id', user.id)
      .single();

    if (memberError || !projectMember) {
      return NextResponse.json({ error: 'Not a member of this project' }, { status: 403 });
    }

    // For public files, return the direct URL
    if (file.is_public) {
      const publicUrl = `https://${file.space_name}.${process.env.SPACES_REGION}.digitaloceanspaces.com/${file.space_key}`;
      return NextResponse.json({ url: publicUrl, file });
    }

    // For private files, generate a signed URL
    const { success, url, error: signedUrlError } = await getSignedFileUrl(file.space_key);
    
    if (!success || !url) {
      return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 });
    }

    return NextResponse.json({ url, file });
  } catch (error) {
    console.error('Error retrieving file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Delete a file
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getServiceSupabase();
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const fileId = params.id;

    // Get file metadata from database
    const { data: file, error } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (error || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check if user is the uploader or project owner
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', file.project_id)
      .single();

    if (file.uploaded_by !== user.id && project?.owner_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to delete this file' }, { status: 403 });
    }

    // Delete from DigitalOcean Spaces
    const { success, error: deleteError } = await deleteFile(file.space_key);
    
    if (!success) {
      console.error('Error deleting from Spaces:', deleteError);
      // Continue anyway to clean up the database
    }

    // Delete from database
    const { error: dbDeleteError } = await supabase
      .from('files')
      .delete()
      .eq('id', fileId);

    if (dbDeleteError) {
      return NextResponse.json({ error: 'Failed to delete file record' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 