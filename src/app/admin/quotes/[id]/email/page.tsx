'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { QuoteSentModal } from '@/components/QuoteSentModal'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

interface QuoteDetails {
  id: string
  reference: string
  status: string
  desiredStart: string
  desiredEnd: string
  background: string
  message?: string
  pdfPath?: string
  amountTTC?: number
  client: {
    firstName: string
    lastName: string
    companyName?: string
    email: string
  }
}

export default function QuoteEmailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [quote, setQuote] = useState<QuoteDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [emailPreview, setEmailPreview] = useState('')
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated' && params?.id) {
      fetchQuote()
    }
  }, [status, router, params?.id])

  async function fetchQuote() {
    if (!params?.id) return

    try {
      const response = await fetch(`/api/admin/quotes/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setQuote(data)
        
        if (data.status !== 'READY') {
          router.push(`/admin/quotes/${params.id}`)
          return
        }

        // Générer l'aperçu de l'email
        await generateEmailPreview(data)
      } else if (response.status === 404) {
        router.push('/admin/quotes')
      }
    } catch (error) {
      console.error('Erreur lors du chargement du devis:', error)
    } finally {
      setLoading(false)
    }
  }

  async function generateEmailPreview(quoteData: QuoteDetails) {
    setPreviewLoading(true)
    try {
      const response = await fetch('/api/admin/quotes/preview-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteId: quoteData.id,
        }),
      })

      if (response.ok) {
        const { html } = await response.json()
        setEmailPreview(html)
      } else {
        console.error('Erreur lors de la génération de l\'aperçu')
      }
    } catch (error) {
      console.error('Erreur lors de la génération de l\'aperçu:', error)
    } finally {
      setPreviewLoading(false)
    }
  }

  async function handleSendEmail() {
    if (!quote) return

    setSending(true)
    try {
      const response = await fetch('/api/admin/quotes/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          quoteId: quote.id,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setShowSuccessModal(true)
      } else {
        const errorData = await response.json()
        alert(`Erreur: ${errorData.error}`)
      }
    } catch (error) {
      alert('Erreur lors de l\'envoi de l\'email')
    } finally {
      setSending(false)
    }
  }

  function formatDateTime(dateString: string) {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris'
    }).format(date)
  }

  function formatTime(dateString: string) {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris'
    }).format(date)
  }

  function handleCloseSuccessModal() {
    setShowSuccessModal(false)
    if (quote) {
      router.push(`/admin/quotes/${quote.id}`)
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

  if (!session || !quote) {
    return null
  }

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link 
              href={`/admin/quotes/${quote.id}`} 
              className="text-blue-600 hover:text-blue-800 mr-4 flex items-center"
            >
              ← Retour au devis
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Aperçu avant envoi - Devis {quote.reference}
              </h1>
              <p className="text-gray-600 flex items-center mt-1">
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs mr-2">
                  📧 {quote.client.email}
                </span>
                <span className="text-sm">
                  {quote.client.companyName || `${quote.client.firstName} ${quote.client.lastName}`}
                </span>
              </p>
            </div>
          </div>
          
          {/* Bouton d'envoi en haut */}
          <div className="flex gap-3">
            <Link href={`/admin/quotes/${quote.id}`}>
              <Button variant="outline">
                Annuler
              </Button>
            </Link>
            <Button 
              onClick={handleSendEmail} 
              disabled={sending || !emailPreview || previewLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {sending ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Envoi...
                </>
              ) : (
                <>
                  ✅ Envoyer l'email
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Aperçu de l'email */}
          <div className="xl:col-span-3">
            <Card className="h-fit">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>📧 Aperçu de l'email</span>
                  {previewLoading && (
                    <span className="text-sm text-gray-500 animate-pulse">
                      Génération en cours...
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {emailPreview ? (
                  <div className="bg-gray-100 p-4 rounded-lg">
                    {/* Iframe pour isoler les styles de l'email */}
                    <iframe
                      srcDoc={emailPreview}
                      className="w-full h-[700px] border-0 rounded-lg bg-white"
                      title="Aperçu de l'email"
                      sandbox="allow-same-origin"
                      style={{
                        maxWidth: '100%',
                        border: '1px solid #e5e7eb'
                      }}
                    />
                  </div>
                ) : previewLoading ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-500">Génération de l'aperçu en cours...</p>
                  </div>
                ) : (
                  <div className="p-8 text-center text-red-500">
                    <p>❌ Erreur lors de la génération de l'aperçu</p>
                    <Button 
                      onClick={() => generateEmailPreview(quote)} 
                      variant="outline" 
                      className="mt-4"
                    >
                      🔄 Réessayer
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={handleSendEmail} 
                disabled={sending || !emailPreview || previewLoading}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 text-lg"
                size="lg"
              >
                {sending ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    ✅ Confirmer et envoyer l'email
                  </>
                )}
              </Button>
              <Link href={`/admin/quotes/${quote.id}`}>
                <Button variant="outline" size="lg" className="px-6 py-3">
                  ❌ Annuler
                </Button>
              </Link>
            </div>
          </div>

          {/* Sidebar avec les informations */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>📋 Résumé du devis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Référence</span>
                  <span className="font-mono text-sm font-medium bg-gray-100 px-2 py-1 rounded">
                    {quote.reference}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Client</span>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {quote.client.companyName || `${quote.client.firstName} ${quote.client.lastName}`}
                    </p>
                    <p className="text-xs text-gray-500">{quote.client.email}</p>
                  </div>
                </div>
                
                <div className="flex items-start justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Séance</span>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatDateTime(quote.desiredStart)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Fin prévue à {formatTime(quote.desiredEnd)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">Configuration</span>
                  <span className="text-sm font-medium">{quote.background}</span>
                </div>

                {quote.amountTTC && (
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-600">Tarif</span>
                    <span className="text-lg font-semibold text-green-600">
                      {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(quote.amountTTC)}
                    </span>
                  </div>
                )}

                {quote.message && (
                  <div className="pt-3 mt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-2">Besoins spécifiques (privé - non envoyé au client) :</p>
                    <p className="text-sm text-gray-700 bg-blue-50 p-3 rounded-lg border-l-3 border-blue-300">
                      {quote.message}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {quote.pdfPath && (
              <Card>
                <CardHeader>
                  <CardTitle>📄 Document PDF</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Le PDF sera automatiquement joint à l'email
                    </p>
                    <a 
                      href={quote.pdfPath} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button variant="outline" className="w-full">
                        👁️ Prévisualiser le PDF
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Modal de succès */}
        {quote && (
          <QuoteSentModal
            isOpen={showSuccessModal}
            onClose={handleCloseSuccessModal}
            recipientEmail={quote.client.email}
            quoteReference={quote.reference}
          />
        )}
      </div>
    </AdminLayout>
  )
}


