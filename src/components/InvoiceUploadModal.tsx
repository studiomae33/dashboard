'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Upload, FileText } from 'lucide-react'
import { useState, useRef } from 'react'

interface InvoiceUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (file: File, invoiceRef: string) => void
  loading?: boolean
}

export function InvoiceUploadModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading = false 
}: InvoiceUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [invoiceRef, setInvoiceRef] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
    } else {
      alert('Veuillez sélectionner un fichier PDF valide')
    }
  }

  const handleSubmit = () => {
    if (!selectedFile || !invoiceRef.trim()) {
      alert('Veuillez renseigner la référence de facture et joindre le fichier PDF')
      return
    }
    onSubmit(selectedFile, invoiceRef.trim())
  }

  const handleClose = () => {
    if (!loading) {
      setSelectedFile(null)
      setInvoiceRef('')
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg mx-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Envoyer la facture
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={loading}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="space-y-6 pt-2">
          {/* Référence de facture */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Référence de la facture *
            </label>
            <Input
              type="text"
              value={invoiceRef}
              onChange={(e) => setInvoiceRef(e.target.value)}
              placeholder="Ex: FAC-2024-001"
              disabled={loading}
              className="w-full"
            />
          </div>

          {/* Upload de fichier */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Fichier PDF de la facture *
            </label>
            
            <div 
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                selectedFile 
                  ? 'border-green-300 bg-green-50' 
                  : 'border-slate-300 hover:border-slate-400'
              }`}
            >
              {selectedFile ? (
                <div className="space-y-2">
                  <FileText className="h-8 w-8 text-green-600 mx-auto" />
                  <div>
                    <p className="text-sm font-medium text-green-700">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-green-600">
                      {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    disabled={loading}
                    className="text-xs"
                  >
                    Changer le fichier
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 text-slate-400 mx-auto" />
                  <div>
                    <p className="text-sm text-slate-600">
                      Glissez-déposez votre fichier PDF ou
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                      className="mt-2"
                    >
                      Parcourir les fichiers
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Format PDF uniquement, taille max 10MB
                  </p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !selectedFile || !invoiceRef.trim()}
              className="flex-1"
            >
              {loading ? 'Envoi en cours...' : 'Envoyer la facture'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
