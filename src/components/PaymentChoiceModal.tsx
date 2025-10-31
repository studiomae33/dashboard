'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface PaymentChoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onOnlinePayment: () => void
  onOnsitePayment: () => void
  quoteReference: string
}

export function PaymentChoiceModal({ 
  isOpen, 
  onClose, 
  onOnlinePayment,
  onOnsitePayment,
  quoteReference
}: PaymentChoiceModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">💳</span>
            Demander le paiement
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm p-3 rounded-md text-gray-600 bg-blue-50">
            <p className="font-medium">Devis : {quoteReference}</p>
            <p className="mt-1">
              Choisissez le mode de paiement pour ce devis validé.
            </p>
          </div>

          {/* Choix paiement en ligne */}
          <div className="space-y-3">
            <Button
              onClick={onOnlinePayment}
              className="w-full h-auto p-4 bg-green-600 hover:bg-green-700 text-white"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">🌐</span>
                <div className="text-left">
                  <div className="font-semibold">Paiement en ligne</div>
                  <div className="text-sm opacity-90">Avec lien SumUp - paiement immédiat</div>
                </div>
              </div>
            </Button>

            <Button
              onClick={onOnsitePayment}
              variant="outline"
              className="w-full h-auto p-4 border-2"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">🏪</span>
                <div className="text-left">
                  <div className="font-semibold">Paiement sur place</div>
                  <div className="text-sm text-gray-600">Par CB le jour de la location</div>
                </div>
              </div>
            </Button>
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
