// middleware.js
import { NextResponse } from 'next/server';

export function middleware(req) {
  const { pathname, searchParams } = req.nextUrl;

  // Deixa passar o login e assets
  if (pathname.startsWith('/admin-login')) return NextResponse.next();

  // Protege tudo sob /admin
  if (pathname.startsWith('/admin')) {
    const cookie = req.cookies.get('admin_key')?.value || '';
    const expected = process.env.ADMIN_KEY || '';
    if (!expected || cookie !== expected) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin-login';
      url.searchParams.set('next', pathname + (req.nextUrl.search || ''));
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/admin'],
};
