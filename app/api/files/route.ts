import { NextRequest, NextResponse } from 'next/server';
import { getPresignedUploadUrl, getSignedFileUrl, deleteFile } from '@/lib/spaces';

// GET /api/files/download?key=file-key - Get a signed download URL
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (!key) {
      return NextResponse.json({ error: 'File key is required' }, { status: 400 });
    }
    
    const result = await getSignedFileUrl(key);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating file download URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/files/upload - Get a presigned URL for upload
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, contentType } = body;
    
    if (!key || !contentType) {
      return NextResponse.json({ error: 'Key and content type are required' }, { status: 400 });
    }
    
    const result = await getPresignedUploadUrl(key, contentType);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating file upload URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/files/delete?key=file-key - Delete a file
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (!key) {
      return NextResponse.json({ error: 'File key is required' }, { status: 400 });
    }
    
    const result = await deleteFile(key);
    
    if (!result.success) {
      return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
    }
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 