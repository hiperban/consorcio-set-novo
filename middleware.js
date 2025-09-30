// middleware.js (na RAIZ)
import { NextResponse } from 'next/server';

function challenge() {
  return new NextResponse('Auth required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' },
  });
}

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Só protege /admin (e subrotas)
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const expectedPass = process.env.ADMIN_KEY || '';
  if (!expectedPass) {
    // segurança: sem ADMIN_KEY configurada, nunca libera
    return challenge();
  }

  const auth = req.headers.get('authorization') || '';
  if (!auth.startsWith('Basic ')) {
    return challenge();
  }

  try {
    const encoded = auth.split(' ')[1] || '';
    const decoded = atob(encoded); // "user:pass"
    const [user, pass] = decoded.split(':');

    if (user !== 'admin' || pass !== expectedPass) {
      return challenge();
    }
  } catch {
    return challenge();
  }

  // autenticado
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/admin'],
};
