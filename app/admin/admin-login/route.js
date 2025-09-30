// app/api/admin/login/route.js
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const key = body?.key || '';
    const expected = process.env.ADMIN_KEY || '';
    if (!expected) {
      return new NextResponse('ADMIN_KEY não configurado no servidor', { status: 500 });
    }
    if (key !== expected) {
      return new NextResponse('Chave inválida', { status: 401 });
    }

    const res = new NextResponse('ok', { status: 200 });
    res.headers.append(
      'Set-Cookie',
      [
        `admin_key=${expected}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Lax',
        process.env.NODE_ENV === 'production' ? 'Secure' : '',
        'Max-Age=2592000', // 30 dias
      ].filter(Boolean).join('; ')
    );
    return res;
  } catch {
    return new NextResponse('Bad Request', { status: 400 });
  }
}
