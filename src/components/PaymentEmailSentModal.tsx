'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface PaymentEmailSentModalProps {
  isOpen: boolean
  onClose: () => void
  recipientEmail: string
  quoteReference: string
  invoiceRef: string
}

export function PaymentEmailSentModal({ 
  isOpen, 
  onClose, 
  recipientEmail, 
  quoteReference,
  invoiceRef
}: PaymentEmailSentModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-3xl">✅</span>
            Email de paiement envoyé !
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Message de succès */}
          <div className="text-center py-4">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl animate-bounce">💳</span>
            </div>
            <h3 className="text-xl font-bold text-green-900 mb-2">Parfait !</h3>
            <p className="text-green-700">L'email avec les instructions de paiement a été envoyé</p>
          </div>

          {/* Détails */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-green-700">Devis :</span>
                <span className="font-bold text-green-900">{quoteReference}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-green-700">Référence facture :</span>
                <span className="font-bold text-green-900">{invoiceRef}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-green-700">Envoyé à :</span>
                <span className="font-semibold text-green-900">{recipientEmail}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-green-700">Heure :</span>
                <span className="text-green-800">
                  {new Intl.DateTimeFormat('fr-FR', {
                    timeStyle: 'short',
                    dateStyle: 'short'
                  }).format(new Date())}
                </span>
              </div>
            </div>
          </div>

          {/* Informations sur ce qui se passe maintenant */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2">✨ Ce qui se passe maintenant :</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Le client reçoit les informations de virement</li>
              <li>• Il doit envoyer la preuve de paiement par email</li>
              <li>• Le bouton devient "Paiement reçu" après validation</li>
              <li>• Vous pourrez marquer la facture comme payée</li>
            </ul>
          </div>

          {/* Bouton de fermeture */}
          <div className="pt-4">
            <Button 
              onClick={onClose}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <span className="mr-2">👍</span>
              Parfait, merci !
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
