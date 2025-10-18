'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import Link from 'next/link'

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
}

export default function EditClientPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    phone: '',
    billingAddress: '',
    notes: '',
  })

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
        setFormData({
          firstName: clientData.firstName || '',
          lastName: clientData.lastName || '',
          companyName: clientData.companyName || '',
          email: clientData.email || '',
          phone: clientData.phone || '',
          billingAddress: clientData.billingAddress || '',
          notes: clientData.notes || '',
        })
      } else if (response.status === 404) {
        router.push('/admin/clients')
      } else {
        setError('Erreur lors du chargement du client')
      }
    } catch (error) {
      console.error('Erreur lors du chargement du client:', error)
      setError('Erreur lors du chargement du client')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch(`/api/admin/clients/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setSuccess('Client modifié avec succès !')
        // Rafraîchir les données du client
        await fetchClient()
        // Rediriger après 2 secondes
        setTimeout(() => {
          router.push('/admin/clients')
        }, 2000)
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la modification')
      }
    } catch (error) {
      console.error('Erreur lors de la modification:', error)
      setError('Erreur lors de la modification du client')
    } finally {
      setIsLoading(false)
    }
  }

  function handleInputChange(field: string, value: string) {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Effacer les messages quand l'utilisateur tape
    if (error) setError('')
    if (success) setSuccess('')
  }

  async function handleDelete() {
    if (!client || client._count.quoteRequests > 0) return

    const clientName = client.companyName || `${client.firstName} ${client.lastName}`
    
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le client "${clientName}" ? Cette action est irréversible.`)) {
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/clients/${params.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setSuccess('Client supprimé avec succès !')
        setTimeout(() => {
          router.push('/admin/clients')
        }, 1500)
      } else {
        const data = await response.json()
        setError(data.error || 'Erreur lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      setError('Erreur lors de la suppression du client')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
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
        <div className="flex items-center mb-6">
          <Link href="/admin/clients" className="text-blue-600 hover:text-blue-800 mr-4">
            ← Retour aux clients
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Modifier le client
            </h1>
            <p className="text-gray-600">
              {client.companyName || `${client.firstName} ${client.lastName}`}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulaire de modification */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Informations du client</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                      {error}
                    </div>
                  )}
                  
                  {success && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                      {success}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                        Prénom *
                      </label>
                      <Input
                        id="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        required
                        placeholder="Prénom du client"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                        Nom *
                      </label>
                      <Input
                        id="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        required
                        placeholder="Nom du client"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
                      Nom de l'entreprise
                    </label>
                    <Input
                      id="companyName"
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      placeholder="Nom de l'entreprise (optionnel)"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                        Email *
                      </label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                        placeholder="email@exemple.com"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Téléphone
                      </label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="01 23 45 67 89"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="billingAddress" className="block text-sm font-medium text-gray-700 mb-1">
                      Adresse de facturation
                    </label>
                    <Textarea
                      id="billingAddress"
                      value={formData.billingAddress}
                      onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                      placeholder="Adresse complète de facturation"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                      Notes internes
                    </label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Notes internes sur le client"
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-4">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? '⏳ Modification...' : '✅ Modifier le client'}
                    </Button>
                    <Link href="/admin/clients">
                      <Button type="button" variant="outline">
                        Annuler
                      </Button>
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Informations supplémentaires */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Statistiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Nombre de devis</label>
                  <p className="text-lg font-semibold text-gray-900">{client._count.quoteRequests}</p>
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
                <CardTitle className="flex items-center gap-2">
                  <span>⚠️</span>
                  Actions dangereuses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Cette action est irréversible. Le client ne peut être supprimé que s'il n'a aucun devis associé.
                  </p>
                  <Button 
                    variant="outline" 
                    disabled={client._count.quoteRequests > 0}
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    onClick={handleDelete}
                  >
                    {client._count.quoteRequests > 0 
                      ? 'Impossible (devis existants)' 
                      : 'Supprimer le client'
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
