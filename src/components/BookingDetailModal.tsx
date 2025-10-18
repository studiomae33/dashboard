'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
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

interface BookingDetailModalProps {
  booking: Booking | null
  isOpen: boolean
  onClose: () => void
}

export function BookingDetailModal({ booking, isOpen, onClose }: BookingDetailModalProps) {
  if (!booking) return null

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      timeStyle: 'short',
      timeZone: 'Europe/Paris'
    }).format(date)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'READY': return 'bg-blue-100 text-blue-800'
      case 'SENT': return 'bg-yellow-100 text-yellow-800'
      case 'SIGNED': return 'bg-green-100 text-green-800'
      case 'PAID': return 'bg-emerald-100 text-emerald-800'
      case 'INVOICED': return 'bg-purple-100 text-purple-800'
      case 'CANCELED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'Brouillon'
      case 'READY': return 'Prêt à envoyer'
      case 'SENT': return 'Envoyé'
      case 'SIGNED': return 'Signé'
      case 'PAID': return 'Règlement effectué'
      case 'INVOICED': return 'Facturé'
      case 'CANCELED': return 'Annulé'
      default: return status
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Détails de la location</DialogTitle>
          <DialogClose onClose={onClose} />
        </DialogHeader>
        
        <div className="space-y-4">
          {/* PRIORITÉ 1: Heures - Le plus important */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">⏰</span>
              <h4 className="font-bold text-blue-900">Horaires</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center bg-white p-2 rounded">
                <div className="text-xl font-bold text-blue-900">{formatTime(booking.start)}</div>
                <div className="text-xs text-blue-700">Début</div>
              </div>
              <div className="text-center bg-white p-2 rounded">
                <div className="text-xl font-bold text-blue-900">{formatTime(booking.end)}</div>
                <div className="text-xs text-blue-700">Fin</div>
              </div>
            </div>
          </div>

          {/* PRIORITÉ 2: Informations texte de la location */}
          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📝</span>
              <h4 className="font-bold text-green-900">Détails</h4>
            </div>
            <div className="space-y-2">
              <div className="bg-white p-2 rounded text-sm">
                <span className="text-green-700 font-medium">Titre:</span>
                <div className="font-semibold text-green-900">{booking.title}</div>
              </div>
              <div className="bg-white p-2 rounded text-sm">
                <span className="text-green-700 font-medium">Type:</span>
                <div className="font-semibold text-green-900">{booking.background}</div>
              </div>
            </div>
          </div>

          {/* PRIORITÉ 3: Jour/Date */}
          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">📅</span>
              <h4 className="font-bold text-purple-900">Dates</h4>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="text-center bg-white p-2 rounded">
                <div className="text-sm font-bold text-purple-900">{formatDate(booking.start)}</div>
                <div className="text-xs text-purple-700">Début</div>
              </div>
              <div className="text-center bg-white p-2 rounded">
                <div className="text-sm font-bold text-purple-900">{formatDate(booking.end)}</div>
                <div className="text-xs text-purple-700">Fin</div>
              </div>
            </div>
            <div className="text-center bg-white p-2 rounded">
              <div className="text-sm font-medium text-purple-800">
                Durée: {(() => {
                  const diffMs = booking.end.getTime() - booking.start.getTime()
                  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
                  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60))
                  
                  if (diffDays > 1) {
                    return `${diffDays} jour${diffDays > 1 ? 's' : ''}`
                  } else {
                    return `${diffHours} heure${diffHours > 1 ? 's' : ''}`
                  }
                })()}
              </div>
            </div>
          </div>

          {/* Informations client et tarification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Client */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">👤</span>
                <h4 className="font-bold text-gray-900 text-sm">Client</h4>
              </div>
              <div className="space-y-1 text-sm">
                <div className="font-medium">
                  {booking.quoteRequest.client.companyName || 
                   `${booking.quoteRequest.client.firstName} ${booking.quoteRequest.client.lastName}`}
                </div>
                <div className="text-gray-600">{booking.quoteRequest.client.email}</div>
                {booking.quoteRequest.client.phone && (
                  <div className="text-gray-600">{booking.quoteRequest.client.phone}</div>
                )}
              </div>
            </div>

            {/* Tarification ou Admin */}
            {(booking.quoteRequest.amount || booking.quoteRequest.amountTtc) ? (
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">💰</span>
                  <h4 className="font-bold text-yellow-900 text-sm">Tarification</h4>
                </div>
                <div className="space-y-1">
                  {booking.quoteRequest.amount && (
                    <div className="text-center bg-white p-2 rounded">
                      <div className="text-sm font-bold text-yellow-900">{formatCurrency(booking.quoteRequest.amount)}</div>
                      <div className="text-xs text-yellow-700">HT</div>
                    </div>
                  )}
                  {booking.quoteRequest.amountTtc && (
                    <div className="text-center bg-white p-2 rounded">
                      <div className="text-lg font-bold text-green-600">{formatCurrency(booking.quoteRequest.amountTtc)}</div>
                      <div className="text-xs text-yellow-700">TTC</div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">📋</span>
                  <h4 className="font-bold text-gray-900 text-sm">Référence</h4>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="font-medium">{booking.quoteRequest.reference}</div>
                  <Badge className={`${getStatusColor(booking.quoteRequest.status)}`}>
                    {getStatusText(booking.quoteRequest.status)}
                  </Badge>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
