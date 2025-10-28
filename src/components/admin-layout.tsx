'use client'

import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: '📊' },
  { name: 'Devis', href: '/admin/quotes', icon: '📋' },
  { name: 'Factures', href: '/admin/invoices', icon: '🧾' },
  { name: 'Clients', href: '/admin/clients', icon: '👥' },
  { name: 'Calendrier', href: '/admin/calendar', icon: '📅' },
  { name: 'Loc matériel', href: '/admin/equipment', icon: '📦' },
  { name: 'Paramètres', href: '/admin/settings', icon: '⚙️' },
]

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar pour mobile */}
      <div className={cn(
        'fixed inset-0 z-50 lg:hidden',
        sidebarOpen ? 'block' : 'hidden'
      )}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex h-16 flex-shrink-0 items-center bg-blue-600 px-4">
              <h1 className="text-xl font-semibold text-white">Studio MAE</h1>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto">
              <nav className="flex-1 space-y-1 bg-white px-2 py-4">
                {navigation.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        isActive
                          ? 'bg-blue-50 border-blue-500 text-blue-700'
                          : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                        'group flex items-center px-2 py-2 text-sm font-medium border-l-4'
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="mr-3 text-lg">{item.icon}</span>
                      {item.name}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar pour desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex h-16 flex-shrink-0 items-center bg-blue-600 px-4">
            <h1 className="text-xl font-semibold text-white">Studio MAE</h1>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto">
            <nav className="flex-1 space-y-1 bg-white px-2 py-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      isActive
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                      'group flex items-center px-2 py-2 text-sm font-medium border-l-4'
                    )}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="lg:pl-64">
        {/* Header */}
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow">
          <button
            type="button"
            className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Ouvrir la sidebar</span>
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex flex-1 justify-between px-4">
            <div className="flex flex-1">
              {/* Breadcrumb ou titre de page */}
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <div className="relative ml-3">
                <div className="flex items-center">
                  <span className="text-sm text-gray-700 mr-3">
                    Bienvenue, {session?.user?.name}
                  </span>
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Déconnexion
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu de la page */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}

export { AdminLayout }
