'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Logo } from '@/components/Logo'

interface BookingInfo {
  booking: {
    start: string
    end: string
    background: string
  }
  quote: {
    reference: string
  }
  client: {
    firstName: string
    lastName: string
    companyName?: string
  }
  settings: {
    studioName: string
    studioAddress: string
    studioPhone: string
    studioEmail: string
  }
}

export default function LocationInfoPage() {
  const params = useParams()
  const [bookingInfo, setBookingInfo] = useState<BookingInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBookingInfo() {
      try {
        const response = await fetch(`/api/location-info/${params.token}`)
        
        if (!response.ok) {
          throw new Error('Information non trouvée ou token invalide')
        }
        
        const data = await response.json()
        setBookingInfo(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement')
      } finally {
        setLoading(false)
      }
    }

    if (params.token) {
      fetchBookingInfo()
    }
  }, [params.token])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des informations...</p>
        </div>
      </div>
    )
  }

  if (error || !bookingInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Accès non autorisé</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-sm text-gray-500">
            Si vous pensez qu'il s'agit d'une erreur, contactez-nous au {bookingInfo?.settings.studioPhone || '05.54.54.70.93'}
          </p>
        </div>
      </div>
    )
  }

  const clientName = bookingInfo.client.companyName || 
                    `${bookingInfo.client.firstName} ${bookingInfo.client.lastName}`

  const startDate = new Date(bookingInfo.booking.start)
  const endDate = new Date(bookingInfo.booking.end)

  const dateStr = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'Europe/Paris'
  }).format(startDate)

  const timeStr = `${new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris'
  }).format(startDate)} - ${new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Paris'
  }).format(endDate)}`

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <Logo className="h-12 w-auto" />
            <div className="ml-4">
              <h1 className="text-2xl font-bold text-gray-900">{bookingInfo.settings.studioName}</h1>
              <p className="text-gray-600">Informations pratiques pour votre location</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Rappel de la réservation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <div className="text-3xl mr-4">🎬</div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-blue-900 mb-2">Votre réservation</h2>
              <div className="space-y-2">
                <p><strong>Client :</strong> {clientName}</p>
                <p><strong>Référence :</strong> <code className="bg-blue-100 px-2 py-1 rounded text-sm">{bookingInfo.quote.reference}</code></p>
                <p><strong>Date :</strong> {dateStr}</p>
                <p><strong>Horaire :</strong> {timeStr}</p>
                <p><strong>Configuration :</strong> {bookingInfo.booking.background}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Informations pratiques */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-3">📍</span>
                Adresse & Accès
              </h2>
              <div className="space-y-3">
                <p className="text-gray-700">{bookingInfo.settings.studioAddress}</p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">🚗 Parking</h4>
                  <p className="text-sm text-gray-600">
                    Parking gratuit disponible dans la rue. Places de stationnement à proximité immédiate du studio.
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">🚇 Transports en commun</h4>
                  <p className="text-sm text-gray-600">
                    Tram B - Arrêt "Arts et Métiers" (5 min à pied)<br/>
                    Bus ligne 11 - Arrêt "Promis" (2 min à pied)
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-3">🕐</span>
                Horaires & Ponctualité
              </h2>
              <div className="space-y-3">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <p className="text-green-800 font-medium">✅ Arrivez 15 minutes avant votre créneau</p>
                  <p className="text-green-700 text-sm mt-1">
                    Cela nous permet de faire le brief et de préparer le matériel ensemble.
                  </p>
                </div>
                <p className="text-gray-700">
                  <strong>Votre créneau :</strong> {timeStr}
                </p>
                <p className="text-sm text-gray-600">
                  Le studio sera prêt et configuré selon vos besoins dès votre arrivée.
                </p>
              </div>
            </div>
          </div>

          {/* Matériel et services */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-3">📷</span>
                Matériel Inclus
              </h2>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-2xl mb-1">💡</div>
                    <p className="text-sm font-medium">Éclairage professionnel</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-2xl mb-1">🎨</div>
                    <p className="text-sm font-medium">Fonds colorés</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-2xl mb-1">📱</div>
                    <p className="text-sm font-medium">Adaptateurs</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg text-center">
                    <div className="text-2xl mb-1">🎵</div>
                    <p className="text-sm font-medium">Système audio</p>
                  </div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <p className="text-blue-800 text-sm">
                    <strong>Votre configuration :</strong> {bookingInfo.booking.background}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <span className="text-2xl mr-3">💼</span>
                Ce que vous devez apporter
              </h2>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Votre matériel photo/vidéo
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Cartes mémoire et batteries
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Tenues/accessoires pour le shooting
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-2">✓</span>
                  Playlist si besoin d'ambiance
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <span className="text-2xl mr-3">❓</span>
            Questions Fréquentes
          </h2>
          <div className="space-y-4">
            <details className="border border-gray-200 rounded-lg">
              <summary className="p-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
                Puis-je annuler ou modifier ma réservation ?
              </summary>
              <div className="p-4 pt-0 text-gray-700">
                <p>Les modifications sont possibles jusqu'à 48h avant votre créneau. Contactez-nous au {bookingInfo.settings.studioPhone} pour toute demande.</p>
              </div>
            </details>

            <details className="border border-gray-200 rounded-lg">
              <summary className="p-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
                Y a-t-il un vestiaire sur place ?
              </summary>
              <div className="p-4 pt-0 text-gray-700">
                <p>Oui, un espace vestiaire privé est à votre disposition pour vous changer et préparer vos tenues.</p>
              </div>
            </details>

            <details className="border border-gray-200 rounded-lg">
              <summary className="p-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
                Puis-je venir avec plusieurs personnes ?
              </summary>
              <div className="p-4 pt-0 text-gray-700">
                <p>Bien sûr ! Le studio peut accueillir votre équipe. Précisez-nous le nombre de personnes si vous ne l'avez pas déjà fait.</p>
              </div>
            </details>

            <details className="border border-gray-200 rounded-lg">
              <summary className="p-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
                Que faire en cas de retard ?
              </summary>
              <div className="p-4 pt-0 text-gray-700">
                <p>Appelez-nous immédiatement au {bookingInfo.settings.studioPhone}. Nous adapterons dans la mesure du possible, mais votre créneau pourrait être raccourci.</p>
              </div>
            </details>

            <details className="border border-gray-200 rounded-lg">
              <summary className="p-4 cursor-pointer font-medium text-gray-900 hover:bg-gray-50">
                Le matériel est-il assuré ?
              </summary>
              <div className="p-4 pt-0 text-gray-700">
                <p>Notre matériel est assuré. Vous restez responsable de votre propre matériel. Nous vous conseillons de vérifier votre assurance personnelle.</p>
              </div>
            </details>
          </div>
        </div>

        {/* Contact */}
        <div className="mt-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="text-2xl mr-3">📞</span>
            Une question ? Contactez-nous !
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Téléphone</p>
              <a href={`tel:${bookingInfo.settings.studioPhone}`} className="text-blue-200 hover:text-white">
                {bookingInfo.settings.studioPhone}
              </a>
            </div>
            <div>
              <p className="font-medium">Email</p>
              <a href={`mailto:${bookingInfo.settings.studioEmail}`} className="text-blue-200 hover:text-white">
                {bookingInfo.settings.studioEmail}
              </a>
            </div>
          </div>
          <p className="mt-4 text-blue-100 text-sm">
            Notre équipe est disponible pour répondre à toutes vos questions et vous accompagner dans la réussite de votre projet.
          </p>
        </div>
      </div>
    </div>
  )
}
