'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
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

export default function InvoicesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [quotes, setQuotes] = useState<QuoteRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

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

  // Filtrer uniquement les devis facturés
  const invoicedQuotes = quotes.filter(quote => quote.status === 'INVOICED')

  const filteredInvoicedQuotes = invoicedQuotes.filter((quote) => {
    const matchesSearch = 
      quote.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.client.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quote.client.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quote.client.companyName && quote.client.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      quote.client.email.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  }).sort((a, b) => {
    // Trier par date de location la plus récente
    const dateA = new Date(a.desiredStart)
    const dateB = new Date(b.desiredStart)
    return dateB.getTime() - dateA.getTime()
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

  const handleRowClick = (quoteId: string, event: React.MouseEvent) => {
    // Éviter la navigation si on clique sur un bouton ou un lien
    const target = event.target as HTMLElement
    if (target.closest('button') || target.closest('a')) {
      return
    }
    router.push(`/admin/quotes/${quoteId}`)
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Factures</h1>
            <p className="text-gray-600">Locations terminées et facturées</p>
          </div>
          <Link href="/admin/quotes">
            <Button variant="outline">
              🏃‍♂️ Voir les devis en cours
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-purple-600">📋</span>
              Factures émises
              <span className="text-sm bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-normal">
                {filteredInvoicedQuotes.length}
              </span>
            </CardTitle>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input
                placeholder="Rechercher une facture..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredInvoicedQuotes.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-2">📋</div>
                <p className="text-gray-500">
                  {searchTerm ? 'Aucune facture trouvée pour cette recherche' : 'Aucune facture émise'}
                </p>
                {!searchTerm && (
                  <p className="text-sm text-gray-400 mt-2">
                    Les factures apparaîtront ici une fois les locations terminées et facturées
                  </p>
                )}
              </div>
            ) : (
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
                        Date de location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Fond
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Montant facturé
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredInvoicedQuotes.map((quote) => (
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
                            Créé le {formatDate(new Date(quote.createdAt))}
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
                          <div className="text-sm text-gray-900">
                            {formatDate(new Date(quote.desiredStart))}
                          </div>
                          <div className="text-sm text-gray-500">
                            au {formatDate(new Date(quote.desiredEnd))}
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {quote.invoiceAmountTTC ? formatCurrency(quote.invoiceAmountTTC) : formatCurrency(quote.amountTTC || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
