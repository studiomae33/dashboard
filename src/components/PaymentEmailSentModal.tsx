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
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            Email de paiement envoyé
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Message de succès */}
          <div className="text-center py-2">
            <p className="text-gray-600 text-sm">
              L'email avec les instructions de paiement a été envoyé avec succès.
            </p>
          </div>

          {/* Détails */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-3 text-sm">Détails de l'envoi</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Devis :</span>
                <span className="text-sm font-medium text-gray-900">{quoteReference}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Référence facture :</span>
                <span className="text-sm font-medium text-gray-900">{invoiceRef}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Destinataire :</span>
                <span className="text-sm font-medium text-gray-900">{recipientEmail}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Envoyé le :</span>
                <span className="text-sm text-gray-700">
                  {new Intl.DateTimeFormat('fr-FR', {
                    timeStyle: 'short',
                    dateStyle: 'short'
                  }).format(new Date())}
                </span>
              </div>
            </div>
          </div>

          {/* Informations sur ce qui se passe maintenant */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h4 className="font-medium text-gray-900 mb-2 text-sm">Prochaines étapes</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Le client va recevoir les informations de virement</li>
              <li>• Il devra envoyer une preuve de paiement par email</li>
              <li>• Vous pourrez ensuite marquer le paiement comme reçu</li>
            </ul>
          </div>

          {/* Bouton de fermeture */}
          <div className="pt-2">
            <Button 
              onClick={onClose}
              className="w-full"
              variant="outline"
            >
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
