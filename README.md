# Hiperban — Simulador de Consórcio (Suite Única) v3
- Visual com base #FF5D29.
- Filtros dinâmicos (mín/máx independentes; normalização de acentos/maiúsculas).
- /admin protegido via `?key=` e link oculto em produção (NEXT_PUBLIC_SHOW_ADMIN_LINK=false).
- /admin e /compare com Suspense + `dynamic='force-dynamic'`.

## Variáveis no Vercel
- NEXT_PUBLIC_ADMIN_KEY (obrigatório para acessar /admin)
- NEXT_PUBLIC_SHOW_ADMIN_LINK (opcional; default false)
- NEXT_PUBLIC_CONTRATAR_URL (opcional; default link Hiperban)

## Rotas
- / (Simulador)
- /compare
- /admin?key=SUA_CHAVE
