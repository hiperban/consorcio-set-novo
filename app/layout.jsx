import './globals.css'
import Header from '@/components/Header'

export const metadata = {
  title: 'Hiperban — Simulador de Consórcio',
  description: 'Encontre, compare e gerencie grupos de consórcio',
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <body>
        <Header/>
        <main className="container py-6">{children}</main>
      </body>
    </html>
  )
}
