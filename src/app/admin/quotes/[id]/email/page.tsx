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
      }
    } catch (error) {
      console.error('Erreur lors de la génération de l\'aperçu:', error)
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
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href={`/admin/quotes/${quote.id}`} className="text-blue-600 hover:text-blue-800 mr-4">
              ← Retour au devis
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Aperçu avant envoi - Devis {quote.reference}
              </h1>
              <p className="text-gray-600">
                À : {quote.client.email}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Aperçu de l'email */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>📧 Aperçu de l'email qui sera envoyé</CardTitle>
              </CardHeader>
              <CardContent>
                {emailPreview ? (
                  <div className="border rounded-lg p-4 bg-gray-50 max-h-[600px] overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: emailPreview }} />
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    Génération de l'aperçu en cours...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="mt-6 flex space-x-4">
              <Button 
                onClick={handleSendEmail} 
                disabled={sending || !emailPreview}
                className="bg-green-600 hover:bg-green-700"
              >
                {sending ? '📤 Envoi en cours...' : '✅ Confirmer et envoyer l\'email'}
              </Button>
              <Link href={`/admin/quotes/${quote.id}`}>
                <Button variant="outline">
                  ❌ Annuler
                </Button>
              </Link>
            </div>
          </div>

          {/* Informations du devis et PDF */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations du devis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Référence</label>
                  <p className="text-sm text-gray-900">{quote.reference}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Client</label>
                  <p className="text-sm text-gray-900">
                    {quote.client.companyName || `${quote.client.firstName} ${quote.client.lastName}`}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-sm text-gray-900">{quote.client.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Période demandée</label>
                  <p className="text-sm text-gray-900">
                    {formatDateTime(quote.desiredStart)} 
                    <br />
                    jusqu'à {formatTime(quote.desiredEnd)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Espace(s)</label>
                  <p className="text-sm text-gray-900">{quote.background}</p>
                </div>
                {quote.message && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Besoins spécifiques</label>
                    <p className="text-sm text-gray-900 mt-1 p-2 bg-gray-50 rounded text-xs">
                      {quote.message}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {quote.pdfPath && (
              <Card>
                <CardHeader>
                  <CardTitle>📄 PDF du devis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Le PDF sera joint à l'email
                    </p>
                    <a 
                      href={quote.pdfPath} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button variant="outline" className="w-full">
                        👁️ Voir le PDF
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>⚠️ Ce qui va se passer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 space-y-2">
                  <p>✉️ Email formaté avec le template Studio MAE</p>
                  <p>📎 PDF du devis joint</p>
                  <p>🔗 Lien de validation automatique inclus</p>
                  <p>📤 Statut du devis → "Envoyé"</p>
                  <p>📧 Email envoyé à : {quote.client.email}</p>
                </div>
              </CardContent>
            </Card>
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


