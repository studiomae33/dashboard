'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'

interface ModifyDateModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (startDate: string, endDate: string, notifyClient: boolean) => Promise<void>
  currentStartDate: string
  currentEndDate: string
  quoteReference: string
  clientEmail: string
  isLoading?: boolean
}

export function ModifyDateModal({
  isOpen,
  onClose,
  onSave,
  currentStartDate,
  currentEndDate,
  quoteReference,
  clientEmail,
  isLoading = false
}: ModifyDateModalProps) {
  const [startDate, setStartDate] = useState(currentStartDate.slice(0, 16))
  const [endDate, setEndDate] = useState(currentEndDate.slice(0, 16))
  const [notifyClient, setNotifyClient] = useState(true)
  const [error, setError] = useState('')

  const handleSave = async () => {
    setError('')
    
    // Validation des dates
    const start = new Date(startDate)
    const end = new Date(endDate)
    const now = new Date()
    
    if (start >= end) {
      setError('La date de fin doit être après la date de début')
      return
    }
    
    if (start < now) {
      setError('La date de début ne peut pas être dans le passé')
      return
    }
    
    try {
      await onSave(startDate, endDate, notifyClient)
      onClose()
    } catch (error) {
      setError('Erreur lors de la modification des dates')
    }
  }

  const handleClose = () => {
    setError('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">
            Modifier les dates - {quoteReference}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date et heure de début
            </label>
            <Input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date et heure de fin
            </label>
            <Input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="notifyClient"
              checked={notifyClient}
              onChange={(e) => setNotifyClient(e.target.checked)}
              disabled={isLoading}
              className="rounded border-gray-300"
            />
            <label htmlFor="notifyClient" className="text-sm text-gray-700">
              Notifier le client par email ({clientEmail})
            </label>
          </div>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="bg-yellow-50 p-3 rounded-md">
            <p className="text-yellow-800 text-sm">
              ⚠️ <strong>Attention :</strong> Cette modification mettra à jour les dates dans le devis et le calendrier.
              {notifyClient && ' Un email sera envoyé au client pour l\'informer du changement.'}
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? 'Modification...' : 'Modifier les dates'}
          </Button>
        </div>
      </div>
    </div>
  )
}
