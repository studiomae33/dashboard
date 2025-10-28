'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface EquipmentRequest {
  id: string
  equipment: string
  status: string
  rejectionReason?: string
  quoteRequest: {
    reference: string
    desiredStart: string
    desiredEnd: string
    background: string
    client: {
      firstName: string
      lastName: string
      companyName?: string
    }
  }
}

export default function RejectEquipmentPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string
  
  const [equipmentRequest, setEquipmentRequest] = useState<EquipmentRequest | null>(null)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchEquipmentRequest()
  }, [token])

  const fetchEquipmentRequest = async () => {
    try {
      const response = await fetch(`/api/equipment/details/${token}`)
      if (!response.ok) {
        setError('Demande non trouvée ou token invalide')
        setLoading(false)
        return
      }
      
      const data = await response.json()
      setEquipmentRequest(data)
      
      // Si la demande est déjà rejetée, on affiche un message approprié
      if (data.status === 'REJECTED') {
        setError('Cette demande a déjà été rejetée')
        setLoading(false)
        return
      }
      
      // Si la demande est confirmée, on affiche un message approprié
      if (data.status === 'CONFIRMED') {
        setError('Cette demande a déjà été confirmée')
        setLoading(false)
        return
      }
      
    } catch (error) {
      console.error('Erreur:', error)
      setError('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/equipment/validate/${token}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: reason.trim() }),
      })

      if (response.ok) {
        setSuccess(true)
      } else {
        const errorData = await response.json()
        // Si l'erreur dit que c'est déjà traité, on affiche un message plus clair
        if (errorData.message?.includes('déjà été traitée')) {
          setError('Cette demande a déjà été traitée par une autre personne')
        } else {
          setError(errorData.message || 'Erreur lors du rejet')
        }
      }
    } catch (error) {
      console.error('Erreur:', error)
      setError('Erreur lors du rejet')
    } finally {
      setSubmitting(false)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error && !equipmentRequest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-500 text-5xl mb-4">❌</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Retour
          </button>
        </div>
      </div>
    )
  }

  // Si la demande a déjà été traitée, on affiche un message approprié
  if (equipmentRequest && (equipmentRequest.status === 'CONFIRMED' || equipmentRequest.status === 'REJECTED')) {
    const isConfirmed = equipmentRequest.status === 'CONFIRMED'
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className={`text-5xl mb-4 ${isConfirmed ? 'text-green-500' : 'text-orange-500'}`}>
            {isConfirmed ? '✅' : '⚠️'}
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Demande déjà traitée
          </h1>
          <p className="text-gray-600 mb-4">
            Cette demande de matériel a déjà été {isConfirmed ? 'acceptée' : 'refusée'}.
          </p>
          {equipmentRequest.status === 'REJECTED' && equipmentRequest.rejectionReason && (
            <div className="bg-gray-50 p-4 rounded-md text-left mb-4">
              <p className="text-sm font-medium text-gray-700">Raison du refus :</p>
              <p className="text-sm text-gray-600 mt-1">{equipmentRequest.rejectionReason}</p>
            </div>
          )}
          <button
            onClick={() => router.back()}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Retour
          </button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-green-500 text-5xl mb-4">✅</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Demande rejetée</h1>
          <p className="text-gray-600 mb-4">
            Votre refus a été enregistré avec succès. Le studio sera notifié de votre décision.
          </p>
          <div className="bg-gray-50 p-4 rounded-md text-left">
            <p className="text-sm font-medium text-gray-700">Raison du refus :</p>
            <p className="text-sm text-gray-600 mt-1">{reason}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!equipmentRequest) return null

  const clientName = equipmentRequest.quoteRequest.client.companyName || 
    `${equipmentRequest.quoteRequest.client.firstName} ${equipmentRequest.quoteRequest.client.lastName}`

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-red-600 px-6 py-4">
            <h1 className="text-xl font-semibold text-white">
              Refuser la demande de matériel
            </h1>
            <p className="text-red-100 text-sm mt-1">
              Indiquez la raison de votre refus
            </p>
          </div>

          {/* Contenu */}
          <div className="px-6 py-6">
            {/* Informations de la demande */}
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Détails de la demande
              </h2>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Client :</span>
                    <span className="ml-2 text-gray-600">{clientName}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Référence :</span>
                    <span className="ml-2 text-gray-600">{equipmentRequest.quoteRequest.reference}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-medium text-gray-700">Date de la séance :</span>
                    <span className="ml-2 text-gray-600">
                      {formatDate(equipmentRequest.quoteRequest.desiredStart)}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-medium text-gray-700">Configuration :</span>
                    <span className="ml-2 text-gray-600">{equipmentRequest.quoteRequest.background}</span>
                  </div>
                </div>
                
                <div className="border-t pt-3">
                  <span className="font-medium text-gray-700 block mb-2">Matériel demandé :</span>
                  <div className="bg-white rounded border p-3 text-sm text-gray-600 whitespace-pre-wrap">
                    {equipmentRequest.equipment}
                  </div>
                </div>
              </div>
            </div>

            {/* Formulaire de rejet */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                  Raison du refus *
                </label>
                <textarea
                  id="reason"
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="Expliquez pourquoi le matériel n'est pas disponible..."
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  Cette raison sera transmise au studio et au client.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting || !reason.trim()}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Enregistrement...' : 'Confirmer le refus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
