// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Deixa passar o login e assets
  if (pathname.startsWith('/admin-login')) return NextResponse.next();

  // Protege tudo sob /admin
  if (pathname.startsWith('/admin')) {
    const cookie = req.cookies.get('admin_key')?.value || '';
    const expected = process.env.ADMIN_KEY || '';
    if (!expected || cookie !== expected) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin-login';
      // opcional: manter destino pra pós-login
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/admin'],
};
