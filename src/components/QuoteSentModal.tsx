'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface QuoteSentModalProps {
  isOpen: boolean
  onClose: () => void
  recipientEmail: string
  quoteReference: string
}

export function QuoteSentModal({ 
  isOpen, 
  onClose, 
  recipientEmail, 
  quoteReference
}: QuoteSentModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-3xl">✅</span>
            Devis envoyé avec succès !
          </DialogTitle>
          <DialogClose onClose={onClose} />
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Message de succès */}
          <div className="text-center py-4">
            <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-4xl animate-bounce">🎉</span>
            </div>
            <h3 className="text-xl font-bold text-green-900 mb-2">Parfait !</h3>
            <p className="text-green-700">Votre devis a été envoyé par email</p>
          </div>

          {/* Détails */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-green-700">Devis :</span>
                <span className="font-bold text-green-900">{quoteReference}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-green-700">Envoyé à :</span>
                <span className="font-semibold text-green-900">{recipientEmail}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-green-700">Heure :</span>
                <span className="font-semibold text-green-900">
                  {new Intl.DateTimeFormat('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    timeZone: 'Europe/Paris'
                  }).format(new Date())}
                </span>
              </div>
            </div>
          </div>

          {/* Prochaines étapes */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <span>📋</span>
              Ce qui se passe maintenant :
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Le client a reçu l'email avec le PDF du devis</li>
              <li>• Il peut cliquer sur le lien pour valider le devis</li>
              <li>• Le statut est maintenant "Envoyé"</li>
              <li>• Vous serez notifié dès qu'il validera</li>
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
