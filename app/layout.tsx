import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Es Camelo — Internal System',
  description: 'Internal management system for Es Camelo',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="bg-[#0d0d0d] text-white antialiased">
        {children}
      </body>
    </html>
  )
}
