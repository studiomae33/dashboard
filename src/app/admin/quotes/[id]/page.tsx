'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/badge'
import { formatDate, formatCurrency } from '@/lib/utils'
import { PaymentEmailModal } from '@/components/PaymentEmailModal'
import { PaymentEmailSentModal } from '@/components/PaymentEmailSentModal'
import Link from 'next/link'

interface QuoteDetails {
  id: string
  reference: string
  status: string
  desiredStart: string
  desiredEnd: string
  background: string
  message?: string
  createdAt: string
  sentAt?: string
  signedAt?: string
  signedIp?: string
  invoiceRef?: string
  invoiceAmountTTC?: number
  pdfPath?: string
  client: {
    id: string
    firstName: string
    lastName: string
    companyName?: string
    email: string
    phone?: string
    billingAddress?: string
  }
  booking?: {
    id: string
    title: string
    start: string
    end: string
  }
  eventLogs: Array<{
    id: string
    action: string
    createdAt: string
    payload?: string
  }>
}

export default function QuoteDetailPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [quote, setQuote] = useState<QuoteDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showPaymentSentModal, setShowPaymentSentModal] = useState(false)
  const [sendingPaymentEmail, setSendingPaymentEmail] = useState(false)
  const [paymentEmailData, setPaymentEmailData] = useState<{
    recipientEmail: string
    quoteReference: string
    invoiceRef: string
  } | null>(null)

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
        // S'assurer que eventLogs est toujours un tableau
        if (!data.eventLogs) {
          data.eventLogs = []
        }
        setQuote(data)
      } else if (response.status === 404) {
        router.push('/admin/quotes')
      }
    } catch (error) {
      console.error('Erreur lors du chargement du devis:', error)
    } finally {
      setLoading(false)
    }
  }

  async function updateStatus(newStatus: string, additionalData?: any) {
    if (!quote) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/quotes/${quote.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          ...additionalData,
        }),
      })

      if (response.ok) {
        const updatedQuote = await response.json()
        setQuote(updatedQuote)
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
    } finally {
      setUpdating(false)
    }
  }

  async function sendPaymentEmail(invoiceRef: string, paymentDueDate?: string) {
    if (!quote) return

    setSendingPaymentEmail(true)
    try {
      const response = await fetch('/api/admin/quotes/send-payment-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quoteId: quote.id,
          invoiceRef,
          paymentDueDate,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        
        // Mettre à jour le statut du devis
        setQuote(prev => prev ? { ...prev, status: 'PAYMENT_PENDING' } : null)
        
        // Préparer les données pour la modal de confirmation
        setPaymentEmailData({
          recipientEmail: result.recipientEmail,
          quoteReference: result.quoteReference,
          invoiceRef,
        })
        
        // Fermer la modal de saisie et ouvrir la modal de confirmation
        setShowPaymentModal(false)
        setShowPaymentSentModal(true)
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi:', error)
      alert('Erreur lors de l\'envoi de l\'email de paiement')
    } finally {
      setSendingPaymentEmail(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 bg-gray-200 rounded"></div>
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!session || !quote) {
    return null
  }

  const canSend = quote.status === 'READY'
  const canSign = quote.status === 'SENT'
  const canSendPaymentEmail = quote.status === 'SIGNED'
  const canMarkPaid = quote.status === 'PAYMENT_PENDING'
  const canInvoice = quote.status === 'PAID'

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link href="/admin/quotes" className="text-blue-600 hover:text-blue-800 mr-4">
              ← Retour aux devis
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Devis {quote.reference}
              </h1>
              <p className="text-gray-600">
                {quote.client.companyName || `${quote.client.firstName} ${quote.client.lastName}`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <StatusBadge status={quote.status} />
            {canSend && (
              <Link href={`/admin/quotes/${quote.id}/email`}>
                <Button>📧 Envoyer le devis</Button>
              </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Informations principales */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Détails du devis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Référence</label>
                    <p className="text-sm text-gray-900">{quote.reference}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Statut</label>
                    <div className="mt-1 flex items-center space-x-2">
                      <StatusBadge status={quote.status} />
                      {quote.pdfPath && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                          📄 PDF
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date de début souhaitée</label>
                    <p className="text-sm text-gray-900">{formatDate(new Date(quote.desiredStart))}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Date de fin souhaitée</label>
                    <p className="text-sm text-gray-900">{formatDate(new Date(quote.desiredEnd))}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Type de fond</label>
                    <p className="text-sm text-gray-900">{quote.background}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Créé le</label>
                    <p className="text-sm text-gray-900">{formatDate(new Date(quote.createdAt))}</p>
                  </div>
                  {quote.sentAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Envoyé le</label>
                      <p className="text-sm text-gray-900">{formatDate(new Date(quote.sentAt))}</p>
                    </div>
                  )}
                  {quote.signedAt && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Signé le</label>
                      <p className="text-sm text-gray-900">{formatDate(new Date(quote.signedAt))}</p>
                    </div>
                  )}
                  {quote.invoiceRef && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Référence facture</label>
                      <p className="text-sm text-gray-900">{quote.invoiceRef}</p>
                    </div>
                  )}
                  {quote.invoiceAmountTTC && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Montant TTC</label>
                      <p className="text-sm text-gray-900">{formatCurrency(quote.invoiceAmountTTC)}</p>
                    </div>
                  )}
                </div>

                {quote.message && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Message et besoins</label>
                    <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-md">
                      {quote.message}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informations client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Nom</label>
                    <p className="text-sm text-gray-900">
                      {quote.client.firstName} {quote.client.lastName}
                    </p>
                  </div>
                  {quote.client.companyName && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Entreprise</label>
                      <p className="text-sm text-gray-900">{quote.client.companyName}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm text-gray-900">{quote.client.email}</p>
                  </div>
                  {quote.client.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Téléphone</label>
                      <p className="text-sm text-gray-900">{quote.client.phone}</p>
                    </div>
                  )}
                </div>
                {quote.client.billingAddress && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Adresse de facturation</label>
                    <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-md">
                      {quote.client.billingAddress}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions et historique */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quote.status === 'DRAFT' && (
                  <Button
                    onClick={() => updateStatus('READY')}
                    disabled={updating}
                    className="w-full"
                  >
                    ✅ Marquer comme prêt
                  </Button>
                )}
                
                {quote.status === 'READY' && quote.pdfPath && (
                  <Link href={`/admin/quotes/${quote.id}/email`} className="block">
                    <Button className="w-full">
                      📧 Envoyer le devis par email
                    </Button>
                  </Link>
                )}

                {quote.pdfPath && (
                  <a 
                    href={quote.pdfPath} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button variant="outline" className="w-full">
                      📄 Voir le PDF
                    </Button>
                  </a>
                )}

                {canSign && (
                  <Button
                    onClick={() => updateStatus('SIGNED', { signedAt: new Date().toISOString() })}
                    disabled={updating}
                    variant="outline"
                    className="w-full"
                  >
                    ✍️ Marquer comme signé
                  </Button>
                )}

                {canSendPaymentEmail && (
                  <Button
                    onClick={() => setShowPaymentModal(true)}
                    disabled={updating}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    💳 Envoyer mail paiement
                  </Button>
                )}

                {canMarkPaid && (
                  <Button
                    onClick={() => updateStatus('PAID')}
                    disabled={updating}
                    variant="outline"
                    className="w-full"
                  >
                    💰 Paiement reçu
                  </Button>
                )}

                {canInvoice && (
                  <Button
                    onClick={() => {
                      const invoiceRef = prompt('Référence de la facture:')
                      const amount = prompt('Montant TTC (€):')
                      if (invoiceRef && amount) {
                        updateStatus('INVOICED', {
                          invoiceRef,
                          invoiceAmountTTC: parseFloat(amount)
                        })
                      }
                    }}
                    disabled={updating}
                    variant="outline"
                    className="w-full"
                  >
                    📄 Marquer comme facturé
                  </Button>
                )}

                <Button
                  onClick={() => updateStatus('CANCELED')}
                  disabled={updating}
                  variant="destructive"
                  className="w-full"
                >
                  ❌ Annuler
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Historique</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {quote?.eventLogs?.map((log) => (
                    <div key={log.id} className="text-xs p-2 bg-gray-50 rounded">
                      <div className="font-medium">{log.action}</div>
                      <div className="text-gray-500">
                        {formatDate(new Date(log.createdAt))}
                      </div>
                    </div>
                  )) || []}
                  {(!quote?.eventLogs || quote.eventLogs.length === 0) && (
                    <p className="text-sm text-gray-500">Aucun historique</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {quote.booking && (
              <Card>
                <CardHeader>
                  <CardTitle>Réservation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Titre</label>
                      <p className="text-sm text-gray-900">{quote.booking.title}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Dates</label>
                      <p className="text-sm text-gray-900">
                        {formatDate(new Date(quote.booking.start))} -<br />
                        {formatDate(new Date(quote.booking.end))}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Modales pour l'email de paiement */}
        {quote && (
          <>
            <PaymentEmailModal
              isOpen={showPaymentModal}
              onClose={() => setShowPaymentModal(false)}
              onSend={sendPaymentEmail}
              isLoading={sendingPaymentEmail}
              quoteReference={quote.reference}
            />

            {paymentEmailData && (
              <PaymentEmailSentModal
                isOpen={showPaymentSentModal}
                onClose={() => {
                  setShowPaymentSentModal(false)
                  setPaymentEmailData(null)
                }}
                recipientEmail={paymentEmailData.recipientEmail}
                quoteReference={paymentEmailData.quoteReference}
                invoiceRef={paymentEmailData.invoiceRef}
              />
            )}
          </>
        )}
      </div>
    </AdminLayout>
  )
}
