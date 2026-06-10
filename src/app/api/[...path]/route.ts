import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_GESNEU_URL;

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const path = request.nextUrl.pathname.replace('/api', '');
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${BACKEND_URL}/api${path}${searchParams ? `?${searchParams}` : ''}`;

  try {
    const headers: HeadersInit = {};
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    const data = await response.json();
    const nextResponse = NextResponse.json(data, { status: response.status });

    const setCookies = response.headers.getSetCookie();
    for (const cookie of setCookies) {
      nextResponse.headers.append('Set-Cookie', cookie);
    }

    return nextResponse;
  } catch (error: any) {
    console.error('Proxy error:', error?.message, error?.cause, error?.stack);
    return NextResponse.json(
      { error: 'Error en el proxy', detail: error?.message },
      { status: 500 }
    );

  }
}

export async function POST(request: NextRequest) {
  const path = request.nextUrl.pathname.replace('/api', '');
  const url = `${BACKEND_URL}/api${path}`;

  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const headers: HeadersInit = {};
    request.headers.forEach((value, key) => {
      if (key.toLowerCase() !== 'content-length') {
        headers[key] = value;
      }
    });

    const bodyBuffer = await request.arrayBuffer();
    const response = await fetch(url, { method: 'POST', headers, body: bodyBuffer });
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { error: 'Respuesta no es JSON', raw: text };
    }
    return NextResponse.json(data, { status: response.status });

  } else {
    try {
      const body = await request.json();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        headers['Cookie'] = cookieHeader;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        credentials: 'include',
      });

      const data = await response.json();
      const nextResponse = NextResponse.json(data, { status: response.status });

      const setCookies = response.headers.getSetCookie();
      for (const cookie of setCookies) {
        nextResponse.headers.append('Set-Cookie', cookie);
      }

      return nextResponse;
    } catch (error: any) {
      console.error('Proxy error:', error?.message, error?.cause, error?.stack);
      return NextResponse.json(
        { error: 'Error en el proxy', detail: error?.message },
        { status: 500 }
      );
    }
  }
}