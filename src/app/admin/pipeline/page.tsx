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

        {/* Vue Kanban améliorée */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-7 gap-4">
          {statusOrder.map(status => {
            const statusQuotes = getQuotesForStatus(status)
            const config = statusConfig[status as keyof typeof statusConfig]
            
            return (
              <Card key={status} className="h-fit min-h-[200px] flex flex-col">
                <CardHeader className={`${config.color} rounded-t-lg p-3`}>
                  <CardTitle className={`text-sm ${config.textColor} flex items-center justify-between`}>
                    <span className="font-medium truncate">{config.label}</span>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full bg-white/90 ${config.textColor} min-w-[24px] text-center`}>
                      {statusQuotes.length}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-2 space-y-2 flex-1 max-h-[calc(100vh-300px)] overflow-y-auto">
                  {statusQuotes.length === 0 ? (
                    <div className="text-center text-gray-400 text-xs py-8">
                      Aucun devis
                    </div>
                  ) : (
                    statusQuotes.map(quote => (
                      <div 
                        key={quote.id} 
                        className="border rounded-md p-2 bg-white hover:shadow-sm transition-all duration-200 hover:border-blue-300 cursor-pointer group"
                        onClick={() => window.location.href = `/admin/quotes/${quote.id}`}
                      >
                        {/* En-tête compact */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-xs text-blue-600 truncate flex-1 mr-2">
                            {quote.reference}
                          </span>
                          {quote.invoiceAmountTTC && (
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                              {formatCurrency(quote.invoiceAmountTTC)}
                            </span>
                          )}
                        </div>
                        
                        {/* Client */}
                        <div className="text-xs font-medium text-gray-900 mb-1 truncate">
                          {getClientName(quote.client)}
                        </div>
                        
                        {/* Date et background sur une ligne */}
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                          <span className="truncate flex-1">📅 {formatDate(quote.desiredStart)}</span>
                        </div>
                        
                        {/* Background */}
                        <div className="text-xs text-gray-600 mb-2 truncate">
                          🎨 {quote.background}
                        </div>
                        
                        {/* Message tronqué */}
                        {quote.message && (
                          <div className="text-xs text-gray-400 line-clamp-1 mb-2 italic">
                            "{quote.message}"
                          </div>
                        )}
                        
                        {/* Actions compactes */}
                        <div className="flex justify-center pt-1 border-t border-gray-100">
                          {status === 'DRAFT' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                updateQuoteStatus(quote.id, 'READY')
                              }}
                              className="text-xs h-6 px-2 hover:bg-blue-50 hover:text-blue-600"
                            >
                              ✓ Finaliser
                            </Button>
                          )}
                          
                          {status === 'READY' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                window.location.href = `/admin/quotes/${quote.id}/email`
                              }}
                              className="text-xs h-6 px-2 hover:bg-blue-50 hover:text-blue-600"
                            >
                              📧 Envoyer
                            </Button>
                          )}
                          
                          {status === 'SENT' && (
                            <div className="text-xs text-center py-1">
                              <div className="text-blue-600 font-medium">⏳ En attente</div>
                            </div>
                          )}
                          
                          {status === 'SIGNED' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                updateQuoteStatus(quote.id, 'PAID')
                              }}
                              className="text-xs h-6 px-2 hover:bg-green-50 hover:text-green-600"
                            >
                              💰 Encaisser
                            </Button>
                          )}
                          
                          {status === 'PAID' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                updateQuoteStatus(quote.id, 'INVOICED')
                              }}
                              className="text-xs h-6 px-2 hover:bg-purple-50 hover:text-purple-600"
                            >
                              📄 Facturer
                            </Button>
                          )}
                          
                          {(status === 'INVOICED' || status === 'CANCELED') && (
                            <div className="text-xs text-center py-1">
                              <div className="text-gray-500">✓ Terminé</div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Statistiques compactes */}
        <div className="bg-white rounded-lg border p-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">📊 Résumé</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">
                {quotes.length}
              </div>
              <div className="text-xs text-gray-500">Total devis</div>
            </div>
            
            <div className="text-center">
              <div className="text-xl font-bold text-yellow-600">
                {getQuotesForStatus('SENT').length}
              </div>
              <div className="text-xs text-gray-500">En attente</div>
            </div>
            
            <div className="text-center">
              <div className="text-xl font-bold text-green-600">
                {getQuotesForStatus('SIGNED').length}
              </div>
              <div className="text-xs text-gray-500">Signés</div>
            </div>
            
            <div className="text-center">
              <div className="text-xl font-bold text-emerald-600">
                {getQuotesForStatus('PAID').length}
              </div>
              <div className="text-xs text-gray-500">Payés</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">
                {formatCurrency(
                  quotes
                    .filter(q => q.status === 'INVOICED' && q.invoiceAmountTTC)
                    .reduce((sum, q) => sum + (q.invoiceAmountTTC || 0), 0)
                )}
              </div>
              <div className="text-xs text-gray-500">CA facturé</div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
