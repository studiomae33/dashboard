'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

interface CheckoutData {
  id: string
  amount: number
  currency: string
  description: string
  checkout_reference: string
  status: string
}

function SumUpPaymentContent() {
  const searchParams = useSearchParams()
  const checkoutId = searchParams.get('checkout')
  const reference = searchParams.get('ref')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null)

  useEffect(() => {
    if (!checkoutId) {
      setError('ID de checkout manquant')
      setLoading(false)
      return
    }

    fetchCheckoutData()
  }, [checkoutId])

  const fetchCheckoutData = async () => {
    try {
      console.log('🔍 Récupération des données du checkout:', checkoutId)
      
      const response = await fetch(`/api/payments/sumup/checkout/${checkoutId}`)
      
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📦 Données du checkout récupérées:', data)
      
      setCheckoutData(data)
      
      // Si le checkout a déjà été payé, rediriger vers la page de succès
      if (data.status === 'PAID') {
        window.location.href = `/payment/success?checkout=${checkoutId}`
        return
      }

      // Charger le widget SumUp
      initializeSumUpWidget(data)
      
    } catch (err) {
      console.error('❌ Erreur lors de la récupération du checkout:', err)
      setError('Impossible de charger les données de paiement')
      setLoading(false)
    }
  }

  const initializeSumUpWidget = async (checkout: CheckoutData) => {
    try {
      console.log('🚀 Initialisation du widget SumUp pour checkout:', checkout.id)
      
      // Première approche : Widget intégré SumUp
      const widget = document.createElement('iframe')
      widget.src = `https://gateway.sumup.com/gateway/ecom/card/v2/checkout/${checkout.id}`
      widget.style.width = '100%'
      widget.style.height = '400px'
      widget.style.border = 'none'
      widget.style.borderRadius = '8px'
      
      const container = document.getElementById('sumup-card')
      if (container) {
        container.innerHTML = ''
        container.appendChild(widget)
        
        // Écouter les messages du widget
        window.addEventListener('message', (event) => {
          if (event.origin !== 'https://gateway.sumup.com') return
          
          console.log('📱 Message SumUp reçu:', event.data)
          
          if (event.data.type === 'success') {
            console.log('✅ Paiement réussi!')
            window.location.href = `/payment/success?checkout=${checkout.id}&ref=${reference}`
          } else if (event.data.type === 'error') {
            console.error('❌ Erreur de paiement:', event.data)
            setError('Erreur lors du traitement du paiement')
          }
        })
        
        setLoading(false)
        return
      }
      
      // Fallback : SDK JavaScript classique
      console.log('⚠️ Fallback vers SDK JavaScript...')
      const script = document.createElement('script')
      script.src = 'https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js'
      script.async = true
      
      script.onload = () => {
        try {
          // @ts-ignore - SumUp SDK global
          if (typeof window !== 'undefined' && (window as any).SumUpCard) {
            (window as any).SumUpCard.mount({
              checkoutId: checkout.id,
              onResponse: function(type: string, body: any) {
                console.log('📱 Réponse SumUp SDK:', { type, body })
                
                switch (type) {
                  case 'sent':
                    console.log('💳 Paiement en cours...')
                    break
                  case 'success':
                    console.log('✅ Paiement réussi!')
                    window.location.href = `/payment/success?checkout=${checkout.id}&ref=${reference}`
                    break
                  case 'error':
                    console.error('❌ Erreur de paiement:', body)
                    setError('Erreur lors du traitement du paiement')
                    break
                  default:
                    console.log('ℹ️ Événement SumUp:', type, body)
                }
              }
            })
            setLoading(false)
          } else {
            throw new Error('SumUp SDK non disponible')
          }
        } catch (err) {
          console.error('❌ Erreur lors de l\'initialisation du widget:', err)
          setError('Erreur lors de l\'initialisation du paiement')
          setLoading(false)
        }
      }
      
      script.onerror = () => {
        console.error('❌ Erreur lors du chargement du SDK SumUp')
        setError('Erreur lors du chargement du système de paiement')
        setLoading(false)
      }
      
      document.head.appendChild(script)
      
    } catch (err) {
      console.error('❌ Erreur lors de l\'initialisation du widget SumUp:', err)
      setError('Erreur lors de l\'initialisation du paiement')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Chargement du paiement</h1>
          <p className="text-gray-600">
            Préparation de l'interface de paiement sécurisée...
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Erreur</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.history.back()}
            className="bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Paiement sécurisé</h1>
          {checkoutData && (
            <div className="space-y-2">
              <p className="text-gray-600">
                {reference ? `Devis ${reference}` : checkoutData.description}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {checkoutData.amount}€
              </p>
            </div>
          )}
        </div>

        {/* Container pour le widget SumUp */}
        <div id="sumup-card" className="mb-6 min-h-[400px] bg-gray-50 rounded-lg flex items-center justify-center">
          {/* Le widget SumUp sera injecté ici */}
          <div className="text-gray-500 text-sm">Chargement du formulaire de paiement...</div>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 616 0z" clipRule="evenodd" />
            </svg>
            <span>Paiement 100% sécurisé par SumUp</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SumUpPaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Chargement</h1>
          <p className="text-gray-600">Préparation du paiement...</p>
        </div>
      </div>
    }>
      <SumUpPaymentContent />
    </Suspense>
  )
}
