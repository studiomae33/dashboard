'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, Check } from 'lucide-react'

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
      <DialogContent className="max-w-lg mx-auto p-0 overflow-hidden">
        {/* Header avec gradient subtil */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-200 relative">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-lg font-semibold text-slate-900">
                    Devis envoyé avec succès
                  </DialogTitle>
                  <p className="text-sm text-slate-600 mt-1">Email transmis au client</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-green-200 flex-shrink-0"
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
                  Email envoyé à
                </h4>
                <div className="text-sm text-slate-600 mt-2">
                  <div className="truncate font-medium">{recipientEmail}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Référence */}
          <div className="border-t border-slate-200 pt-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Référence</div>
                <div className="font-mono text-sm text-slate-900 truncate">{quoteReference}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-xs text-slate-500 uppercase tracking-wide mb-1">Statut</div>
                <div className="inline-flex items-center px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                  Envoyé
                </div>
              </div>
            </div>
          </div>

          {/* Prochaines étapes */}
          <div className="border-t border-slate-200 pt-5 pb-2">
            <div className="text-center">
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-3">Prochaines étapes</div>
              <div className="text-sm text-slate-700 space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                  <span>Le client peut valider via le lien reçu</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                  <span>Vous serez notifié de la validation</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bouton de fermeture */}
          <div className="pt-4">
            <Button 
              onClick={onClose}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white"
            >
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
