import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client with service role key for admin operations
const getServiceSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, supabaseServiceKey);
};

export async function GET(request: NextRequest) {
  try {
    const supabase = getServiceSupabase();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const userId = searchParams.get('userId');
    
    if (!projectId || !userId) {
      return NextResponse.json(
        { error: 'Project ID and User ID are required' }, 
        { status: 400 }
      );
    }
    
    // First, check if the user is the project owner
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('owner_id')
      .eq('id', projectId)
      .single();
      
    if (projectError) {
      return NextResponse.json(
        { error: 'Project not found' }, 
        { status: 404 }
      );
    }
    
    // If user is the owner, they have full access
    if (project.owner_id === userId) {
      return NextResponse.json({
        hasAccess: true,
        role: 'owner',
        projectId,
        userId
      });
    }
    
    // Check if user is a project member
    const { data: projectMember, error: memberError } = await supabase
      .from('project_members')
      .select('role')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single();
    
    if (memberError) {
      // User is not a member of the project
      return NextResponse.json({
        hasAccess: false,
        role: null,
        projectId,
        userId
      });
    }
    
    // User is a member, return their role
    return NextResponse.json({
      hasAccess: true,
      role: projectMember.role,
      projectId,
      userId
    });
    
  } catch (error) {
    console.error('Error checking project access:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
} 