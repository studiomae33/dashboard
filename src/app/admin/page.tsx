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
  nextBookingDate: string | null
  nextBookingBackground: string | null
  invoicedQuotes: number
  invoicesToSendCount: number
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
    amountTTC?: number
    invoiceAmountTTC?: number
  }>
  quotesNeedingInvoiceDetails: Array<{
    id: string
    reference: string
    status: string
    desiredEnd: string
    client: {
      firstName: string
      lastName: string
      companyName?: string
    }
    amountTTC?: number
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
  upcomingBookingsFuture: Array<{
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="h-full">
            <CardContent className="p-6 h-full flex items-center justify-center">
              <div className="flex items-center space-x-4 w-full">
                <div className="text-3xl flex-shrink-0">📋</div>
                <div className="flex-1 text-center">
                  <p className="text-sm font-medium text-gray-600 mb-1">Devis ce mois</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {stats?.totalQuotes || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardContent className="p-6 h-full flex items-center justify-center">
              <div className="flex items-center space-x-4 w-full">
                <div className="text-3xl flex-shrink-0">📤</div>
                <div className="flex-1 text-center">
                  <p className="text-sm font-medium text-gray-600 mb-1">À envoyer</p>
                  <p className="text-2xl font-semibold text-blue-600">
                    {stats?.quotesToSend || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardContent className="p-6 h-full flex items-center justify-center">
              <div className="flex items-center space-x-4 w-full">
                <div className="text-3xl flex-shrink-0">📅</div>
                <div className="flex-1 text-center">
                  <p className="text-sm font-medium text-gray-600 mb-1">Prochaine location</p>
                  {stats?.nextBookingDate ? (
                    <div>
                      <p className="text-lg font-semibold text-green-600">
                        {new Date(stats.nextBookingDate).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}, {new Date(stats.nextBookingDate).toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                      {stats?.nextBookingBackground && (
                        <p className="text-sm text-gray-500 mt-1">
                          {stats.nextBookingBackground}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-lg font-semibold text-gray-400">
                      Aucune
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="h-full">
            <CardContent className="p-6 h-full flex items-center justify-center">
              <div className="flex items-center space-x-4 w-full">
                <div className="text-3xl flex-shrink-0">💰</div>
                <div className="flex-1 text-center">
                  <p className="text-sm font-medium text-gray-600 mb-1">CA ce mois (HT)</p>
                  <p className="text-2xl font-semibold text-emerald-600">
                    {formatCurrency((stats?.monthlyRevenue || 0) / 1.20)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Devis récents */}
          <Card>
            <CardHeader>
              <CardTitle>Devis en cours ce mois</CardTitle>
              <CardDescription>Devis avec date de location ce mois nécessitant encore une action</CardDescription>
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

          {/* Factures à envoyer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-orange-600">📄</span>
                Factures à envoyer
                {(stats?.invoicesToSendCount || 0) > 0 && (
                  <span className="text-sm bg-orange-100 text-orange-800 px-2 py-1 rounded-full font-normal">
                    {stats?.invoicesToSendCount}
                  </span>
                )}
              </CardTitle>
              <CardDescription>Locations terminées en attente de facturation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-64 overflow-y-auto">
                {stats?.quotesNeedingInvoiceDetails?.map((quote) => (
                  <div key={quote.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border-l-4 border-orange-200">
                    <div>
                      <p className="font-medium text-gray-900">
                        {quote.client.companyName || `${quote.client.firstName} ${quote.client.lastName}`}
                      </p>
                      <p className="text-sm text-gray-500">{quote.reference}</p>
                      <p className="text-xs text-gray-400">
                        Fin de location: {formatDate(new Date(quote.desiredEnd))}
                      </p>
                      {(quote.amountTTC || quote.invoiceAmountTTC) && (
                        <p className="text-xs text-green-600 font-medium">
                          {formatCurrency(quote.amountTTC || quote.invoiceAmountTTC || 0)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        Facture à envoyer
                      </span>
                      <Link href={`/admin/quotes/${quote.id}`}>
                        <Button variant="outline" size="sm" className="text-orange-600 hover:text-orange-700">
                          Facturer
                        </Button>
                      </Link>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-2">✅</div>
                    <p className="text-gray-500">Aucune facture en attente</p>
                    <p className="text-sm text-gray-400">Toutes les locations sont à jour</p>
                  </div>
                )}
              </div>
              {(stats?.invoicesToSendCount || 0) > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <Link href="/admin/quotes?status=PAID">
                    <Button variant="outline" className="w-full text-orange-600 hover:text-orange-700">
                      Voir tous les devis payés
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
          {/* Réservations à venir */}
          <Card>
            <CardHeader>
              <CardTitle>Réservations à venir</CardTitle>
              <CardDescription>Sessions planifiées par période</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Réservations ce mois */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">
                  Ce mois ({stats?.monthInfo?.currentMonth})
                </h4>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {stats?.upcomingBookings?.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-l-4 border-blue-200">
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
                    <p className="text-gray-500 text-center py-4 text-sm">Aucune réservation ce mois</p>
                  )}
                </div>
              </div>

              {/* Réservations mois futurs */}
              <div>
                <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">
                  Mois futurs
                </h4>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {stats?.upcomingBookingsFuture?.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-l-4 border-gray-200">
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
                    <p className="text-gray-500 text-center py-4 text-sm">Aucune réservation future</p>
                  )}
                </div>
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
      </div>
    </AdminLayout>
  )
}
