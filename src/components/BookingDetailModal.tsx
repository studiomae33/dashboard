'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { X } from 'lucide-react'

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
  onRefresh?: () => void
}

export function BookingDetailModal({ booking, isOpen, onClose, onRefresh }: BookingDetailModalProps) {
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
      <DialogContent className="max-w-lg mx-auto p-0 overflow-hidden">
        {/* Header avec gradient subtil */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200 relative">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-lg font-semibold text-slate-900 truncate">
                  {booking.title}
                </DialogTitle>
                <p className="text-sm text-slate-600 mt-1 truncate">{booking.background}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge className={`${getStatusColor(booking.quoteRequest.status)} border-0 whitespace-nowrap`}>
                  {getStatusText(booking.quoteRequest.status)}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-8 w-8 p-0 hover:bg-slate-200"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>
        </div>
        
        <div className="px-6 py-6 space-y-6">
          {/* Horaires - Section principale */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900">{formatTime(booking.start)}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Début</div>
              </div>
              <div className="flex-shrink-0 w-12 h-px bg-slate-300 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900">{formatTime(booking.end)}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Fin</div>
              </div>
            </div>
            
            <div className="mt-4 px-4 py-2 bg-slate-100 rounded-full inline-block">
              <span className="text-sm text-slate-700 whitespace-nowrap">
                {formatDate(booking.start)}
                {booking.start.toDateString() !== booking.end.toDateString() && 
                  ` - ${formatDate(booking.end)}`}
              </span>
            </div>
          </div>

          {/* Informations client */}
          <div className="border-t border-slate-200 pt-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-lg">👤</span>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-slate-900 text-base truncate">
                  {booking.quoteRequest.client.companyName || 
                   `${booking.quoteRequest.client.firstName} ${booking.quoteRequest.client.lastName}`}
                </h4>
                <div className="text-sm text-slate-600 mt-2 space-y-1">
                  <div className="truncate">{booking.quoteRequest.client.email}</div>
                  {booking.quoteRequest.client.phone && (
                    <div className="truncate">{booking.quoteRequest.client.phone}</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tarification et référence */}
          <div className="border-t border-slate-200 pt-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Référence</div>
                <div className="font-mono text-sm text-slate-900 truncate">{booking.quoteRequest.reference}</div>
              </div>
              {(booking.quoteRequest.amount || booking.quoteRequest.amountTtc) && (
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Montant</div>
                  <div className="font-semibold text-slate-900 whitespace-nowrap">
                    {booking.quoteRequest.amountTtc 
                      ? formatCurrency(booking.quoteRequest.amountTtc)
                      : formatCurrency(booking.quoteRequest.amount!)
                    }
                  </div>
                  <div className="text-xs text-slate-500">
                    {booking.quoteRequest.amountTtc ? 'TTC' : 'HT'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Durée */}
          <div className="border-t border-slate-200 pt-5 pb-2">
            <div className="text-center">
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Durée</div>
              <div className="text-base font-medium text-slate-700">
                {(() => {
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
