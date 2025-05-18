import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/services/supabase-client';
import { uploadFile } from '@/lib/spaces';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('userId') as string;

    if (!file || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing file or userId' },
        { status: 400 }
      );
    }

    // Get the auth token from the Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid authorization token' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const supabase = getSupabaseClient();
    
    // Verify the token and get the user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify the user is uploading their own avatar
    if (user.id !== userId) {
      return NextResponse.json(
        { success: false, error: 'Not authorized to update this profile' },
        { status: 403 }
      );
    }

    // Create a unique key for the avatar
    const timestamp = new Date().getTime();
    const randomId = Math.random().toString(36).substring(2, 15);
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const spaceKey = `avatars/${userId}/${timestamp}-${randomId}-${safeName}`;

    // Upload to DigitalOcean Spaces
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const uploadResult = await uploadFile(
      buffer,
      spaceKey,
      file.type,
      true // isPublic
    );

    if (!uploadResult.success) {
      throw new Error('Failed to upload file to storage');
    }

    // Update the user's profile with the new avatar URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ avatar: uploadResult.url })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user profile:', updateError);
      throw new Error('Failed to update profile with new avatar');
    }

    // Return the URL from uploadResult
    return NextResponse.json({
      success: true,
      url: uploadResult.url
    });

  } catch (error: any) {
    console.error('Error uploading avatar:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
} 