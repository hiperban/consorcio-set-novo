// middleware.js
import { NextResponse } from 'next/server'

export function middleware(req) {
  const auth = req.headers.get('authorization') || ''
  const expected = 'Basic ' + Buffer.from(`admin:${process.env.ADMIN_KEY}`).toString('base64')

  if (!auth || auth !== expected) {
    return new NextResponse('Auth required', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Secure Area"' },
    })
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/admin'],
}
