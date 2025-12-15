export const dynamic = 'force-dynamic';

import AdminClient from '@/components/AdminClient';

export default function AdminPage({ searchParams }) {
  const key = (searchParams?.key ?? '').toString().trim();
  const expected = (process.env.ADMIN_KEY ?? '').toString().trim();

  const isAuthed = Boolean(expected && key && key === expected);

  return <AdminClient isAuthed={isAuthed} />;
}
