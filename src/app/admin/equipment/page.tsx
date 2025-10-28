'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import AdminLayout from '@/components/admin-layout'

interface Quote {
  id: string
  reference: string
  desiredStart: string
  desiredEnd: string
  background: string
  client: {
    firstName: string
    lastName: string
    companyName?: string
    email: string
  }
  status: string
}

interface EquipmentRequest {
  id: string
  createdAt: string
  equipment: string
  status: string
  confirmedAt?: string
  rejectedAt?: string
  rejectionReason?: string
  quoteRequest: Quote
}

export default function EquipmentPage() {
  const { data: session, status } = useSession()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [equipmentRequests, setEquipmentRequests] = useState<EquipmentRequest[]>([])
  const [selectedQuote, setSelectedQuote] = useState<Quote | null>(null)
  const [equipment, setEquipment] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingQuotes, setLoadingQuotes] = useState(true)
  const [loadingRequests, setLoadingRequests] = useState(true)

  const fetchQuotes = async () => {
    try {
      setLoadingQuotes(true)
      const response = await fetch('/api/admin/quotes')
      if (response.ok) {
        const data = await response.json()
        // Filtrer les devis qui ne sont pas facturés (INVOICED) et qui ont des dates futures
        const validQuotes = data.filter((quote: Quote) => {
          const startDate = new Date(quote.desiredStart)
          const now = new Date()
          // Inclure tous les devis sauf ceux qui sont facturés, et qui ont des dates futures
          return startDate > now && quote.status !== 'INVOICED'
        })
        setQuotes(validQuotes)
      } else {
        console.error('Erreur lors du chargement des devis:', response.statusText)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des devis:', error)
    } finally {
      setLoadingQuotes(false)
    }
  }

  const fetchEquipmentRequests = async () => {
    try {
      setLoadingRequests(true)
      const response = await fetch('/api/admin/equipment-requests')
      if (response.ok) {
        const data = await response.json()
        setEquipmentRequests(data)
      } else {
        console.error('Erreur lors du chargement des demandes:', response.statusText)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des demandes:', error)
    } finally {
      setLoadingRequests(false)
    }
  }

  useEffect(() => {
    fetchQuotes()
    fetchEquipmentRequests()
  }, [])

  if (status === 'loading') {
    return <div>Chargement...</div>
  }

  if (status === 'unauthenticated') {
    redirect('/login')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedQuote || !equipment.trim()) return

    setLoading(true)
    try {
      const response = await fetch('/api/admin/equipment-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteRequestId: selectedQuote.id,
          equipment: equipment.trim(),
        }),
      })

      if (response.ok) {
        alert('Demande de location envoyée avec succès !')
        setSelectedQuote(null)
        setEquipment('')
        fetchEquipmentRequests()
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.message}`)
      }
    } catch (error) {
      console.error('Erreur:', error)
      alert('Erreur lors de l\'envoi de la demande')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString))
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      PENDING: { text: 'En attente', class: 'bg-yellow-100 text-yellow-800' },
      CONFIRMED: { text: 'Confirmé', class: 'bg-green-100 text-green-800' },
      REJECTED: { text: 'Refusé', class: 'bg-red-100 text-red-800' },
    }
    const statusInfo = statusMap[status as keyof typeof statusMap] || { text: status, class: 'bg-gray-100 text-gray-800' }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.class}`}>
        {statusInfo.text}
      </span>
    )
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Location de matériel</h1>
              <p className="mt-2 text-sm text-gray-600">
                Créez des demandes de location de matériel pour vos clients
              </p>
            </div>
            <button
              onClick={() => {
                fetchQuotes()
                fetchEquipmentRequests()
              }}
              disabled={loadingQuotes || loadingRequests}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {(loadingQuotes || loadingRequests) ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Actualisation...
                </>
              ) : (
                <>
                  <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Actualiser
                </>
              )}
            </button>
          </div>
        </div>

        {/* Formulaire de nouvelle demande */}
        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Nouvelle demande de location</h2>
          
          {loadingQuotes && (
            <div className="text-sm text-blue-600 mb-4">Chargement des devis...</div>
          )}
          
          {!loadingQuotes && quotes.length === 0 && (
            <div className="text-sm text-yellow-600 mb-4 p-3 bg-yellow-50 rounded-md">
              Aucun devis disponible pour la location de matériel. 
              Les devis doivent avoir une date future et ne pas être facturés.
            </div>
          )}
          
          {!loadingQuotes && quotes.length > 0 && (
            <div className="text-sm text-green-600 mb-4">
              {quotes.length} devis disponible{quotes.length > 1 ? 's' : ''} pour la location
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="quote" className="block text-sm font-medium text-gray-700">
                Sélectionner un devis
              </label>
              {loadingQuotes ? (
                <div className="mt-1 text-sm text-gray-500">Chargement des devis...</div>
              ) : (
                <select
                  id="quote"
                  value={selectedQuote?.id || ''}
                  onChange={(e) => {
                    const quote = quotes.find(q => q.id === e.target.value)
                    setSelectedQuote(quote || null)
                  }}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Choisir un devis...</option>
                  {quotes.map((quote) => {
                    const clientName = quote.client.companyName || `${quote.client.firstName} ${quote.client.lastName}`
                    return (
                      <option key={quote.id} value={quote.id}>
                        {quote.reference} - {clientName} - {formatDate(quote.desiredStart)}
                      </option>
                    )
                  })}
                </select>
              )}
            </div>

            {selectedQuote && (
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-sm font-medium text-gray-900 mb-2">Détails de la réservation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Client :</span> {selectedQuote.client.companyName || `${selectedQuote.client.firstName} ${selectedQuote.client.lastName}`}
                  </div>
                  <div>
                    <span className="font-medium">Email :</span> {selectedQuote.client.email}
                  </div>
                  <div>
                    <span className="font-medium">Début :</span> {formatDate(selectedQuote.desiredStart)}
                  </div>
                  <div>
                    <span className="font-medium">Fin :</span> {formatDate(selectedQuote.desiredEnd)}
                  </div>
                  <div className="md:col-span-2">
                    <span className="font-medium">Fond :</span> {selectedQuote.background}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="equipment" className="block text-sm font-medium text-gray-700">
                Matériel nécessaire
              </label>
              <textarea
                id="equipment"
                rows={4}
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Listez le matériel nécessaire pour cette séance..."
                required
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading || !selectedQuote || !equipment.trim()}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Envoi en cours...' : 'Envoyer la demande'}
              </button>
            </div>
          </form>
        </div>

        {/* Liste des demandes existantes */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Demandes de location existantes</h2>
          </div>
          
          {loadingRequests ? (
            <div className="p-6 text-center text-gray-500">Chargement des demandes...</div>
          ) : equipmentRequests.length === 0 ? (
            <div className="p-6 text-center text-gray-500">Aucune demande de location</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {equipmentRequests.map((request) => {
                const clientName = request.quoteRequest.client.companyName || 
                  `${request.quoteRequest.client.firstName} ${request.quoteRequest.client.lastName}`
                
                return (
                  <div key={request.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="text-sm font-medium text-gray-900">
                            {request.quoteRequest.reference} - {clientName}
                          </h3>
                          {getStatusBadge(request.status)}
                        </div>
                        <p className="mt-1 text-sm text-gray-600">
                          {formatDate(request.quoteRequest.desiredStart)} - {formatDate(request.quoteRequest.desiredEnd)}
                        </p>
                        <div className="mt-2">
                          <p className="text-sm font-medium text-gray-700">Matériel demandé :</p>
                          <p className="text-sm text-gray-600 whitespace-pre-wrap">{request.equipment}</p>
                        </div>
                        {request.status === 'REJECTED' && request.rejectionReason && (
                          <div className="mt-2 p-2 bg-red-50 rounded-md">
                            <p className="text-sm font-medium text-red-800">Raison du refus :</p>
                            <p className="text-sm text-red-600">{request.rejectionReason}</p>
                          </div>
                        )}
                      </div>
                      <div className="text-right text-xs text-gray-500">
                        Créé le {new Intl.DateTimeFormat('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(new Date(request.createdAt))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
