import { NextRequest, NextResponse } from 'next/server';
import { getSignedFileUrl } from '@/lib/spaces';

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