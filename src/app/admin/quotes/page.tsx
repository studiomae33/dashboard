'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/ui/badge'
import { formatDate, formatCurrency, isDateInCurrentMonth } from '@/lib/utils'
import Link from 'next/link'

interface QuoteRequest {
  id: string
  reference: string
  status: string
  desiredStart: string
  desiredEnd: string
  background: string
  message?: string
  createdAt: string
  sentAt?: string
  signedAt?: string
  amountTTC?: number
  invoiceAmountTTC?: number
  client: {
    id: string
    firstName: string
    lastName: string
    companyName?: string
    email: string
  }
}

const statusFilters = [
  { value: '', label: 'Tous les statuts' },
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'READY', label: 'Prêt' },
  { value: 'SENT', label: 'Envoyé' },
  { value: 'SIGNED', label: 'Signé' },
  { value: 'PAYMENT_PENDING', label: 'Paiement demandé' },
  { value: 'ONSITE_PAYMENT', label: 'Paiement sur place' },
  { value: 'INVOICED', label: 'Facturé' },
]

export default function QuotesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [quotes, setQuotes] = useState<QuoteRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      fetchQuotes()
    }
  }, [status, router])

  async function fetchQuotes() {
    try {
      const response = await fetch('/api/admin/quotes')
      if (response.ok) {
        const data = await response.json()
        setQuotes(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des devis:', error)
    } finally {
      setLoading(false)
    }
  }

  // Séparer les devis en cours et les devis passés
  const activeQuotes = quotes.filter(quote => quote.status !== 'INVOICED')

  const filteredActiveQuotes = activeQuotes.filter((quote) => {
    const matchesSearch = 
      quote.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.client.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quote.client.companyName && quote.client.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      quote.client.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = !statusFilter || quote.status === statusFilter

    return matchesSearch && matchesStatus
  }).sort((a, b) => {
    // Trier par date de location la plus proche
    const dateA = new Date(a.desiredStart)
    const dateB = new Date(b.desiredStart)
    return dateA.getTime() - dateB.getTime()
  })

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!session) {
    return null
  }

  // Fonction pour rendre un tableau de devis
  const renderQuotesTable = (quotesToRender: QuoteRequest[], showActions: boolean = true) => {
    if (quotesToRender.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">Aucun devis dans cette catégorie</p>
        </div>
      )
    }

    const handleRowClick = (quoteId: string, event: React.MouseEvent) => {
      // Éviter la navigation si on clique sur un bouton ou un lien
      const target = event.target as HTMLElement
      if (target.closest('button') || target.closest('a')) {
        return
      }
      router.push(`/admin/quotes/${quoteId}`)
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Référence
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date souhaitée
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Fond
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Montant
              </th>
              {showActions && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {quotesToRender.map((quote) => (
              <tr 
                key={quote.id} 
                className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                onClick={(e) => handleRowClick(quote.id, e)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {quote.reference}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(new Date(quote.createdAt))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {quote.client.companyName || `${quote.client.firstName} ${quote.client.lastName}`}
                  </div>
                  {quote.client.companyName && (
                    <div className="text-sm text-gray-500">
                      {quote.client.firstName} {quote.client.lastName}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`text-sm ${isDateInCurrentMonth(new Date(quote.desiredStart)) ? 'text-blue-600 font-semibold' : 'text-gray-900'}`}>
                    {formatDate(new Date(quote.desiredStart))}
                  </div>
                  <div className={`text-sm ${isDateInCurrentMonth(new Date(quote.desiredEnd)) ? 'text-blue-600 font-semibold' : 'text-gray-500'}`}>
                    {formatDate(new Date(quote.desiredEnd))}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm text-gray-600">
                    {quote.background}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge 
                    status={quote.status} 
                    quote={{
                      status: quote.status,
                      desiredEnd: quote.desiredEnd
                    }}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {quote.amountTTC ? formatCurrency(quote.amountTTC) : (quote.invoiceAmountTTC ? formatCurrency(quote.invoiceAmountTTC) : '-')}
                </td>
                {showActions && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {quote.status === 'READY' && (
                        <Link href={`/admin/quotes/${quote.id}/email`}>
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800">
                            📧 Envoyer
                          </Button>
                        </Link>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Devis</h1>
            <p className="text-gray-600">Gérez vos demandes de devis et leur statut</p>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/admin/invoices">
              <Button variant="outline">
                📋 Voir les factures
              </Button>
            </Link>
            <Link href="/admin/quotes/new">
              <Button>
                📝 Nouveau devis
              </Button>
            </Link>
          </div>
        </div>

        {/* Section Devis en cours */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-blue-600">🏃‍♂️</span>
              Devis en cours
              <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-normal">
                {filteredActiveQuotes.length}
              </span>
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Rechercher un devis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="max-w-sm rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {statusFilters.filter(f => f.value !== 'INVOICED').map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {filteredActiveQuotes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">
                  {searchTerm || statusFilter ? 'Aucun devis en cours trouvé pour cette recherche' : 'Aucun devis en cours'}
                </p>
                {!searchTerm && !statusFilter && (
                  <Link href="/admin/quotes/new">
                    <Button variant="outline" className="mt-4">
                      Créer le premier devis
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              renderQuotesTable(filteredActiveQuotes, true)
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
