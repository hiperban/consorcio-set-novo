'use client';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function Header(){
  const pathname = usePathname();
  const linkCls = (path) => (pathname===path || pathname?.startsWith(path)) ? 'text-brand-800 font-semibold' : 'text-gray-600 hover:text-brand-800';
  const showAdminLink = process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_SHOW_ADMIN_LINK === 'true';

  return (
    <header className="bg-white/90 backdrop-blur border-b">
      <div className="container py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
  <Image
    src="/hiperban-logo.png"
    alt="Hiperban"
    width={140}   // ajuste fino do tamanho
    height={32}   // mantenha a proporção da sua imagem
    priority      // carrega mais rápido no topo
  />
</Link>

        <nav className="flex gap-4 text-sm">
          <Link className={linkCls('/')} href="/">Simulador</Link>
          <Link className={linkCls('/compare')} href="/compare">Comparar</Link>
          {showAdminLink && <Link className={linkCls('/admin')} href="/admin">Admin</Link>}
        </nav>
      </div>
    </header>
  );
}
