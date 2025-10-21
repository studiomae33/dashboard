'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent } from '@/components/ui/card'
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
  DRAFT: { 
    label: 'Brouillons', 
    icon: '📝',
    description: 'Devis en cours de rédaction'
  },
  READY: { 
    label: 'Prêts', 
    icon: '✅',
    description: 'Prêts à être envoyés'
  },
  SENT: { 
    label: 'Envoyés', 
    icon: '📤',
    description: 'En attente de signature'
  },
  SIGNED: { 
    label: 'Signés', 
    icon: '✍️',
    description: 'En attente de paiement'
  },
  PAID: { 
    label: 'Payés', 
    icon: '💰',
    description: 'Prêts à facturer'
  },
  INVOICED: { 
    label: 'Facturés', 
    icon: '📄',
    description: 'Processus terminé'
  },
  CANCELED: { 
    label: 'Annulés', 
    icon: '❌',
    description: 'Devis annulés'
  },
}

export default function PipelinePage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban')

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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </AdminLayout>
    )
  }

  const totalRevenue = quotes
    .filter(q => q.status === 'INVOICED' && q.invoiceAmountTTC)
    .reduce((sum, q) => sum + (q.invoiceAmountTTC || 0), 0)

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* En-tête propre */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pipeline</h1>
            <p className="text-gray-500 mt-1">Suivi des devis en temps réel</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('kanban')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'kanban' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Kanban
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-white text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Tableau
              </button>
            </div>
            <Button 
              onClick={fetchQuotes}
              variant="outline"
              className="bg-white"
            >
              ⟳ Actualiser
            </Button>
          </div>
        </div>

        {/* Statistiques minimalistes */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total devis</p>
                <p className="text-2xl font-bold text-gray-900">{quotes.length}</p>
              </div>
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                📋
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En attente</p>
                <p className="text-2xl font-bold text-orange-600">{getQuotesForStatus('SENT').length}</p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                ⏱️
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Signés</p>
                <p className="text-2xl font-bold text-green-600">{getQuotesForStatus('SIGNED').length}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                ✍️
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CA facturé</p>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                💰
              </div>
            </div>
          </div>
        </div>

        {/* Vue Kanban épurée */}
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-7 gap-4">
            {statusOrder.map(status => {
              const statusQuotes = getQuotesForStatus(status)
              const config = statusConfig[status as keyof typeof statusConfig]
              
              return (
                <div key={status} className="bg-gray-50 rounded-lg p-4 min-h-[500px]">
                  {/* En-tête de colonne minimaliste */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{config.icon}</span>
                      <div>
                        <h3 className="font-semibold text-gray-900">{config.label}</h3>
                        <p className="text-xs text-gray-500">{config.description}</p>
                      </div>
                    </div>
                    <span className="bg-gray-200 text-gray-700 text-xs font-semibold px-2 py-1 rounded-full">
                      {statusQuotes.length}
                    </span>
                  </div>

                  {/* Cartes de devis épurées */}
                  <div className="space-y-3">
                    {statusQuotes.length === 0 ? (
                      <div className="text-center text-gray-400 py-8">
                        <p className="text-sm">Aucun devis</p>
                      </div>
                    ) : (
                      statusQuotes.map(quote => (
                        <Card 
                          key={quote.id} 
                          className="bg-white border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => window.location.href = `/admin/quotes/${quote.id}`}
                        >
                          <CardContent className="p-4">
                            {/* Référence et montant */}
                            <div className="flex items-center justify-between mb-3">
                              <span className="font-semibold text-sm text-blue-600">
                                {quote.reference}
                              </span>
                              {quote.invoiceAmountTTC && (
                                <span className="text-sm font-bold text-gray-900">
                                  {formatCurrency(quote.invoiceAmountTTC)}
                                </span>
                              )}
                            </div>
                            
                            {/* Client */}
                            <p className="font-medium text-gray-900 mb-2 truncate">
                              {getClientName(quote.client)}
                            </p>
                            
                            {/* Date et background */}
                            <div className="space-y-1 mb-3">
                              <p className="text-xs text-gray-500">
                                📅 {formatDate(quote.desiredStart)}
                              </p>
                              <p className="text-xs text-gray-500 truncate">
                                🎨 {quote.background}
                              </p>
                            </div>
                            
                            {/* Actions selon le statut */}
                            <div className="pt-3 border-t border-gray-100">
                              {status === 'DRAFT' && (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    updateQuoteStatus(quote.id, 'READY')
                                  }}
                                  className="w-full h-8 text-xs"
                                >
                                  ✓ Finaliser
                                </Button>
                              )}
                              
                              {status === 'READY' && (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    window.location.href = `/admin/quotes/${quote.id}/email`
                                  }}
                                  className="w-full h-8 text-xs"
                                >
                                  📧 Envoyer
                                </Button>
                              )}
                              
                              {status === 'SENT' && (
                                <div className="text-center py-1">
                                  <span className="text-xs text-gray-500">En attente client</span>
                                </div>
                              )}
                              
                              {status === 'SIGNED' && (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    updateQuoteStatus(quote.id, 'PAID')
                                  }}
                                  className="w-full h-8 text-xs"
                                >
                                  💰 Marquer payé
                                </Button>
                              )}
                              
                              {status === 'PAID' && (
                                <Button
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    updateQuoteStatus(quote.id, 'INVOICED')
                                  }}
                                  className="w-full h-8 text-xs"
                                >
                                  📄 Facturer
                                </Button>
                              )}
                              
                              {(status === 'INVOICED' || status === 'CANCELED') && (
                                <div className="text-center py-1">
                                  <span className="text-xs text-gray-500">Terminé</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Vue tableau */}
        {viewMode === 'table' && (
          <Card className="bg-white">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Devis
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date souhaitée
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {quotes.map(quote => {
                      const config = statusConfig[quote.status as keyof typeof statusConfig]
                      return (
                        <tr 
                          key={quote.id} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => window.location.href = `/admin/quotes/${quote.id}`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-blue-600">
                              {quote.reference}
                            </div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {quote.background}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {getClientName(quote.client)}
                            </div>
                            <div className="text-sm text-gray-500">
                              {quote.client.email}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              {config.icon} {config.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(quote.desiredStart)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {quote.invoiceAmountTTC ? formatCurrency(quote.invoiceAmountTTC) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {quote.status === 'DRAFT' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updateQuoteStatus(quote.id, 'READY')
                                }}
                              >
                                Finaliser
                              </Button>
                            )}
                            {quote.status === 'READY' && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.location.href = `/admin/quotes/${quote.id}/email`
                                }}
                              >
                                Envoyer
                              </Button>
                            )}
                            {quote.status === 'SIGNED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updateQuoteStatus(quote.id, 'PAID')
                                }}
                              >
                                Marquer payé
                              </Button>
                            )}
                            {quote.status === 'PAID' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updateQuoteStatus(quote.id, 'INVOICED')
                                }}
                              >
                                Facturer
                              </Button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
