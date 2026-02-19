import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest('GET', request, params.path);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest('POST', request, params.path);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest('PUT', request, params.path);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  return handleRequest('DELETE', request, params.path);
}

async function handleRequest(
  method: string,
  request: NextRequest,
  path: string[]
) {
  try {
    // Read session cookie to get user email
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('session');
    
    let userEmail = null;
    if (sessionCookie) {
      try {
        const sessionData = JSON.parse(sessionCookie.value);
        userEmail = sessionData.email;
      } catch (error) {
        console.error('Failed to parse session:', error);
      }
    }

    // Build backend URL
    const backendPath = `/api/${path.join('/')}`;
    const searchParams = request.nextUrl.searchParams;
    
    // Add user_email to query params for GET/DELETE
    if ((method === 'GET' || method === 'DELETE') && userEmail) {
      searchParams.set('user_email', userEmail);
    }
    
    const backendUrl = `${BACKEND_URL}${backendPath}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;

    // Prepare request body for POST/PUT
    let body = null;
    if (method === 'POST' || method === 'PUT') {
      try {
        const bodyData = await request.json();
        // Add user_email to request body
        if (userEmail) {
          bodyData.user_email = userEmail;
        }
        body = JSON.stringify(bodyData);
      } catch (error) {
        // No body - create one with just user_email
        if (userEmail) {
          body = JSON.stringify({ user_email: userEmail });
        }
      }
    }
    
    // Debug logging
    console.log('Proxy request:', {
      method,
      path: backendPath,
      userEmail,
      hasBody: !!body,
    });

    // Forward request to backend
    const response = await fetch(backendUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed', details: error.message },
      { status: 500 }
    );
  }
}
