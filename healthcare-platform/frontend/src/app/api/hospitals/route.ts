import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the backend URL from environment variable
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://backend:5000/api';
    
    console.log('🔄 Proxying request to:', `${backendUrl}/hospitals`);
    
    // Forward the request to the backend
    const response = await fetch(`${backendUrl}/hospitals`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    console.log('✅ Successfully proxied hospitals data');
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error proxying to backend:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch hospitals data',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}