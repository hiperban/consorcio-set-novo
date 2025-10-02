// components/ContractModal.jsx
'use client';

import { useEffect } from 'react';

export default function ContractModal({ open, onClose, src }) {
  // injeta o script do Respondi só uma vez
  useEffect(() => {
    if (!open) return;
    const id = 'respondi_src';
    if (!document.getElementById(id)) {
      const script = document.createElement('script');
      script.id = id;
      script.async = true;
      script.src = 'https://embed.respondi.app/embed.js';
      document.body.appendChild(script);
    }
  }, [open]);

  // fecha no ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000]">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      {/* modal */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold">Contratação</h3>
            <div className="flex items-center gap-3">
              <a
                href={src}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Abrir em nova aba
              </a>
              <button
                className="rounded-lg px-3 py-1.5 bg-slate-100 hover:bg-slate-200"
                onClick={onClose}
                type="button"
              >
                Fechar
              </button>
            </div>
          </div>

          {/* container do Respondi */}
          <div className="p-0">
            <div
              data-respondi-container=""
              data-respondi-mode="regular"
              data-respondi-src={src}
              data-respondi-width="100%"
              data-respondi-height="600px"
              style={{ width: '100%', minHeight: '600px' }}
            />
            {/* fallback básico */}
            <noscript>
              <div className="p-4 text-sm">
                Para contratar, abra em nova aba:{' '}
                <a href={src} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  {src}
                </a>
              </div>
            </noscript>
          </div>
        </div>
      </div>
    </div>
  );
}
