'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

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

export default function ConfirmEquipmentPage() {
  const params = useParams()
  const token = params.token as string
  
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [equipmentRequest, setEquipmentRequest] = useState<EquipmentRequest | null>(null)

  useEffect(() => {
    confirmEquipment()
  }, [token])

  const confirmEquipment = async () => {
    try {
      // D'abord récupérer les détails
      const detailsResponse = await fetch(`/api/equipment/details/${token}`)
      if (!detailsResponse.ok) {
        setError('Demande non trouvée')
        setLoading(false)
        return
      }
      
      const details = await detailsResponse.json()
      setEquipmentRequest(details)
      
      // Si la demande est déjà confirmée, on affiche directement le succès
      if (details.status === 'CONFIRMED') {
        setSuccess(true)
        setLoading(false)
        return
      }
      
      // Si la demande est rejetée, on affiche une erreur
      if (details.status === 'REJECTED') {
        setError('Cette demande a été rejetée')
        setLoading(false)
        return
      }

      // Seulement si la demande est encore en attente, on essaie de la confirmer
      if (details.status === 'PENDING') {
        const response = await fetch(`/api/equipment/validate/${token}/confirm`)
        if (response.ok) {
          setSuccess(true)
        } else {
          const errorData = await response.json()
          // Si l'erreur dit que c'est déjà traité, on considère ça comme un succès
          if (errorData.message?.includes('déjà été traitée')) {
            setSuccess(true)
          } else {
            setError(errorData.message || 'Erreur lors de la confirmation')
          }
        }
      }
    } catch (error) {
      console.error('Erreur:', error)
      setError('Erreur lors de la confirmation')
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Confirmation en cours...</p>
        </div>
      </div>
    )
  }

  // Si la demande a été rejetée, on affiche un message approprié
  if (equipmentRequest && equipmentRequest.status === 'REJECTED') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-orange-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Demande déjà rejetée</h1>
          <p className="text-gray-600 mb-4">
            Cette demande de matériel a déjà été refusée.
          </p>
          {equipmentRequest.rejectionReason && (
            <div className="bg-gray-50 p-4 rounded-md text-left">
              <p className="text-sm font-medium text-gray-700">Raison du refus :</p>
              <p className="text-sm text-gray-600 mt-1">{equipmentRequest.rejectionReason}</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-500 text-5xl mb-4">❌</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Erreur</h1>
          <p className="text-gray-600 mb-4">{error}</p>
        </div>
      </div>
    )
  }

  if (success && equipmentRequest) {
    const clientName = equipmentRequest.quoteRequest.client.companyName || 
      `${equipmentRequest.quoteRequest.client.firstName} ${equipmentRequest.quoteRequest.client.lastName}`

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl w-full bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-green-600 px-6 py-4">
            <div className="flex items-center">
              <div className="text-green-100 text-3xl mr-3">✅</div>
              <div>
                <h1 className="text-xl font-semibold text-white">
                  Matériel confirmé !
                </h1>
                <p className="text-green-100 text-sm">
                  Votre confirmation a été enregistrée avec succès
                </p>
              </div>
            </div>
          </div>

          {/* Contenu */}
          <div className="px-6 py-6">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Détails de la confirmation
              </h2>
              
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-4">
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
                
                <div className="border-t border-green-200 pt-4">
                  <span className="font-medium text-gray-700 block mb-2">Matériel confirmé :</span>
                  <div className="bg-white rounded border p-3 text-sm text-gray-600 whitespace-pre-wrap">
                    {equipmentRequest.equipment}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                📧 Notification automatique
              </h3>
              <p className="text-sm text-blue-600">
                Le studio a été automatiquement notifié de votre confirmation. 
                Ils pourront maintenant informer le client que le matériel sera disponible pour la séance.
              </p>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Merci d'avoir confirmé la disponibilité du matériel !
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
