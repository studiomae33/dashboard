'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, FileText, Calendar, MapPin, Euro } from 'lucide-react'

interface Quote {
  id: string
  reference: string
  desiredStart: string
  desiredEnd: string
  background: string
  message?: string
  status: string
  amountTTC?: number
}

interface Client {
  firstName: string
  lastName: string
  companyName?: string
  email: string
}

interface Settings {
  studioName: string
  studioAddress: string
  studioPhone: string
  studioEmail: string
}

export default function ValidateQuotePage() {
  const params = useParams()
  const token = params.token as string
  
  const [quote, setQuote] = useState<Quote | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [validating, setValidating] = useState(false)
  const [validated, setValidated] = useState(false)

  useEffect(() => {
    fetchQuoteData()
  }, [token])

  const fetchQuoteData = async () => {
    try {
      const response = await fetch(`/api/quote/validate/${token}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors du chargement')
        return
      }

      setQuote(data.quote)
      setClient(data.client)
      setSettings(data.settings)
    } catch (err) {
      setError('Erreur de connexion')
      console.error('Erreur:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleValidateQuote = async () => {
    setValidating(true)
    try {
      const response = await fetch(`/api/quote/validate/${token}`, {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Erreur lors de la validation')
        return
      }

      setValidated(true)
      setQuote(prev => prev ? { ...prev, status: 'VALIDATED' } : null)
    } catch (err) {
      setError('Erreur de connexion')
      console.error('Erreur:', err)
    } finally {
      setValidating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du devis...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <XCircle className="h-6 w-6 text-red-500" />
              <CardTitle className="text-red-700">Erreur</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!quote || !client || !settings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Devis non trouvé</CardTitle>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const clientName = client.companyName || `${client.firstName} ${client.lastName}`
  
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris'
    }).format(new Date(dateString))
  }

  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris'
    }).format(new Date(dateString))
  }

  if (validated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl text-green-700">Devis validé avec succès !</CardTitle>
            <CardDescription>
              Votre devis {quote.reference} a été validé le {new Intl.DateTimeFormat('fr-FR', {
                dateStyle: 'full',
                timeStyle: 'short'
              }).format(new Date())}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Prochaines étapes :</h3>
              <ul className="space-y-2 text-green-700">
                <li>• Vous recevrez un email de confirmation sous peu</li>
                <li>• Les informations de paiement vous seront transmises par email</li>
                <li>• Votre créneau est maintenant réservé dans notre planning</li>
              </ul>
            </div>
            
            <div className="text-center">
              <p className="text-gray-600">
                Merci pour votre confiance !<br />
                L'équipe {settings.studioName}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* En-tête */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Validation du devis
          </h1>
          <p className="text-gray-600">
            {settings.studioName}
          </p>
        </div>

        {/* Informations du devis */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Devis {quote.reference}</span>
                </CardTitle>
                <CardDescription>
                  Client : {clientName}
                </CardDescription>
              </div>
              <Badge variant={quote.status === 'SENT' ? 'secondary' : 'default'}>
                {quote.status === 'SENT' ? 'En attente' : quote.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date et heure */}
            <div className="flex items-start space-x-3">
              <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">Date et heure de la séance</p>
                <p className="text-gray-600">
                  {formatDate(quote.desiredStart)} – {formatTime(quote.desiredEnd)}
                </p>
              </div>
            </div>

            {/* Espace utilisé */}
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">Espace(s) utilisé(s)</p>
                <p className="text-gray-600">{quote.background}</p>
              </div>
            </div>

            {/* Montant */}
            {quote.amountTTC && (
              <div className="flex items-start space-x-3">
                <Euro className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">Montant TTC</p>
                  <p className="text-gray-600">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'EUR'
                    }).format(quote.amountTTC)}
                  </p>
                </div>
              </div>
            )}

            {/* Message */}
            {quote.message && (
              <div>
                <p className="font-medium mb-2">Message</p>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-gray-600 whitespace-pre-wrap">{quote.message}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conditions importantes */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-orange-700">⚠️ Conditions importantes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-800 mb-2">Durée de location</h4>
              <p className="text-orange-700 text-sm">
                Le créneau intègre l'installation et la désinstallation du matériel, en plus du shooting. 
                Toute durée supplémentaire fera l'objet d'une facturation additionnelle.
              </p>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-800 mb-2">Sol du cyclo blanc</h4>
              <p className="text-orange-700 text-sm">
                Le sol est protégé par une moquette que vous pouvez retirer si nécessaire. 
                Il est repeint avant chaque location pour garantir un rendu propre. 
                En cas de traces ou de dégradations constatées après votre passage, 
                une remise en peinture de <strong>40 € HT</strong> sera facturée.
              </p>
            </div>
            
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <h4 className="font-semibold text-orange-800 mb-2">Sol des fonds photo</h4>
              <p className="text-orange-700 text-sm">
                L'utilisation des fonds en arrière-plan est incluse dans la location. 
                Toute utilisation au sol, générant une usure, est considérée comme consommable 
                et fera l'objet d'une facturation de <strong>12,5 € HT par mètre linéaire utilisé (hors mur)</strong>.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Bouton de validation */}
        {quote.status === 'SENT' && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-gray-600">
                  En cliquant sur "Valider le devis", vous acceptez les conditions ci-dessus 
                  et confirmez votre réservation pour le créneau indiqué.
                </p>
                <Button 
                  onClick={handleValidateQuote}
                  disabled={validating}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                >
                  {validating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Validation en cours...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Valider le devis
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>{settings.studioName} – {settings.studioAddress}</p>
          <p>📞 {settings.studioPhone} – 📧 {settings.studioEmail}</p>
        </div>
      </div>
    </div>
  )
}
