'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatDate, formatCurrency } from '@/lib/utils'
import { ChevronUpIcon, ChevronDownIcon, MagnifyingGlassIcon, EyeIcon, PencilIcon } from '@heroicons/react/24/outline'

interface Quote {
  id: string
  reference: string
  status: string
  desiredStart: Date
  desiredEnd: Date
  background: string
  message?: string
  amountTTC?: number
  invoiceAmountTTC?: number
  client: {
    firstName: string
    lastName: string
    companyName?: string
    email: string
  }
}

const statusConfig = {
  DRAFT: { label: 'Brouillon', color: 'bg-gray-500', priority: 1 },
  READY: { label: 'Prêt à envoyer', color: 'bg-blue-500', priority: 2 },
  SENT: { label: 'Envoyé', color: 'bg-yellow-500', priority: 3 },
  SIGNED: { label: 'Signé', color: 'bg-green-500', priority: 4 },
  PAID: { label: 'Payé', color: 'bg-emerald-500', priority: 5 },
  INVOICED: { label: 'Facturé', color: 'bg-purple-500', priority: 6 },
  CANCELED: { label: 'Annulé', color: 'bg-red-500', priority: 0 },
}

type SortField = 'reference' | 'client' | 'status' | 'desiredStart' | 'amount'
type SortDirection = 'asc' | 'desc'

export default function PipelinePage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<SortField>('desiredStart')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

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

  function getClientName(client: Quote['client']) {
    return client.companyName || `${client.firstName} ${client.lastName}`
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredAndSortedQuotes = quotes
    .filter(quote => {
      const searchLower = searchTerm.toLowerCase()
      return (
        quote.reference.toLowerCase().includes(searchLower) ||
        getClientName(quote.client).toLowerCase().includes(searchLower) ||
        quote.background.toLowerCase().includes(searchLower) ||
        statusConfig[quote.status as keyof typeof statusConfig]?.label.toLowerCase().includes(searchLower)
      )
    })
    .sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'reference':
          aValue = a.reference
          bValue = b.reference
          break
        case 'client':
          aValue = getClientName(a.client)
          bValue = getClientName(b.client)
          break
        case 'status':
          aValue = statusConfig[a.status as keyof typeof statusConfig]?.priority || 0
          bValue = statusConfig[b.status as keyof typeof statusConfig]?.priority || 0
          break
        case 'desiredStart':
          aValue = a.desiredStart.getTime()
          bValue = b.desiredStart.getTime()
          break
        case 'amount':
          aValue = a.amountTTC || a.invoiceAmountTTC || 0
          bValue = b.amountTTC || b.invoiceAmountTTC || 0
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <div className="w-4 h-4" />
    return sortDirection === 'asc' ? 
      <ChevronUpIcon className="w-4 h-4" /> : 
      <ChevronDownIcon className="w-4 h-4" />
  }

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
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Pipeline des devis</h1>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Barre de recherche */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Rechercher devis, client, background..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            
            <Button onClick={fetchQuotes} variant="outline">
              Actualiser
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {Object.entries(statusConfig).map(([status, config]) => {
            const count = quotes.filter(quote => quote.status === status).length
            return (
              <Card key={status} className="text-center">
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-gray-900 mb-1">{count}</div>
                  <div className="text-sm text-gray-600">{config.label}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Tableau */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Tous les devis ({filteredAndSortedQuotes.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('reference')}
                    >
                      <div className="flex items-center gap-1">
                        Référence
                        <SortIcon field="reference" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('client')}
                    >
                      <div className="flex items-center gap-1">
                        Client
                        <SortIcon field="client" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1">
                        Statut
                        <SortIcon field="status" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('desiredStart')}
                    >
                      <div className="flex items-center gap-1">
                        Date souhaitée
                        <SortIcon field="desiredStart" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Background
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('amount')}
                    >
                      <div className="flex items-center gap-1">
                        Montant
                        <SortIcon field="amount" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedQuotes.map((quote) => {
                    const config = statusConfig[quote.status as keyof typeof statusConfig]
                    return (
                      <tr key={quote.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-4">
                          <div className="text-sm font-medium text-blue-600 hover:text-blue-800">
                            {quote.reference}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900">
                            {getClientName(quote.client)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {quote.client.email}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${config.color}`}>
                            {config.label}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900">
                            {formatDate(quote.desiredStart)}
                          </div>
                          <div className="text-xs text-gray-500">
                            → {formatDate(quote.desiredEnd)}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm text-gray-900 max-w-32 truncate" title={quote.background}>
                            {quote.background}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          {(quote.amountTTC || quote.invoiceAmountTTC) ? (
                            <div className="text-sm font-medium text-green-600">
                              {formatCurrency(quote.amountTTC || quote.invoiceAmountTTC || 0)}
                            </div>
                          ) : (
                            <div className="text-sm text-gray-400">-</div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.location.href = `/admin/quotes/${quote.id}`}
                              className="h-8 w-8 p-0"
                              title="Voir le détail"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </Button>
                            
                            {quote.status === 'DRAFT' && (
                              <Button
                                size="sm"
                                onClick={() => updateQuoteStatus(quote.id, 'READY')}
                                className="h-8 px-3 text-xs"
                              >
                                Finaliser
                              </Button>
                            )}
                            
                            {quote.status === 'READY' && (
                              <Button
                                size="sm"
                                onClick={() => window.location.href = `/admin/quotes/${quote.id}/email`}
                                className="h-8 px-3 text-xs"
                              >
                                Envoyer
                              </Button>
                            )}
                            
                            {quote.status === 'SIGNED' && (
                              <Button
                                size="sm"
                                onClick={() => updateQuoteStatus(quote.id, 'PAID')}
                                className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700"
                              >
                                Encaisser
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              
              {filteredAndSortedQuotes.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg mb-2">Aucun devis trouvé</div>
                  <div className="text-gray-500 text-sm">
                    {searchTerm ? 'Essayez de modifier votre recherche' : 'Créez votre premier devis'}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
