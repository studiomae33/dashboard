'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PaymentEmailModalProps {
  isOpen: boolean
  onClose: () => void
  onSend: (invoiceRef: string, paymentDueDate?: string) => void
  isLoading: boolean
  quoteReference: string
  rentalStartDate?: string
}

export function PaymentEmailModal({ 
  isOpen, 
  onClose, 
  onSend, 
  isLoading, 
  quoteReference,
  rentalStartDate 
}: PaymentEmailModalProps) {
  const [invoiceRef, setInvoiceRef] = useState('')
  const [paymentDueDate, setPaymentDueDate] = useState('')
  const [error, setError] = useState('')

  // Fonction pour calculer la date limite de paiement (4 jours avant la date de location)
  const calculatePaymentDueDate = (rentalDate: string) => {
    const rental = new Date(rentalDate)
    const dueDate = new Date(rental)
    dueDate.setDate(rental.getDate() - 4)
    
    const months = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ]
    
    return `${dueDate.getDate()} ${months[dueDate.getMonth()]} ${dueDate.getFullYear()}`
  }

  // Pré-remplir la date limite de paiement quand la modal s'ouvre
  useEffect(() => {
    if (isOpen && rentalStartDate) {
      const defaultDueDate = calculatePaymentDueDate(rentalStartDate)
      setPaymentDueDate(defaultDueDate)
    }
  }, [isOpen, rentalStartDate])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!invoiceRef.trim()) {
      setError('Veuillez saisir la référence facture')
      return
    }

    onSend(invoiceRef.trim(), paymentDueDate.trim() || undefined)
  }

  const handleClose = () => {
    if (!isLoading) {
      setInvoiceRef('')
      setPaymentDueDate('')
      setError('')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">💳</span>
            Envoyer mail de paiement
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
            <p className="font-medium">Devis : {quoteReference}</p>
            <p className="mt-1">Un email avec les instructions de paiement sera envoyé au client.</p>
          </div>

          <div>
            <label htmlFor="invoiceRef" className="block text-sm font-medium text-gray-700 mb-1">
              Référence facture *
            </label>
            <Input
              id="invoiceRef"
              type="text"
              value={invoiceRef}
              onChange={(e) => setInvoiceRef(e.target.value)}
              placeholder="Ex: FA20251000"
              disabled={isLoading}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Cette référence apparaîtra dans l'email et comme objet du virement
            </p>
          </div>

          <div>
            <label htmlFor="paymentDueDate" className="block text-sm font-medium text-gray-700 mb-1">
              Date limite de paiement (optionnel)
            </label>
            <Input
              id="paymentDueDate"
              type="text"
              value={paymentDueDate}
              onChange={(e) => setPaymentDueDate(e.target.value)}
              placeholder="Ex: 15 juillet 2025"
              disabled={isLoading}
              className="w-full"
            />
            <p className="text-xs text-gray-500 mt-1">
              Si renseigné, cette date apparaîtra dans l'avertissement de paiement
            </p>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !invoiceRef.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Envoi...
                </>
              ) : (
                <>
                  📧 Envoyer
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
