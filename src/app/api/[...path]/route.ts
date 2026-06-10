import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_GESNEU_URL;

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const CF_ACCESS_CLIENT_ID = process.env.CF_ACCESS_CLIENT_ID!;
  const CF_ACCESS_CLIENT_SECRET = process.env.CF_ACCESS_CLIENT_SECRET!;

  const path = request.nextUrl.pathname.replace('/api', '');
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${BACKEND_URL}/api${path}${searchParams ? `?${searchParams}` : ''}`;

  try {
    const headers: HeadersInit = {
      'CF-Access-Client-Id': CF_ACCESS_CLIENT_ID,
      'CF-Access-Client-Secret': CF_ACCESS_CLIENT_SECRET,
    };
    const cookieHeader = request.headers.get('cookie');
    if (cookieHeader) headers['Cookie'] = cookieHeader;

    const response = await fetch(url, { method: 'GET', headers, credentials: 'include' });

    const text = await response.text();
    console.error('Backend GET response:', response.status, text.substring(0, 200));

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: 'Respuesta no es JSON', raw: text.substring(0, 500) };
    }

    const nextResponse = NextResponse.json(data, { status: response.status });
    const setCookies = response.headers.getSetCookie();
    for (const cookie of setCookies) {
      nextResponse.headers.append('Set-Cookie', cookie);
    }
    return nextResponse;

  } catch (error: any) {
    console.error('Proxy GET error:', error?.message, error?.cause);
    return NextResponse.json(
      { error: 'Error en el proxy', detail: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const CF_ACCESS_CLIENT_ID = process.env.CF_ACCESS_CLIENT_ID!;
  const CF_ACCESS_CLIENT_SECRET = process.env.CF_ACCESS_CLIENT_SECRET!;

  const path = request.nextUrl.pathname.replace('/api', '');
  const url = `${BACKEND_URL}/api${path}`;

  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const headers: HeadersInit = {
      'CF-Access-Client-Id': CF_ACCESS_CLIENT_ID,
      'CF-Access-Client-Secret': CF_ACCESS_CLIENT_SECRET,
    };
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
    } catch {
      data = { error: 'Respuesta no es JSON', raw: text.substring(0, 500) };
    }
    return NextResponse.json(data, { status: response.status });

  } else {
    try {
      const body = await request.json();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'CF-Access-Client-Id': CF_ACCESS_CLIENT_ID,
        'CF-Access-Client-Secret': CF_ACCESS_CLIENT_SECRET,
      };
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) headers['Cookie'] = cookieHeader;

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        credentials: 'include',
      });

      const text = await response.text();
      console.error('Backend POST response:', response.status, text.substring(0, 200));

      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = { error: 'Respuesta no es JSON', raw: text.substring(0, 500) };
      }

      const nextResponse = NextResponse.json(data, { status: response.status });
      const setCookies = response.headers.getSetCookie();
      for (const cookie of setCookies) {
        nextResponse.headers.append('Set-Cookie', cookie);
      }
      return nextResponse;

    } catch (error: any) {
      console.error('Proxy POST error:', error?.message, error?.cause);
      return NextResponse.json(
        { error: 'Error en el proxy', detail: error?.message },
        { status: 500 }
      );
    }
  }
}