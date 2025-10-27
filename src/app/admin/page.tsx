'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface DashboardStats {
  totalQuotes: number
  quotesToSend: number
  signedQuotes: number
  invoicedQuotes: number
  monthlyRevenue: number
  recentQuotes: Array<{
    id: string
    reference: string
    status: string
    client: {
      firstName: string
      lastName: string
      companyName?: string
    }
    createdAt: string
    invoiceAmountTTC?: number
  }>
  upcomingBookings: Array<{
    id: string
    title: string
    start: string
    end: string
    background: string
    quoteRequest: {
      desiredStart: string
      reference: string
      status: string
      client: {
        firstName: string
        lastName: string
        companyName?: string
      }
    }
  }>
  monthInfo: {
    startOfMonth: string
    endOfMonth: string
    currentMonth: string
  }
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      fetchStats()
    }
  }, [status, router])

  async function fetchStats() {
    try {
      const response = await fetch('/api/admin/dashboard')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!session) {
    return null
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">
            Vue d'ensemble de votre activité Studio MAE - {stats?.monthInfo?.currentMonth || 'Octobre 2024'}
          </p>
        </div>

        {/* Statistiques mensuelles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="text-2xl">📋</div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Devis ce mois</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.totalQuotes || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="text-2xl">📤</div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">À envoyer</p>
                  <p className="text-2xl font-semibold text-blue-600">
                    {stats?.quotesToSend || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="text-2xl">✅</div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Signés ce mois</p>
                  <p className="text-2xl font-semibold text-green-600">
                    {stats?.signedQuotes || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="text-2xl">🏁</div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Facturés ce mois</p>
                  <p className="text-2xl font-semibold text-purple-600">
                    {stats?.invoicedQuotes || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="text-2xl">💰</div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">CA ce mois (HT)</p>
                  <p className="text-2xl font-semibold text-emerald-600">
                    {formatCurrency((stats?.monthlyRevenue || 0) / 1.20)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Devis récents */}
          <Card>
            <CardHeader>
              <CardTitle>Devis en cours ce mois</CardTitle>
              <CardDescription>Devis créés ce mois nécessitant encore une action</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {stats?.recentQuotes?.map((quote) => (
                  <div key={quote.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {quote.client.companyName || `${quote.client.firstName} ${quote.client.lastName}`}
                      </p>
                      <p className="text-sm text-gray-500">{quote.reference}</p>
                      <p className="text-xs text-gray-400">{formatDate(new Date(quote.createdAt))}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <StatusBadge status={quote.status} />
                      <Link href={`/admin/quotes/${quote.id}`}>
                        <Button variant="outline" size="sm">
                          Voir
                        </Button>
                      </Link>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-4">Aucun devis récent</p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Link href="/admin/quotes">
                  <Button variant="outline" className="w-full">
                    Voir tous les devis
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Réservations à venir */}
          <Card>
            <CardHeader>
              <CardTitle>Réservations ce mois</CardTitle>
              <CardDescription>Sessions planifiées pour ce mois</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {stats?.upcomingBookings?.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {booking.quoteRequest?.client?.companyName || 
                         `${booking.quoteRequest?.client?.firstName} ${booking.quoteRequest?.client?.lastName}` ||
                         booking.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {booking.quoteRequest?.reference} - {booking.background}
                      </p>
                      <p className="text-xs text-gray-400">
                        Souhaité: {formatDate(new Date(booking.quoteRequest?.desiredStart || booking.start))} - {formatDate(new Date(booking.end))}
                      </p>
                    </div>
                    <div className="ml-3">
                      <StatusBadge status={booking.quoteRequest?.status || 'DRAFT'} />
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-4">Aucune réservation à venir</p>
                )}
              </div>
              <div className="mt-4 pt-4 border-t">
                <Link href="/admin/calendar">
                  <Button variant="outline" className="w-full">
                    Voir le calendrier
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions rapides */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
              <CardDescription>Raccourcis vers les tâches courantes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/admin/quotes/new">
                  <Button className="w-full" variant="default">
                    📝 Nouveau devis
                  </Button>
                </Link>
                <Link href="/admin/clients/new">
                  <Button className="w-full" variant="outline">
                    👤 Nouveau client
                  </Button>
                </Link>
                <Link href="/admin/pipeline">
                  <Button className="w-full" variant="outline">
                    📈 Voir le pipeline
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
