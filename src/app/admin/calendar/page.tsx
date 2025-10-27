'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BookingDetailModal } from '@/components/BookingDetailModal'
import { formatDate } from '@/lib/utils'

interface Booking {
  id: string
  start: Date
  end: Date
  background: string
  title: string
  quoteRequest: {
    reference: string
    desiredStart: Date
    desiredEnd: Date
    amount?: number
    amountTtc?: number
    status: string
    client: {
      firstName: string
      lastName: string
      companyName?: string
      email: string
      phone?: string
    }
  }
}

export default function CalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week'>('month')
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    fetchBookings()
    
    // Actualiser automatiquement quand la fenêtre reprend le focus
    const handleFocus = () => {
      fetchBookings()
    }
    
    // Actualiser automatiquement toutes les 30 secondes
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchBookings()
      }
    }, 30000)
    
    window.addEventListener('focus', handleFocus)
    
    return () => {
      window.removeEventListener('focus', handleFocus)
      clearInterval(interval)
    }
  }, [])

  async function fetchBookings() {
    setIsLoading(true)
    try {
      // Ajouter un timestamp pour éviter le cache
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/admin/bookings?t=${timestamp}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      if (response.ok) {
        const data = await response.json()
        console.log(`Données chargées: ${data.length} réservations trouvées`) // Debug log
        setBookings(data.map((booking: any) => ({
          ...booking,
          start: new Date(booking.start),
          end: new Date(booking.end),
        })))
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Erreur lors du chargement des réservations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleRefresh() {
    console.log('Actualisation manuelle du calendrier...') // Debug log
    await fetchBookings()
  }

  function getMonthDays() {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    const endDate = new Date(lastDay)

    // Ajuster pour commencer le lundi
    startDate.setDate(startDate.getDate() - (startDate.getDay() === 0 ? 6 : startDate.getDay() - 1))
    endDate.setDate(endDate.getDate() + (7 - (endDate.getDay() === 0 ? 7 : endDate.getDay())))

    const days = []
    const current = new Date(startDate)

    while (current <= endDate) {
      days.push(new Date(current))
      current.setDate(current.getDate() + 1)
    }

    return days
  }

  function getBookingsForDate(date: Date) {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.start)
      return (
        bookingDate.getDate() === date.getDate() &&
        bookingDate.getMonth() === date.getMonth() &&
        bookingDate.getFullYear() === date.getFullYear() &&
        // Ne pas afficher les devis réglés dans le calendrier
        booking.quoteRequest.status !== 'PAID'
      )
    })
  }

  function navigateMonth(direction: 'prev' | 'next') {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  function handleBookingClick(booking: Booking) {
    setSelectedBooking(booking)
    setIsModalOpen(true)
  }

  function handleCloseModal() {
    setIsModalOpen(false)
    setSelectedBooking(null)
  }

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]

  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Calendrier des locations</h1>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center space-x-2"
            >
              <svg
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>{isLoading ? 'Actualisation...' : 'Actualiser'}</span>
            </Button>
            {lastUpdate && (
              <span className="text-xs text-gray-500">
                Dernière MAJ: {lastUpdate.toLocaleTimeString('fr-FR')}
              </span>
            )}
            <div className="flex items-center space-x-2">
              <Button
                variant={view === 'month' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('month')}
              >
                Mois
              </Button>
              <Button
                variant={view === 'week' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('week')}
              >
                Semaine
              </Button>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              <div className="flex items-center space-x-4">
                {/* Légende des couleurs */}
                <div className="flex items-center space-x-3 text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 rounded bg-gray-100 border"></div>
                    <span>Brouillon</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 rounded bg-blue-100 border"></div>
                    <span>Prêt</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 rounded bg-yellow-100 border"></div>
                    <span>Envoyé</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 rounded bg-green-100 border"></div>
                    <span>Signé</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 rounded bg-emerald-100 border"></div>
                    <span>Réglé (masqué)</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 rounded bg-purple-100 border"></div>
                    <span>Facturé</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 rounded bg-red-100 border"></div>
                    <span>Annulé</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('prev')}
                  >
                    ← Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Aujourd'hui
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigateMonth('next')}
                  >
                    Suivant →
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {view === 'month' && (
              <div className="grid grid-cols-7 gap-px bg-gray-200">
                {/* En-têtes des jours */}
                {dayNames.map(day => (
                  <div key={day} className="bg-gray-50 p-3 text-center text-sm font-semibold text-gray-900">
                    {day}
                  </div>
                ))}
                
                {/* Jours du mois */}
                {getMonthDays().map((date, index) => {
                  const isCurrentMonth = date.getMonth() === currentDate.getMonth()
                  const isToday = new Date().toDateString() === date.toDateString()
                  const dayBookings = getBookingsForDate(date)
                  
                  return (
                    <div
                      key={index}
                      className={`bg-white p-2 min-h-[120px] ${
                        !isCurrentMonth ? 'text-gray-400' : ''
                      } ${isToday ? 'bg-blue-50' : ''}`}
                    >
                      <div className={`text-sm font-medium mb-1 ${
                        isToday ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {date.getDate()}
                      </div>
                      
                      <div className="space-y-1">
                        {dayBookings.map(booking => {
                          const statusColors = {
                            DRAFT: 'bg-gray-100 text-gray-800',
                            READY: 'bg-blue-100 text-blue-800',
                            SENT: 'bg-yellow-100 text-yellow-800',
                            SIGNED: 'bg-green-100 text-green-800',
                            PAID: 'bg-emerald-100 text-emerald-800',
                            INVOICED: 'bg-purple-100 text-purple-800',
                            CANCELED: 'bg-red-100 text-red-800'
                          }
                          const statusColor = statusColors[booking.quoteRequest.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
                          
                          return (
                            <div
                              key={booking.id}
                              className={`text-xs p-1 rounded truncate cursor-pointer hover:opacity-80 transition-colors ${statusColor}`}
                              title={`${booking.title} - ${booking.background} (${booking.quoteRequest.status})`}
                              onClick={() => handleBookingClick(booking)}
                            >
                              <div className="font-medium truncate">{booking.title}</div>
                              <div className="text-xs opacity-75">{booking.background}</div>
                              <div className="text-xs font-semibold opacity-90">
                                {booking.quoteRequest.status === 'PAID' ? 'Réglé' : 
                                 booking.quoteRequest.status === 'INVOICED' ? 'Facturé' :
                                 booking.quoteRequest.status === 'SIGNED' ? 'Signé' :
                                 booking.quoteRequest.status === 'SENT' ? 'Envoyé' :
                                 booking.quoteRequest.status === 'CANCELED' ? 'Annulé' : 
                                 booking.quoteRequest.status === 'READY' ? 'Prêt' : 'Brouillon'}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Légende */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Réservations à venir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bookings
                .filter(booking => booking.start >= new Date() && booking.quoteRequest.status !== 'PAID')
                .sort((a, b) => a.start.getTime() - b.start.getTime())
                .slice(0, 5)
                .map(booking => {
                  const getStatusBadge = (status: string) => {
                    const badges = {
                      DRAFT: { text: 'Brouillon', color: 'bg-gray-100 text-gray-800' },
                      READY: { text: 'Prêt', color: 'bg-blue-100 text-blue-800' },
                      SENT: { text: 'Envoyé', color: 'bg-yellow-100 text-yellow-800' },
                      SIGNED: { text: 'Signé', color: 'bg-green-100 text-green-800' },
                      PAID: { text: 'Réglé', color: 'bg-emerald-100 text-emerald-800' },
                      INVOICED: { text: 'Facturé', color: 'bg-purple-100 text-purple-800' },
                      CANCELED: { text: 'Annulé', color: 'bg-red-100 text-red-800' }
                    }
                    return badges[status as keyof typeof badges] || { text: status, color: 'bg-gray-100 text-gray-800' }
                  }
                  
                  const statusBadge = getStatusBadge(booking.quoteRequest.status)
                  
                  return (
                    <div 
                      key={booking.id} 
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleBookingClick(booking)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-medium text-gray-900">{booking.title}</div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.color}`}>
                            {statusBadge.text}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatDate(booking.start)} - {booking.background}
                        </div>
                        <div className="text-xs text-gray-500">
                          Devis: {booking.quoteRequest.reference}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-blue-600">
                        {new Intl.DateTimeFormat('fr-FR', {
                          timeStyle: 'short',
                          timeZone: 'Europe/Paris'
                        }).format(booking.start)}
                      </div>
                    </div>
                  )
                })}
              
              {bookings.filter(booking => booking.start >= new Date() && booking.quoteRequest.status !== 'PAID').length === 0 && (
                <div className="text-center text-gray-500 py-8">
                  Aucune réservation à venir
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de détails */}
      <BookingDetailModal
        booking={selectedBooking}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onRefresh={handleRefresh}
      />
    </AdminLayout>
  )
}
