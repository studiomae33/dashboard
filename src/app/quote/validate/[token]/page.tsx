'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock, FileText, Calendar, MapPin, Euro, Camera, Lightbulb, Users, HelpCircle, ChevronDown, ChevronUp, Info, Star, Shield, Timer } from 'lucide-react'

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

interface FAQItem {
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    question: "Puis-je apporter mon propre matériel de prise de vue ?",
    answer: "Oui, vous pouvez apporter votre propre matériel. Notre studio est équipé de prises électriques et d'un bon éclairage naturel pour compléter votre équipement."
  },
  {
    question: "Que comprend la location du studio ?",
    answer: "La location comprend l'accès au studio, l'éclairage de base, les fonds disponibles, et tous les équipements fixes. L'installation et la désinstallation de votre matériel sont incluses dans le créneau."
  },
  {
    question: "Combien de personnes peuvent être présentes pendant la séance ?",
    answer: "Le studio peut accueillir confortablement une équipe de 4-6 personnes. Pour des équipes plus importantes, contactez-nous pour valider la faisabilité."
  },
  {
    question: "Puis-je prolonger ma séance sur place ?",
    answer: "Les prolongations sont possibles sous réserve de disponibilité. Le tarif horaire supplémentaire sera facturé selon nos conditions tarifaires."
  },
  {
    question: "Que se passe-t-il en cas d'annulation ?",
    answer: "Les conditions d'annulation dépendent du délai. Contactez-nous dès que possible si vous devez annuler ou reporter votre créneau."
  },
  {
    question: "Y a-t-il un parking disponible ?",
    answer: "Oui, nous disposons de places de parking à proximité du studio. Les détails vous seront communiqués avec votre confirmation."
  }
]

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
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [pdfError, setPdfError] = useState(false)
  const [cglAccepted, setCglAccepted] = useState(false)

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
    // Si on n'a pas encore montré les conditions, les afficher d'abord
    if (!showConfirmation) {
      setShowConfirmation(true)
      return
    }

    // Procéder à la validation
    setValidating(true)
    setError(null) // Reset error state
    try {
      const response = await fetch(`/api/quote/validate/${token}`, {
        method: 'POST'
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('Erreur de validation:', data)
        setError(data.error || `Erreur lors de la validation (${response.status})`)
        return
      }

      setValidated(true)
      setQuote(prev => prev ? { ...prev, status: 'SIGNED' } : null)
    } catch (err) {
      console.error('Erreur de connexion:', err)
      setError('Erreur de connexion au serveur')
    } finally {
      setValidating(false)
    }
  }

  const handleCancelValidation = () => {
    setShowConfirmation(false)
    // Optionnellement, on peut aussi réinitialiser les CGL si on veut forcer une nouvelle validation
    // setCglAccepted(false)
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

  const calculateDuration = () => {
    if (!quote) return ''
    const start = new Date(quote.desiredStart)
    const end = new Date(quote.desiredEnd)
    const diffInMs = end.getTime() - start.getTime()
    const diffInHours = diffInMs / (1000 * 60 * 60)
    
    if (diffInHours === 1) return '1 heure'
    if (diffInHours < 1) {
      const minutes = Math.round(diffInMs / (1000 * 60))
      return `${minutes} minutes`
    }
    return `${diffInHours} heures`
  }

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index)
  }

  if (validated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-3 sm:p-4">
        <div className="w-full max-w-lg">
          <Card className="shadow-sm border">
            <CardContent className="p-6 sm:p-8 text-center space-y-4 sm:space-y-6">
              {/* Icône de succès */}
              <div className="flex justify-center">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                </div>
              </div>

              {/* Titre */}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  Devis validé avec succès !
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Votre réservation est confirmée
                </p>
              </div>

              {/* Référence et date */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <p className="font-medium text-gray-900 mb-1 text-sm sm:text-base">
                  Devis {quote.reference}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  Validé le {new Intl.DateTimeFormat('fr-FR', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }).format(new Date())}
                </p>
              </div>

              {/* Prochaines étapes */}
              <div className="text-left">
                <h3 className="font-semibold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Prochaines étapes</h3>
                
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-900 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold mt-0.5 flex-shrink-0">
                      1
                    </div>
                    <p className="text-gray-700 text-xs sm:text-sm">
                      Nous avons bien reçu votre devis signé, celui-ci est désormais validé
                    </p>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-900 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold mt-0.5 flex-shrink-0">
                      2
                    </div>
                    <p className="text-gray-700 text-xs sm:text-sm">
                      La prochaine étape est le paiement, le mail avec les infos sera envoyé dès que nécessaire
                    </p>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gray-900 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-bold mt-0.5 flex-shrink-0">
                      3
                    </div>
                    <p className="text-gray-700 text-xs sm:text-sm">
                      En attendant, retrouvez le studio sur Instagram : 
                      <a href="https://instagram.com/std.mae" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 font-medium ml-1">
                        @std.mae
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Message de remerciement */}
              <div className="pt-3 sm:pt-4 border-t border-gray-200">
                <p className="text-gray-700 mb-1 text-sm sm:text-base">
                  Merci pour votre confiance !
                </p>
                <p className="font-semibold text-gray-900 text-sm sm:text-base">
                  L'équipe {settings.studioName}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* En-tête simple */}
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            Validation de devis
          </h1>
          <p className="text-sm sm:text-base text-gray-600">{settings.studioName}</p>
        </div>

        {/* Layout responsive - Stack sur mobile, 2 colonnes sur desktop */}
        <div className="flex flex-col lg:grid lg:grid-cols-2 gap-4 lg:gap-6 lg:h-[calc(100vh-200px)]">
          {/* Colonne gauche - Informations du devis */}
          <div className="space-y-3 sm:space-y-4 lg:overflow-y-auto">
            {/* Card principale avec tout l'essentiel */}
            <Card className="shadow-sm">
              <CardHeader className="pb-3 sm:pb-4">
                <div className="text-center">
                  <CardTitle className="text-lg sm:text-xl mb-2">Devis {quote.reference}</CardTitle>
                  <Badge variant={quote.status === 'SENT' ? 'secondary' : 'default'}>
                    {quote.status === 'SENT' ? 'En attente de validation' : quote.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 px-4 sm:px-6">
                {/* Infos essentielles en liste simple */}
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0">
                    <span className="text-gray-600 text-sm sm:text-base">Client :</span>
                    <span className="font-medium text-sm sm:text-base sm:text-right">{clientName}</span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0">
                    <span className="text-gray-600 text-sm sm:text-base">Date :</span>
                    <span className="font-medium text-sm sm:text-base sm:text-right">
                      {new Intl.DateTimeFormat('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      }).format(new Date(quote.desiredStart))}
                    </span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0">
                    <span className="text-gray-600 text-sm sm:text-base">Horaires :</span>
                    <span className="font-medium text-sm sm:text-base sm:text-right">
                      {formatTime(quote.desiredStart)} - {formatTime(quote.desiredEnd)}
                      <br />
                      <span className="text-xs sm:text-sm text-gray-500">({calculateDuration()})</span>
                    </span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0">
                    <span className="text-gray-600 text-sm sm:text-base">Espace :</span>
                    <span className="font-medium text-sm sm:text-base sm:text-right">{quote.background}</span>
                  </div>
                  
                  {quote.amountTTC && (
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-0 pt-2 border-t">
                      <span className="text-gray-600 text-sm sm:text-base">Montant TTC :</span>
                      <span className="font-bold text-lg sm:text-xl text-green-600">
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'EUR'
                        }).format(quote.amountTTC)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Bouton de validation */}
                {quote.status === 'SENT' && (
                  <div className="pt-3 border-t space-y-3">
                    {/* Validation des CGL */}
                    {!cglAccepted ? (
                      <div className="space-y-3">
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 sm:p-4">
                          <h4 className="font-semibold text-blue-800 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                            <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                            Conditions Générales de Location
                          </h4>
                          <p className="text-xs sm:text-sm text-blue-700 mb-3">
                            Avant de valider votre devis, vous devez prendre connaissance et accepter nos Conditions Générales de Location.
                          </p>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <a
                              href="/CGL/CGL STUDIO MAE .pdf"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex-1 sm:flex-initial"
                            >
                              <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                              Consulter les CGL
                            </a>
                            <Button
                              onClick={() => setCglAccepted(true)}
                              variant="outline"
                              className="flex-1 sm:flex-initial text-xs sm:text-sm border-blue-300 text-blue-700 hover:bg-blue-50"
                            >
                              ✓ J'ai lu et j'accepte les CGL
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 text-center">
                          Veuillez d'abord consulter et accepter les CGL pour continuer
                        </p>
                      </div>
                    ) : !showConfirmation ? (
                      // Premier bouton - Afficher les conditions après CGL
                      <>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-3">
                          <p className="text-xs text-green-700 flex items-center">
                            <CheckCircle className="h-3 w-3 mr-2" />
                            CGL acceptées ✓
                          </p>
                        </div>
                        <Button 
                          onClick={handleValidateQuote}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-sm sm:text-base"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Valider ce devis
                        </Button>
                        <p className="text-xs text-gray-500 text-center mt-2">
                          Cliquez pour voir les conditions et confirmer
                        </p>
                      </>
                    ) : (
                      // Affichage des conditions et bouton de confirmation final
                      <div className="space-y-3 sm:space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                          <p className="text-xs text-green-700 flex items-center">
                            <CheckCircle className="h-3 w-3 mr-2" />
                            CGL acceptées ✓
                          </p>
                        </div>
                        <div className="bg-orange-50 border-2 border-orange-200 rounded-lg p-3 sm:p-4">
                          <h4 className="font-semibold text-orange-800 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                            <Shield className="h-4 w-4 mr-2 flex-shrink-0" />
                            ⚠️ Conditions importantes à accepter
                          </h4>
                          <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                            <div className="flex items-start space-x-2">
                              <span className="text-orange-600 font-bold flex-shrink-0">•</span>
                              <div>
                                <strong>Durée de location :</strong> Le créneau intègre l'installation et la désinstallation du matériel. Toute durée supplémentaire sera facturée.
                              </div>
                            </div>
                            <div className="flex items-start space-x-2">
                              <span className="text-orange-600 font-bold flex-shrink-0">•</span>
                              <div>
                                <strong>Sol du cyclo blanc :</strong> Sol protégé par une moquette amovible, repeint avant chaque location. En cas de dégradation = <strong>40€ HT</strong> de remise en peinture.
                              </div>
                            </div>
                            <div className="flex items-start space-x-2">
                              <span className="text-orange-600 font-bold flex-shrink-0">•</span>
                              <div>
                                <strong>Utilisation des fonds :</strong> Fonds inclus en arrière-plan. Utilisation au sol = <strong>12,5€ HT par mètre linéaire</strong>.
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                          <Button 
                            onClick={handleCancelValidation}
                            variant="outline"
                            className="flex-1 text-sm sm:text-base"
                          >
                            Annuler
                          </Button>
                          <Button 
                            onClick={handleValidateQuote}
                            disabled={validating}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base"
                          >
                            {validating ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Validation...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                J'accepte et je valide
                              </>
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-gray-600 text-center">
                          En cliquant sur "J'accepte et je valide", vous confirmez avoir lu et accepté les conditions ci-dessus.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Conditions simplifiées et repliables */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === -1 ? null : -1)}
                  className="w-full flex items-center justify-between"
                >
                  <CardTitle className="text-sm text-orange-800 flex items-center">
                    <Shield className="h-4 w-4 mr-2 flex-shrink-0" />
                    Conditions importantes
                  </CardTitle>
                  {expandedFAQ === -1 ? (
                    <ChevronUp className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  )}
                </button>
              </CardHeader>
              {expandedFAQ === -1 && (
                <CardContent className="pt-0 px-4 sm:px-6">
                  <div className="space-y-2 text-xs sm:text-sm">
                    <div>
                      <strong>Durée :</strong> Installation et désinstallation comprises. Dépassement facturé.
                    </div>
                    <div>
                      <strong>Cyclo blanc :</strong> Sol protégé, repeint avant chaque séance. Dégradation = 40€ HT.
                    </div>
                    <div>
                      <strong>Fonds :</strong> Utilisation murale incluse. Usage au sol = 12,5€ HT/m linéaire.
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* FAQ simplifiée et repliable */}
            <Card className="shadow-sm">
              <CardHeader className="pb-2">
                <button
                  onClick={() => setExpandedFAQ(expandedFAQ === -2 ? null : -2)}
                  className="w-full flex items-center justify-between"
                >
                  <CardTitle className="text-sm flex items-center">
                    <HelpCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                    Questions fréquentes
                  </CardTitle>
                  {expandedFAQ === -2 ? (
                    <ChevronUp className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
                  )}
                </button>
              </CardHeader>
              {expandedFAQ === -2 && (
                <CardContent className="pt-0 px-4 sm:px-6">
                  <div className="space-y-3">
                    {faqData.slice(0, 3).map((faq, index) => (
                      <div key={index}>
                        <p className="font-medium text-xs sm:text-sm mb-1">{faq.question}</p>
                        <p className="text-xs text-gray-600">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Contact simple */}
            <div className="text-center text-xs text-gray-500 py-2">
              <p>{settings.studioName} • {settings.studioPhone}</p>
              <p>{settings.studioEmail}</p>
            </div>
          </div>

          {/* Colonne droite - Aperçu PDF du devis - Cachée sur mobile, visible sur desktop */}
          <div className="hidden lg:flex lg:flex-col bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-3 border-b bg-gray-50 flex-shrink-0">
              <h3 className="font-medium text-gray-900 text-sm flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Aperçu du devis PDF
              </h3>
            </div>
            <div className="flex-1 min-h-0 p-1">
              {!pdfError ? (
                <iframe
                  src={`/api/quote/validate/${token}/pdf`}
                  className="w-full h-full rounded border-0"
                  style={{ minHeight: '500px', height: '100%' }}
                  title="Aperçu du devis PDF"
                  onLoad={(e) => {
                    const iframe = e.target as HTMLIFrameElement
                    try {
                      // Vérifier si l'iframe a chargé correctement
                      if (iframe.contentDocument?.title === 'Error') {
                        setPdfError(true)
                      }
                    } catch (error) {
                      // Erreur CORS normale avec les PDFs
                    }
                  }}
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-50 rounded" style={{ minHeight: '500px' }}>
                  <div className="text-center p-6">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">PDF non disponible</p>
                    <p className="text-sm text-gray-500">
                      Le document PDF sera généré après validation
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bouton pour voir le PDF sur mobile */}
          <div className="lg:hidden">
            <Card className="shadow-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-3">Consulter le devis PDF complet</p>
                  {!pdfError ? (
                    <a
                      href={`/api/quote/validate/${token}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Ouvrir le PDF
                    </a>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Le document PDF sera généré après validation
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
