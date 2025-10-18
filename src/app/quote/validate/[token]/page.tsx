'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

interface QuoteValidationData {
  quote: {
    id: string
    reference: string
    status: string
    desiredStart: string
    desiredEnd: string
    background: string
    message?: string
  }
  client: {
    firstName: string
    lastName: string
    companyName?: string
    email: string
  }
  settings: {
    studioName: string
    studioAddress: string
    studioPhone: string
    studioEmail: string
  }
}

export default function QuoteValidationPage({ params }: { params: { token: string } }) {
  const router = useRouter()
  const [data, setData] = useState<QuoteValidationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [validating, setValidating] = useState(false)
  const [validated, setValidated] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (params?.token) {
      fetchQuoteData()
    }
  }, [params?.token])

  async function fetchQuoteData() {
    if (!params?.token) return

    try {
      const response = await fetch(`/api/quote/validate/${params.token}`)
      
      if (response.ok) {
        const result = await response.json()
        setData(result)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Lien de validation invalide ou expiré')
      }
    } catch (error) {
      setError('Erreur lors du chargement des données')
    } finally {
      setLoading(false)
    }
  }

  async function handleValidateQuote() {
    if (!params?.token || !data) return

    setValidating(true)
    try {
      const response = await fetch(`/api/quote/validate/${params.token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        setValidated(true)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erreur lors de la validation')
      }
    } catch (error) {
      setError('Erreur lors de la validation')
    } finally {
      setValidating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">❌ Erreur</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">{error}</p>
            <p className="text-sm text-gray-500">
              Si vous pensez qu'il s'agit d'une erreur, veuillez contacter {data?.settings.studioName || 'Studio MAE'}.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (validated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-green-600">✅ Devis validé !</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="text-6xl">🎉</div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Merci pour votre validation !
              </h2>
              <p className="text-gray-600">
                Votre devis <strong>{data?.quote.reference}</strong> a été validé avec succès.
              </p>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Prochaines étapes :</h3>
              <ul className="text-left text-blue-800 space-y-1">
                <li>• Nous vous contactons sous 24h pour confirmer les détails</li>
                <li>• Planification de votre séance photo</li>
                <li>• Réalisation de vos photos selon vos souhaits</li>
                <li>• Livraison de vos photos retouchées</li>
              </ul>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-2">Récapitulatif de votre séance :</h3>
              <div className="text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Date souhaitée :</span>
                  <span className="font-medium">{formatDate(new Date(data!.quote.desiredStart))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fin prévue :</span>
                  <span className="font-medium">{formatDate(new Date(data!.quote.desiredEnd))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type de fond :</span>
                  <span className="font-medium">{data!.quote.background}</span>
                </div>
              </div>
            </div>

            <div className="text-center text-gray-600">
              <p className="mb-2">Une question ? Contactez-nous :</p>
              <p>📧 {data?.settings.studioEmail}</p>
              <p>📞 {data?.settings.studioPhone}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data) {
    return null
  }

  const clientName = data.client.companyName || `${data.client.firstName} ${data.client.lastName}`

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="text-4xl mb-4">📸</div>
          <CardTitle className="text-2xl text-gray-900">
            {data.settings.studioName}
          </CardTitle>
          <p className="text-gray-600">Validation de devis</p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Bonjour {clientName} !
            </h2>
            <p className="text-gray-600">
              Vous êtes sur le point de valider le devis <strong>{data.quote.reference}</strong>
            </p>
          </div>

          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-4">📋 Détails de votre demande :</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Référence :</span>
                <span className="font-medium">{data.quote.reference}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date souhaitée :</span>
                <span className="font-medium">{formatDate(new Date(data.quote.desiredStart))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fin prévue :</span>
                <span className="font-medium">{formatDate(new Date(data.quote.desiredEnd))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Type de fond :</span>
                <span className="font-medium">{data.quote.background}</span>
              </div>
              {data.quote.message && (
                <div>
                  <span className="text-gray-600">Besoins spécifiques :</span>
                  <p className="mt-1 p-3 bg-white rounded text-sm">{data.quote.message}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">ℹ️ Important :</h3>
            <ul className="text-blue-800 space-y-1 text-sm">
              <li>• En validant ce devis, vous acceptez nos conditions</li>
              <li>• Nous vous contacterons pour finaliser les détails</li>
              <li>• Votre séance sera programmée selon vos disponibilités</li>
              <li>• Cette validation engage les deux parties</li>
            </ul>
          </div>

          <div className="text-center">
            <Button
              onClick={handleValidateQuote}
              disabled={validating}
              size="lg"
              className="w-full text-lg py-6"
            >
              {validating ? (
                '⏳ Validation en cours...'
              ) : (
                `✅ Je valide le devis ${data.quote.reference}`
              )}
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>{data.settings.studioName}</p>
            <p>{data.settings.studioAddress}</p>
            <p>📧 {data.settings.studioEmail} | 📞 {data.settings.studioPhone}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
