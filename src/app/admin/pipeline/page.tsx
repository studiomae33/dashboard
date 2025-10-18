'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate, formatCurrency } from '@/lib/utils'

interface Quote {
  id: string
  reference: string
  status: string
  desiredStart: Date
  desiredEnd: Date
  background: string
  message?: string
  invoiceAmountTTC?: number
  client: {
    firstName: string
    lastName: string
    companyName?: string
    email: string
  }
}

const statusConfig = {
  DRAFT: { label: 'Brouillons', color: 'bg-gray-100', textColor: 'text-gray-600' },
  READY: { label: 'Prêts à envoyer', color: 'bg-blue-100', textColor: 'text-blue-600' },
  SENT: { label: 'Envoyés', color: 'bg-yellow-100', textColor: 'text-yellow-600' },
  SIGNED: { label: 'Signés', color: 'bg-green-100', textColor: 'text-green-600' },
  PAID: { label: 'Règlement effectué', color: 'bg-emerald-100', textColor: 'text-emerald-600' },
  INVOICED: { label: 'Facturés', color: 'bg-purple-100', textColor: 'text-purple-600' },
  CANCELED: { label: 'Annulés', color: 'bg-red-100', textColor: 'text-red-600' },
}

export default function PipelinePage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchQuotes()
  }, [])

  async function fetchQuotes() {
    try {
      const response = await fetch('/api/admin/quotes')
      if (response.ok) {
        const data = await response.json()
        setQuotes(data.map((quote: any) => ({
          ...quote,
          desiredStart: new Date(quote.desiredStart),
          desiredEnd: new Date(quote.desiredEnd),
        })))
      }
    } catch (error) {
      console.error('Erreur lors du chargement des devis:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function updateQuoteStatus(quoteId: string, newStatus: string) {
    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        await fetchQuotes()
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error)
    }
  }

  function getQuotesForStatus(status: string) {
    return quotes.filter(quote => quote.status === status)
  }

  function getClientName(client: Quote['client']) {
    return client.companyName || `${client.firstName} ${client.lastName}`
  }

  const statusOrder = ['DRAFT', 'READY', 'SENT', 'SIGNED', 'PAID', 'INVOICED', 'CANCELED']

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Chargement...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Pipeline des devis</h1>
          <Button onClick={fetchQuotes}>
            Actualiser
          </Button>
        </div>

        {/* Vue Kanban */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {statusOrder.map(status => {
            const statusQuotes = getQuotesForStatus(status)
            const config = statusConfig[status as keyof typeof statusConfig]
            
            return (
              <Card key={status} className="h-fit">
                <CardHeader className={`${config.color} rounded-t-lg`}>
                  <CardTitle className={`text-lg ${config.textColor} flex items-center justify-between`}>
                    <span>{config.label}</span>
                    <span className={`text-sm font-normal px-2 py-1 rounded-full bg-white ${config.textColor}`}>
                      {statusQuotes.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  {statusQuotes.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-4">
                      Aucun devis
                    </div>
                  ) : (
                    statusQuotes.map(quote => (
                      <div key={quote.id} className="border rounded-lg p-3 bg-white hover:shadow-md transition-shadow">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-sm text-blue-600">
                              {quote.reference}
                            </span>
                            <StatusBadge status={quote.status} />
                          </div>
                          
                          <div className="text-sm font-medium text-gray-900">
                            {getClientName(quote.client)}
                          </div>
                          
                          <div className="text-xs text-gray-600">
                            📅 {formatDate(quote.desiredStart)}
                          </div>
                          
                          <div className="text-xs text-gray-600">
                            🎨 {quote.background}
                          </div>
                          
                          {quote.invoiceAmountTTC && (
                            <div className="text-xs font-semibold text-green-600">
                              💰 {formatCurrency(quote.invoiceAmountTTC)}
                            </div>
                          )}
                          
                          {quote.message && (
                            <div className="text-xs text-gray-500 line-clamp-2">
                              {quote.message}
                            </div>
                          )}
                          
                          {/* Actions rapides */}
                          <div className="flex space-x-1 pt-2">
                            {status === 'DRAFT' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuoteStatus(quote.id, 'READY')}
                                className="text-xs"
                              >
                                → Prêt
                              </Button>
                            )}
                            
                            {status === 'READY' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.location.href = `/admin/quotes/${quote.id}/email`}
                                className="text-xs"
                              >
                                📧 Envoyer
                              </Button>
                            )}
                            
                            {status === 'SENT' && (
                              <div className="text-xs text-center space-y-1">
                                <div className="text-blue-600 font-medium">
                                  📬 En attente validation client
                                </div>
                                <div className="text-gray-500">
                                  Le client peut valider en ligne
                                </div>
                              </div>
                            )}
                            
                            {status === 'SIGNED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuoteStatus(quote.id, 'PAID')}
                                className="text-xs"
                              >
                                💰 Paiement reçu
                              </Button>
                            )}
                            
                            {status === 'PAID' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuoteStatus(quote.id, 'INVOICED')}
                                className="text-xs"
                              >
                                📄 Facturer
                              </Button>
                            )}
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.location.href = `/admin/quotes/${quote.id}`}
                              className="text-xs"
                            >
                              👁️
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-gray-900">
                {quotes.length}
              </div>
              <div className="text-sm text-gray-600">Total devis</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-yellow-600">
                {getQuotesForStatus('SENT').length}
              </div>
              <div className="text-sm text-gray-600">En attente</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-green-600">
                {getQuotesForStatus('SIGNED').length}
              </div>
              <div className="text-sm text-gray-600">Devis signés</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-emerald-600">
                {getQuotesForStatus('PAID').length}
              </div>
              <div className="text-sm text-gray-600">Règlements effectués</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(
                  quotes
                    .filter(q => q.status === 'INVOICED' && q.invoiceAmountTTC)
                    .reduce((sum, q) => sum + (q.invoiceAmountTTC || 0), 0)
                )}
              </div>
              <div className="text-sm text-gray-600">CA facturé</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
