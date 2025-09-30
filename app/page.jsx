14:39:49.974 Running build in Washington, D.C., USA (East) – iad1
14:39:49.974 Build machine configuration: 4 cores, 8 GB
14:39:49.991 Cloning github.com/hiperban/consorcio-set-novo (Branch: main, Commit: 17199fd)
14:39:50.267 Cloning completed: 276.000ms
14:39:50.767 Restored build cache from previous deployment (CwP6Ujd5myAXmSJ4AsNgZjtzFhfK)
14:39:51.071 Running "vercel build"
14:39:51.478 Vercel CLI 48.1.6
14:39:51.770 Installing dependencies...
14:39:52.608 
14:39:52.608 up to date in 590ms
14:39:52.608 
14:39:52.608 35 packages are looking for funding
14:39:52.608   run `npm fund` for details
14:39:52.640 Detected Next.js version: 14.2.5
14:39:52.644 Running "npm run build"
14:39:52.758 
14:39:52.758 > hiperban-consorcio-suite@1.0.0 build
14:39:52.758 > next build
14:39:52.758 
14:39:53.493   ▲ Next.js 14.2.5
14:39:53.493 
14:39:53.553    Creating an optimized production build ...
14:39:54.298  ⚠ Found lockfile missing swc dependencies, run next locally to automatically patch
14:39:55.592 Failed to compile.
14:39:55.592 
14:39:55.592 ./app/page.jsx
14:39:55.592 Error: 
14:39:55.592   [31mx[0m Unexpected eof
14:39:55.593      ,-[[36;1;4m/vercel/path0/app/page.jsx[0m:214:1]
14:39:55.593  [2m214[0m |                       {(g.__pKey ? productLabel(g.__pKey) : g.produto) || '—'}
14:39:55.593  [2m215[0m |                     </div>
14:39:55.593  [2m216[0m |                     <div className="text-xs text-gray-500">
14:39:55.593  [2m217[0m |                       {(g.__aKey ? adminLabel(g.__
14:39:55.593      : [31;1m                                                  ^[0m
14:39:55.593      `----
14:39:55.593 
14:39:55.593 Caused by:
14:39:55.593     Syntax Error
14:39:55.593 
14:39:55.593 Import trace for requested module:
14:39:55.593 ./app/page.jsx
14:39:55.593 
14:39:55.604 
14:39:55.604 > Build failed because of webpack errors
14:39:55.628 Error: Command "npm run build" exited with 1
