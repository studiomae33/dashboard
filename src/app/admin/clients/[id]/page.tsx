'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface QuoteRequest {
  id: string
  reference: string
  status: string
  createdAt: string
  desiredStart: string
  desiredEnd: string
  background: string
}

interface Client {
  id: string
  firstName: string
  lastName: string
  companyName?: string
  email: string
  phone?: string
  billingAddress?: string
  notes?: string
  createdAt: string
  _count: {
    quoteRequests: number
  }
  quoteRequests: QuoteRequest[]
}

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated' && params?.id) {
      fetchClient()
    }
  }, [status, router, params?.id])

  async function fetchClient() {
    try {
      const response = await fetch(`/api/admin/clients/${params.id}`)
      if (response.ok) {
        const clientData = await response.json()
        setClient(clientData)
      } else if (response.status === 404) {
        router.push('/admin/clients')
      }
    } catch (error) {
      console.error('Erreur lors du chargement du client:', error)
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!session || !client) {
    return null
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href="/admin/clients" className="text-blue-600 hover:text-blue-800 mr-4">
              ← Retour aux clients
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {client.companyName || `${client.firstName} ${client.lastName}`}
              </h1>
              <p className="text-gray-600">
                Fiche client - {client._count.quoteRequests} devis
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Link href={`/admin/clients/${client.id}/edit`}>
              <Button>
                ✏️ Modifier
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations du client */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations personnelles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Prénom</label>
                    <p className="text-sm text-gray-900">{client.firstName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nom</label>
                    <p className="text-sm text-gray-900">{client.lastName}</p>
                  </div>
                </div>
                
                {client.companyName && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Entreprise</label>
                    <p className="text-sm text-gray-900">{client.companyName}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm text-gray-900">
                      <a href={`mailto:${client.email}`} className="text-blue-600 hover:text-blue-800">
                        {client.email}
                      </a>
                    </p>
                  </div>
                  {client.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Téléphone</label>
                      <p className="text-sm text-gray-900">
                        <a href={`tel:${client.phone}`} className="text-blue-600 hover:text-blue-800">
                          {client.phone}
                        </a>
                      </p>
                    </div>
                  )}
                </div>

                {client.billingAddress && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Adresse de facturation</label>
                    <p className="text-sm text-gray-900 whitespace-pre-line">{client.billingAddress}</p>
                  </div>
                )}

                {client.notes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Notes internes</label>
                    <p className="text-sm text-gray-900 whitespace-pre-line bg-gray-50 p-3 rounded">
                      {client.notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Historique des devis */}
            <Card>
              <CardHeader>
                <CardTitle>Historique des devis</CardTitle>
              </CardHeader>
              <CardContent>
                {client.quoteRequests.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Aucun devis pour ce client</p>
                    <Link href="/admin/quotes/new">
                      <Button variant="outline" className="mt-4">
                        Créer un devis
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {client.quoteRequests.map((quote) => (
                      <div key={quote.id} className="border rounded-lg p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center space-x-2">
                              <Link 
                                href={`/admin/quotes/${quote.id}`}
                                className="font-medium text-blue-600 hover:text-blue-800"
                              >
                                {quote.reference}
                              </Link>
                              <StatusBadge status={quote.status} />
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              {quote.background}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {formatDate(new Date(quote.desiredStart))} - {formatDate(new Date(quote.desiredEnd))}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-500">
                              Créé le {formatDate(new Date(quote.createdAt))}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {client._count.quoteRequests > 5 && (
                      <div className="text-center pt-4">
                        <Link href={`/admin/quotes?client=${client.id}`}>
                          <Button variant="outline">
                            Voir tous les devis ({client._count.quoteRequests})
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Statistiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nombre de devis</label>
                  <p className="text-2xl font-bold text-blue-600">{client._count.quoteRequests}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Client depuis</label>
                  <p className="text-sm text-gray-900">
                    {new Intl.DateTimeFormat('fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }).format(new Date(client.createdAt))}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Actions rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href={`/admin/quotes/new?client=${client.id}`}>
                  <Button className="w-full">
                    📝 Nouveau devis
                  </Button>
                </Link>
                <a href={`mailto:${client.email}`}>
                  <Button variant="outline" className="w-full">
                    📧 Envoyer un email
                  </Button>
                </a>
                {client.phone && (
                  <a href={`tel:${client.phone}`}>
                    <Button variant="outline" className="w-full">
                      📞 Appeler
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
