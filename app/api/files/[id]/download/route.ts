import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSignedFileUrl } from '@/lib/spaces';

// Initialize the Supabase client with service role key for admin operations
const getServiceSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
};

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No authorization token provided' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const supabase = getServiceSupabase();
    
    // Verify authentication using the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Invalid authentication token' }, { status: 401 });
    }
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const fileId = params.id;

    // Get file metadata from database
    const { data: file, error } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Error fetching file metadata' }, { status: 500 });
    }
    
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check if user is a member of the project
    const { data: projectMember, error: memberError } = await supabase
      .from('project_members')
      .select('*')
      .eq('project_id', file.project_id)
      .eq('user_id', user.id)
      .single();

    if (memberError) {
      console.error('Project member check error:', memberError);
      return NextResponse.json({ error: 'Error checking project membership' }, { status: 500 });
    }
    
    if (!projectMember) {
      return NextResponse.json({ error: 'Not a member of this project' }, { status: 403 });
    }

    let fileUrl: string;
    
    // For public files, use the direct URL
    if (file.is_public) {
      fileUrl = `https://${file.space_name}.${process.env.SPACES_REGION}.digitaloceanspaces.com/${file.space_key}`;
    } else {
      // For private files, get a signed URL
      const { success, url, error: signedUrlError } = await getSignedFileUrl(file.space_key);
      
      if (!success || !url) {
        console.error('Signed URL error:', signedUrlError);
        return NextResponse.json({ error: 'Failed to generate signed URL' }, { status: 500 });
      }
      
      fileUrl = url;
    }

    // Fetch the file from DigitalOcean Spaces
    const fileResponse = await fetch(fileUrl);
    
    if (!fileResponse.ok) {
      console.error('File fetch error:', fileResponse.statusText);
      return NextResponse.json({ error: 'Failed to fetch file from storage' }, { status: 500 });
    }

    // Get the file content and content type
    const fileContent = await fileResponse.arrayBuffer();
    const contentType = fileResponse.headers.get('content-type') || 'application/octet-stream';

    // Return the file with appropriate headers
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${file.name}"`,
      },
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 