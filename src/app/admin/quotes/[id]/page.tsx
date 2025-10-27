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
import { ModifyDateModal } from '@/components/ModifyDateModal'
import { InvoiceUploadModal } from '@/components/InvoiceUploadModal'
import { InvoiceSentModal } from '@/components/InvoiceSentModal'
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
  const [showModifyDateModal, setShowModifyDateModal] = useState(false)
  const [modifyingDates, setModifyingDates] = useState(false)
  const [showInvoiceUploadModal, setShowInvoiceUploadModal] = useState(false)
  const [showInvoiceSentModal, setShowInvoiceSentModal] = useState(false)
  const [sendingInvoice, setSendingInvoice] = useState(false)
  const [paymentEmailData, setPaymentEmailData] = useState<{
    recipientEmail: string
    quoteReference: string
    invoiceRef: string
  } | null>(null)
  const [invoiceSentData, setInvoiceSentData] = useState<{
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

  async function sendPaymentEmail(invoiceRef: string, paymentDueDate?: string, paymentLink?: string) {
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
          paymentLink,
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

  async function deleteQuote() {
    if (!quote) return

    const confirmDelete = confirm(
      `Êtes-vous sûr de vouloir supprimer définitivement le devis ${quote.reference} ?\n\nCette action supprimera également l'événement associé dans le calendrier et ne peut pas être annulée.`
    )

    if (!confirmDelete) return

    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/quotes/${quote.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        // Rediriger vers la liste des devis après suppression
        router.push('/admin/quotes')
      } else {
        const error = await response.json()
        alert(`Erreur lors de la suppression: ${error.error}`)
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      alert('Erreur lors de la suppression du devis')
    } finally {
      setUpdating(false)
    }
  }

  async function modifyDates(startDate: string, endDate: string, notifyClient: boolean = true) {
    if (!quote) return

    setModifyingDates(true)
    try {
      const oldStartDate = quote.desiredStart
      const oldEndDate = quote.desiredEnd

      const response = await fetch(`/api/admin/quotes/${quote.id}/modify-dates`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate,
          endDate,
        }),
      })

      if (response.ok) {
        const updatedQuote = await response.json()
        setQuote(updatedQuote)
        
        // Envoyer l'email de notification si demandé
        if (notifyClient) {
          try {
            const emailResponse = await fetch(`/api/admin/quotes/${quote.id}/notify-date-change`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                oldStartDate,
                oldEndDate,
                newStartDate: startDate,
                newEndDate: endDate,
              }),
            })

            if (emailResponse.ok) {
              alert('Dates modifiées avec succès ! Le client a été notifié par email.')
            } else {
              alert('Dates modifiées avec succès, mais erreur lors de l\'envoi de l\'email de notification.')
            }
          } catch (emailError) {
            console.error('Erreur email notification:', emailError)
            alert('Dates modifiées avec succès, mais erreur lors de l\'envoi de l\'email de notification.')
          }
        } else {
          alert('Dates modifiées avec succès !')
        }
      } else {
        const error = await response.json()
        if (error.conflicts) {
          alert(`Conflit de réservation détecté avec :\n${error.conflicts.map((c: any) => 
            `- ${c.reference} (${formatDate(new Date(c.start))} - ${formatDate(new Date(c.end))})`
          ).join('\n')}`)
        } else {
          alert(`Erreur: ${error.error}`)
        }
      }
    } catch (error) {
      console.error('Erreur lors de la modification:', error)
      alert('Erreur lors de la modification des dates')
    } finally {
      setModifyingDates(false)
    }
  }

  async function sendInvoice(file: File, invoiceRef: string) {
    if (!quote) return

    setSendingInvoice(true)
    try {
      const formData = new FormData()
      formData.append('quoteId', quote.id)
      formData.append('invoiceRef', invoiceRef)
      formData.append('invoiceFile', file)

      const response = await fetch('/api/admin/quotes/send-invoice', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        
        // Mettre à jour le devis avec le statut INVOICED
        setQuote(prev => prev ? { ...prev, status: 'INVOICED', invoiceRef } : null)
        
        // Préparer les données pour la modal de confirmation
        setInvoiceSentData({
          recipientEmail: result.recipientEmail,
          quoteReference: result.quoteReference,
          invoiceRef,
        })
        
        // Fermer la modal d'upload et ouvrir la modal de confirmation
        setShowInvoiceUploadModal(false)
        setShowInvoiceSentModal(true)
      } else {
        const error = await response.json()
        alert(`Erreur: ${error.error}`)
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la facture:', error)
      alert('Erreur lors de l\'envoi de la facture')
    } finally {
      setSendingInvoice(false)
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
              <CardContent className="space-y-4">
                {/* Actions principales */}
                <div className="space-y-2">
                  {quote.status === 'DRAFT' && (
                    <Button
                      onClick={() => updateStatus('READY')}
                      disabled={updating}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <span className="mr-2">✅</span>
                      Marquer comme prêt
                    </Button>
                  )}
                  
                  {quote.status === 'READY' && quote.pdfPath && (
                    <Link href={`/admin/quotes/${quote.id}/email`} className="block">
                      <Button variant="outline" className="w-full justify-start">
                        <span className="mr-2">📧</span>
                        Envoyer le devis par email
                      </Button>
                    </Link>
                  )}

                  {canSign && (
                    <Button
                      onClick={() => updateStatus('SIGNED', { signedAt: new Date().toISOString() })}
                      disabled={updating}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <span className="mr-2">✍️</span>
                      Marquer comme signé
                    </Button>
                  )}

                  {canSendPaymentEmail && (
                    <Button
                      onClick={() => setShowPaymentModal(true)}
                      disabled={updating}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <span className="mr-2">💳</span>
                      Demander le paiement
                    </Button>
                  )}

                  {canMarkPaid && (
                    <Button
                      onClick={() => updateStatus('PAID')}
                      disabled={updating}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <span className="mr-2">💰</span>
                      Paiement reçu
                    </Button>
                  )}

                  {canInvoice && (
                    <Button
                      onClick={() => setShowInvoiceUploadModal(true)}
                      disabled={updating || sendingInvoice}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <span className="mr-2">📄</span>
                      Envoyer la facture
                    </Button>
                  )}

                  {/* Action pour modifier les dates - disponible pour les devis signés */}
                  {['SIGNED', 'PAYMENT_PENDING', 'PAID'].includes(quote.status) && (
                    <Button
                      onClick={() => setShowModifyDateModal(true)}
                      disabled={updating || modifyingDates}
                      variant="outline"
                      className="w-full justify-start"
                    >
                      <span className="mr-2">📅</span>
                      Modifier les dates
                    </Button>
                  )}
                </div>

                {/* Actions secondaires */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  {quote.pdfPath && (
                    <a 
                      href={quote.pdfPath} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <Button variant="ghost" className="w-full justify-start text-gray-600">
                        <span className="mr-2">📄</span>
                        Voir le PDF
                      </Button>
                    </a>
                  )}
                </div>

                {/* Zone dangereuse */}
                <div className="pt-4 border-t border-red-100 bg-red-50 -mx-6 -mb-6 px-6 pb-6 rounded-b-lg">
                  <p className="text-sm font-medium text-red-800 mb-3">Zone dangereuse</p>
                  <Button
                    onClick={deleteQuote}
                    disabled={updating}
                    variant="ghost"
                    className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-100"
                  >
                    <span className="mr-2">🗑️</span>
                    Supprimer définitivement
                  </Button>
                  <p className="text-xs text-red-600 mt-2">
                    Cette action supprimera le devis et l'événement du calendrier
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Historique</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {quote?.eventLogs?.map((log) => {
                    let actionDisplay = log.action
                    let actionIcon = '📋'
                    let actionColor = 'text-gray-900'
                    
                    // Personnaliser l'affichage selon le type d'action
                    switch (log.action) {
                      case 'STATUS_CHANGED':
                        actionIcon = '🔄'
                        actionDisplay = 'Statut modifié'
                        actionColor = 'text-blue-700'
                        break
                      case 'DATES_MODIFIED':
                        actionIcon = '📅'
                        actionDisplay = 'Dates modifiées'
                        actionColor = 'text-orange-700'
                        break
                      case 'DATE_CHANGE_EMAIL_SENT':
                        actionIcon = '📧'
                        actionDisplay = 'Client notifié du changement de dates'
                        actionColor = 'text-green-700'
                        break
                      case 'PAYMENT_EMAIL_SENT':
                        actionIcon = '💳'
                        actionDisplay = 'Email de paiement envoyé'
                        actionColor = 'text-purple-700'
                        break
                      case 'DELETED':
                        actionIcon = '🗑️'
                        actionDisplay = 'Supprimé'
                        actionColor = 'text-red-700'
                        break
                      default:
                        break
                    }
                    
                    return (
                      <div key={log.id} className="text-xs p-2 bg-gray-50 rounded">
                        <div className={`font-medium ${actionColor} flex items-center`}>
                          <span className="mr-2">{actionIcon}</span>
                          {actionDisplay}
                        </div>
                        <div className="text-gray-500 mt-1">
                          {formatDate(new Date(log.createdAt))}
                        </div>
                        {log.payload && (
                          <div className="text-gray-600 text-xs mt-1 p-1 bg-gray-100 rounded">
                            {(() => {
                              try {
                                const payload = JSON.parse(log.payload)
                                if (log.action === 'DATES_MODIFIED') {
                                  return `${formatDate(new Date(payload.oldStart))} → ${formatDate(new Date(payload.newStart))}`
                                }
                                if (log.action === 'STATUS_CHANGED') {
                                  return `${payload.from} → ${payload.to}`
                                }
                                return JSON.stringify(payload, null, 2)
                              } catch {
                                return log.payload
                              }
                            })()}
                          </div>
                        )}
                      </div>
                    )
                  }) || []}
                  {(!quote?.eventLogs || quote.eventLogs.length === 0) && (
                    <p className="text-sm text-gray-500">Aucun historique</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {quote.booking && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Réservation</span>
                    {['SIGNED', 'PAYMENT_PENDING', 'PAID'].includes(quote.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowModifyDateModal(true)}
                        disabled={updating || modifyingDates}
                        className="text-xs"
                      >
                        📅 Modifier
                      </Button>
                    )}
                  </CardTitle>
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
                    {quote.eventLogs?.some(log => log.action === 'DATES_MODIFIED') && (
                      <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-md">
                        <p className="text-xs text-orange-800 flex items-center">
                          <span className="mr-1">⚠️</span>
                          Les dates de cette réservation ont été modifiées
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Modales pour l'email de paiement */}
        {quote && (
          <>
            {/* Modal pour upload et envoi de facture */}
            <InvoiceUploadModal
              isOpen={showInvoiceUploadModal}
              onClose={() => setShowInvoiceUploadModal(false)}
              onSubmit={sendInvoice}
              loading={sendingInvoice}
            />

            {/* Modal de confirmation d'envoi de facture */}
            {invoiceSentData && (
              <InvoiceSentModal
                isOpen={showInvoiceSentModal}
                onClose={() => {
                  setShowInvoiceSentModal(false)
                  setInvoiceSentData(null)
                }}
                recipientEmail={invoiceSentData.recipientEmail}
                quoteReference={invoiceSentData.quoteReference}
                invoiceRef={invoiceSentData.invoiceRef}
              />
            )}

            <PaymentEmailModal
              isOpen={showPaymentModal}
              onClose={() => setShowPaymentModal(false)}
              onSend={sendPaymentEmail}
              isLoading={sendingPaymentEmail}
              quoteReference={quote.reference}
              rentalStartDate={quote.desiredStart}
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

            <ModifyDateModal
              isOpen={showModifyDateModal}
              onClose={() => setShowModifyDateModal(false)}
              onSave={modifyDates}
              currentStartDate={quote.desiredStart}
              currentEndDate={quote.desiredEnd}
              quoteReference={quote.reference}
              clientEmail={quote.client.email}
              isLoading={modifyingDates}
            />
          </>
        )}
      </div>
    </AdminLayout>
  )
}
