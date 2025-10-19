'use client'

import { SessionProvider } from 'next-auth/react'
import { Inter } from 'next/font/google'
import '@/styles/tailwind.css'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={inter.className}>
      <head>
        <title>Studio Mae - Dashboard Administratif</title>
        <meta name="description" content="Dashboard administratif pour la gestion des clients, devis et réservations du Studio Mae." />
      </head>
      <body className="bg-gray-50">
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
