import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Get the backend URL from environment variable
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://backend:5000/api';
    
    console.log('🔄 Proxying request to:', `${backendUrl}/hospitals/${id}`);
    
    // Forward the request to the backend
    const response = await fetch(`${backendUrl}/hospitals/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, message: 'Hospital not found' },
          { status: 404 }
        );
      }
      throw new Error(`Backend responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Successfully proxied hospital data for:', id);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error proxying to backend:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch hospital data',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}