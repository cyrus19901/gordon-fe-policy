import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function getBackendCandidates(): string[] {
  return Array.from(
    new Set(
      [BACKEND_URL, process.env.BACKEND_FALLBACK_URL, 'http://localhost:3001']
        .filter(Boolean)
        .map((u) => String(u).replace(/\/+$/, '')),
    ),
  );
}

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
    
    const backendCandidates = getBackendCandidates();

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
    
    // Build headers - forward relevant auth/payment headers from client
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    // Only forward Authorization if it's a real JWT (starts with eyJ), not a dev placeholder
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.replace('Bearer ', '').startsWith('eyJ')) {
      headers['Authorization'] = authHeader;
    }
    const apiKey = request.headers.get('x-api-key');
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }
    const paymentSig = request.headers.get('payment-signature');
    if (paymentSig) {
      headers['PAYMENT-SIGNATURE'] = paymentSig;
    }

    let lastError: { status: number; message: string; backendUrl?: string } | null = null;

    for (const backendBase of backendCandidates) {
      const backendUrl = `${backendBase}${backendPath}${searchParams.toString() ? '?' + searchParams.toString() : ''}`;
      const response = await fetch(backendUrl, {
        method,
        headers,
        body,
      }).catch((error: any) => ({ ok: false, status: 0, _err: error } as any));

      if ((response as any)._err) {
        lastError = {
          status: 0,
          message: (response as any)._err?.message || 'Proxy request failed',
          backendUrl: backendBase,
        };
        continue;
      }

      const contentType = (response as Response).headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await (response as Response).text();
        console.error(`Proxy: backend returned non-JSON for ${backendPath} from ${backendBase}:`, text.slice(0, 200));
        lastError = {
          status: (response as Response).status,
          message: `Backend route not found: ${backendPath}`,
          backendUrl: backendBase,
        };
        if ((response as Response).status === 404) continue;
        return NextResponse.json(
          { error: lastError.message, status: (response as Response).status, backendUrl: backendBase },
          { status: (response as Response).status >= 500 ? (response as Response).status : 502 },
        );
      }

      const data = await (response as Response).json();
      if ((response as Response).status === 404) {
        lastError = { status: 404, message: data?.error || `Backend route not found: ${backendPath}`, backendUrl: backendBase };
        continue;
      }

      return NextResponse.json(data, { status: (response as Response).status });
    }

    return NextResponse.json(
      {
        error: lastError?.message || `Backend route not found: ${backendPath}`,
        status: lastError?.status || 404,
        backendUrl: lastError?.backendUrl || BACKEND_URL,
      },
      { status: lastError?.status === 404 ? 404 : 502 },
    );
  } catch (error: any) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Proxy request failed', details: error.message },
      { status: 500 }
    );
  }
}
