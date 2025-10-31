'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Upload, FileText, Plus, Trash2 } from 'lucide-react'
import { useState, useRef } from 'react'

interface Invoice {
  id: string
  file: File | null
  invoiceRef: string
  label: string
  newTotalAmount?: number // Nouveau montant TTC pour la facture d'options
}

interface InvoiceUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (invoices: Invoice[], newTotalAmount?: number) => void
  loading?: boolean
  currentAmount?: number // Montant TTC actuel du devis
}

export function InvoiceUploadModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  loading = false,
  currentAmount = 0
}: InvoiceUploadModalProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([
    { id: '1', file: null, invoiceRef: '', label: 'Facture principale' }
  ])
  const [newTotalAmount, setNewTotalAmount] = useState<string>('')
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})

  const handleFileSelect = (invoiceId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setInvoices(prev => prev.map(inv => 
        inv.id === invoiceId ? { ...inv, file } : inv
      ))
    } else {
      alert('Veuillez sélectionner un fichier PDF valide')
    }
  }

  const handleInvoiceRefChange = (invoiceId: string, value: string) => {
    setInvoices(prev => prev.map(inv => 
      inv.id === invoiceId ? { ...inv, invoiceRef: value } : inv
    ))
  }

  const addSecondInvoice = () => {
    if (invoices.length < 2) {
      setInvoices(prev => [...prev, { 
        id: '2', 
        file: null, 
        invoiceRef: '', 
        label: 'Facture d\'options' 
      }])
    }
  }

  const removeInvoice = (invoiceId: string) => {
    if (invoiceId !== '1') { // Ne pas supprimer la facture principale
      setInvoices(prev => prev.filter(inv => inv.id !== invoiceId))
    }
  }

  const handleSubmit = () => {
    const validInvoices = invoices.filter(inv => inv.file && inv.invoiceRef.trim())
    
    if (validInvoices.length === 0) {
      alert('Veuillez renseigner au moins une facture avec son fichier PDF et sa référence')
      return
    }

    // Si il y a une facture d'options, valider le nouveau montant
    if (invoices.length > 1) {
      const newAmount = parseFloat(newTotalAmount.replace(',', '.'))
      if (!newTotalAmount.trim() || isNaN(newAmount) || newAmount < currentAmount) {
        alert(`Le nouveau montant TTC doit être supérieur ou égal au montant initial de ${currentAmount.toFixed(2)} €`)
        return
      }
      onSubmit(validInvoices, newAmount)
    } else {
      onSubmit(validInvoices)
    }
  }

  // Vérifier si la facture principale est complète
  const isMainInvoiceComplete = () => {
    const mainInvoice = invoices.find(inv => inv.id === '1')
    return mainInvoice && mainInvoice.file && mainInvoice.invoiceRef.trim()
  }

  const handleClose = () => {
    if (!loading) {
      setInvoices([{ id: '1', file: null, invoiceRef: '', label: 'Facture principale' }])
      setNewTotalAmount('')
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
          {/* Section pour chaque facture */}
          {invoices.map((invoice) => (
            <div key={invoice.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-slate-900">{invoice.label}</h3>
                {invoice.id !== '1' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeInvoice(invoice.id)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Si c'est la facture principale ET qu'il y a une 2ème facture, afficher en mode compact */}
              {invoice.id === '1' && invoices.length > 1 && invoice.file && invoice.invoiceRef ? (
                <div className="bg-green-50 border border-green-200 rounded p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-700">{invoice.invoiceRef}</p>
                        <p className="text-xs text-green-600">{invoice.file.name}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setInvoices(prev => prev.map(inv => 
                          inv.id === invoice.id ? { ...inv, file: null, invoiceRef: '' } : inv
                        ))
                      }}
                      disabled={loading}
                      className="text-xs"
                    >
                      Modifier
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Référence de facture */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Référence de la facture *
                    </label>
                    <Input
                      type="text"
                      value={invoice.invoiceRef}
                      onChange={(e) => handleInvoiceRefChange(invoice.id, e.target.value)}
                      placeholder={`Ex: ${invoice.id === '1' ? 'FAC-2024-001' : 'FAC-2024-001-OPT'}`}
                      disabled={loading || (invoice.id === '2' && !isMainInvoiceComplete())}
                      className={`w-full ${invoice.id === '2' && !isMainInvoiceComplete() ? 'opacity-50' : ''}`}
                    />
                  </div>

                  {/* Upload de fichier */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Fichier PDF de la facture *
                    </label>
                    
                    <div 
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                        invoice.file 
                          ? 'border-green-300 bg-green-50' 
                          : invoice.id === '2' && !isMainInvoiceComplete()
                          ? 'border-gray-200 bg-gray-50 opacity-50'
                          : 'border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {invoice.file ? (
                        <div className="space-y-2">
                          <FileText className="h-8 w-8 text-green-600 mx-auto" />
                          <div>
                            <p className="text-sm font-medium text-green-700">
                              {invoice.file.name}
                            </p>
                            <p className="text-xs text-green-600">
                              {(invoice.file.size / 1024 / 1024).toFixed(1)} MB
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setInvoices(prev => prev.map(inv => 
                                inv.id === invoice.id ? { ...inv, file: null } : inv
                              ))
                            }}
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
                            <p className={`text-sm ${invoice.id === '2' && !isMainInvoiceComplete() ? 'text-gray-400' : 'text-slate-600'}`}>
                              {invoice.id === '2' && !isMainInvoiceComplete() 
                                ? 'Complétez d\'abord la facture principale'
                                : 'Glissez-déposez votre fichier PDF ou'
                              }
                            </p>
                            {(invoice.id === '1' || isMainInvoiceComplete()) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRefs.current[invoice.id]?.click()}
                                disabled={loading || (invoice.id === '2' && !isMainInvoiceComplete())}
                                className="mt-2"
                              >
                                Parcourir les fichiers
                              </Button>
                            )}
                          </div>
                          <p className={`text-xs ${invoice.id === '2' && !isMainInvoiceComplete() ? 'text-gray-400' : 'text-slate-500'}`}>
                            Format PDF uniquement, taille max 10MB
                          </p>
                        </div>
                      )}
                    </div>

                    <input
                      ref={(el) => { fileInputRefs.current[invoice.id] = el }}
                      type="file"
                      accept=".pdf"
                      onChange={(e) => handleFileSelect(invoice.id, e)}
                      className="hidden"
                      disabled={invoice.id === '2' && !isMainInvoiceComplete()}
                    />
                  </div>

                  {/* Champ montant TTC pour la facture d'options */}
                  {invoice.id === '2' && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nouveau montant TTC total *
                      </label>
                      <div className="space-y-2">
                        <Input
                          type="text"
                          value={newTotalAmount}
                          onChange={(e) => setNewTotalAmount(e.target.value)}
                          placeholder={`Ex: ${(currentAmount + 100).toFixed(2)}`}
                          disabled={loading || !isMainInvoiceComplete()}
                          className={`w-full ${!isMainInvoiceComplete() ? 'opacity-50' : ''}`}
                        />
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between text-gray-600">
                            <span>💰 Montant initial :</span>
                            <span className="font-medium">{currentAmount.toFixed(2)} €</span>
                          </div>
                          {newTotalAmount && !isNaN(parseFloat(newTotalAmount.replace(',', '.'))) && (
                            <div className="flex justify-between">
                              <span className="text-green-600">📈 Augmentation :</span>
                              <span className="font-medium text-green-600">
                                +{Math.max(0, parseFloat(newTotalAmount.replace(',', '.')) - currentAmount).toFixed(2)} €
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

          {/* Bouton pour ajouter une deuxième facture */}
          {invoices.length === 1 && (
            <Button
              variant="outline"
              onClick={addSecondInvoice}
              disabled={loading || !isMainInvoiceComplete()}
              className={`w-full flex items-center justify-center gap-2 border-dashed ${
                !isMainInvoiceComplete() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              title={!isMainInvoiceComplete() ? 'Complétez d\'abord la facture principale' : ''}
            >
              <Plus className="h-4 w-4" />
              Ajouter une facture d'options
            </Button>
          )}

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
              disabled={
                loading || 
                invoices.filter(inv => inv.file && inv.invoiceRef.trim()).length === 0 ||
                (invoices.length > 1 && (!newTotalAmount.trim() || isNaN(parseFloat(newTotalAmount.replace(',', '.'))) || parseFloat(newTotalAmount.replace(',', '.')) < currentAmount))
              }
              className="flex-1"
            >
              {loading ? 'Envoi en cours...' : `Envoyer ${invoices.filter(inv => inv.file && inv.invoiceRef.trim()).length > 1 ? 'les factures' : 'la facture'}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
