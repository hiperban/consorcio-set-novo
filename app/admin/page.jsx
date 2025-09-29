"use client";

import AdminForm from "@/AdminForm";

export default function Page() {
  const adminKey = process.env.NEXT_PUBLIC_ADMIN_KEY;

  if (!adminKey) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-bold">Admin</h1>
        <p className="text-red-600">
          Erro: defina a variável NEXT_PUBLIC_ADMIN_KEY nas variáveis do Vercel.
        </p>
      </div>
    );
  }

  return (
    <main className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Administração</h1>
      <AdminForm adminKey={adminKey} />
    </main>
  );
}
