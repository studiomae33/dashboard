'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, Check } from 'lucide-react'

interface InvoiceSentModalProps {
  isOpen: boolean
  onClose: () => void
  recipientEmail: string
  quoteReference: string
  invoiceRef: string
}

export function InvoiceSentModal({ 
  isOpen, 
  onClose, 
  recipientEmail, 
  quoteReference,
  invoiceRef
}: InvoiceSentModalProps) {
  const handleGoogleReview = () => {
    // Ouvrir le lien vers les avis Google
    window.open('https://g.page/r/CYD6Q8RA1VRQEAI/review', '_blank')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg mx-auto p-0 overflow-hidden">
        {/* Header avec gradient subtil */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-blue-200 relative">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="h-5 w-5 text-blue-600" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-lg font-semibold text-slate-900">
                    Facture envoyée avec succès
                  </DialogTitle>
                  <p className="text-sm text-slate-600 mt-1">Email transmis au client</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-blue-200 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>
        </div>
        
        <div className="px-6 py-6 space-y-6">
          {/* Heure d'envoi - Section principale */}
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-900">
              {new Intl.DateTimeFormat('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Europe/Paris'
              }).format(new Date())}
            </div>
            <div className="text-xs text-slate-500 uppercase tracking-wide mt-1">Envoyé à</div>
            
            <div className="mt-4 px-4 py-2 bg-slate-100 rounded-full inline-block">
              <span className="text-sm text-slate-700">
                {new Intl.DateTimeFormat('fr-FR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  timeZone: 'Europe/Paris'
                }).format(new Date())}
              </span>
            </div>
          </div>

          {/* Informations destinataire */}
          <div className="border-t border-slate-200 pt-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-lg">📧</span>
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-medium text-slate-900 text-base">
                  Facture envoyée à
                </h4>
                <div className="text-sm text-slate-600 mt-2">
                  <div className="truncate font-medium">{recipientEmail}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Références */}
          <div className="border-t border-slate-200 pt-5">
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Facture</div>
                  <div className="font-mono text-sm text-slate-900 truncate">{invoiceRef}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Statut</div>
                  <div className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                    Facturé
                  </div>
                </div>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Devis associé</div>
                  <div className="font-mono text-sm text-slate-900 truncate">{quoteReference}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Contenu de l'email */}
          <div className="border-t border-slate-200 pt-5">
            <div className="text-center">
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-3">Contenu envoyé</div>
              <div className="text-sm text-slate-700 space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                  <span>Récapitulatif de la location</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                  <span>Facture en pièce jointe</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                  <span>Invitation à laisser un avis Google</span>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button 
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Fermer
            </Button>
            <Button 
              onClick={handleGoogleReview}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              ⭐ Voir les avis Google
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
