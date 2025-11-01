import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ModifyBackgroundModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (background: string) => Promise<void>
  currentBackground: string
  quoteReference: string
  isLoading: boolean
}

const BACKGROUND_OPTIONS = [
  'Cyclo blanc',
  'Cyclo noir',
  'Fonds colorés'
]

export function ModifyBackgroundModal({
  isOpen,
  onClose,
  onSave,
  currentBackground,
  quoteReference,
  isLoading
}: ModifyBackgroundModalProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [colorDetails, setColorDetails] = useState('')

  // Gestion de la touche Échap
  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleOptionToggle = (option: string) => {
    setSelectedOptions(prev => 
      prev.includes(option) 
        ? prev.filter(o => o !== option)
        : [...prev, option]
    )
  }

  const handleSave = async () => {
    let backgroundToSave = ''
    
    // Construire la chaîne finale
    const selectedParts = [...selectedOptions]
    
    // Si "Fonds colorés" est sélectionné et qu'il y a des détails de couleur
    if (selectedOptions.includes('Fonds colorés') && colorDetails.trim()) {
      const index = selectedParts.indexOf('Fonds colorés')
      selectedParts[index] = `Fonds colorés (${colorDetails.trim()})`
    }
    
    backgroundToSave = selectedParts.join(' + ')
    
    if (!backgroundToSave.trim()) return
    
    await onSave(backgroundToSave)
    onClose()
  }

  const hasColorSelected = selectedOptions.includes('Fonds colorés')
  const isValidSelection = selectedOptions.length > 0 && (!hasColorSelected || colorDetails.trim())

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div className="fixed inset-0" />
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center">
              <span className="mr-2">🎨</span>
              Modifier le type de fond
            </CardTitle>
            <p className="text-sm text-gray-600">
              Devis {quoteReference}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Type de fond actuel
              </label>
              <p className="text-sm text-gray-900 p-2 bg-gray-50 rounded border">
                {currentBackground}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Nouveau type de fond (plusieurs choix possibles)
              </label>
              <div className="space-y-2">
                {BACKGROUND_OPTIONS.map((option) => (
                  <label key={option} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedOptions.includes(option)}
                      onChange={() => handleOptionToggle(option)}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {hasColorSelected && (
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Spécifiez les couleurs
                </label>
                <input
                  type="text"
                  value={colorDetails}
                  onChange={(e) => setColorDetails(e.target.value)}
                  placeholder="Ex: Rouge, Bleu, Dégradé vert-jaune..."
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Décrivez les couleurs souhaitées pour les fonds colorés
                </p>
              </div>
            )}

            <div className="bg-orange-50 border border-orange-200 rounded-md p-3">
              <p className="text-xs text-orange-800 flex items-center">
                <span className="mr-1">ℹ️</span>
                Cette modification sera prise en compte dans la facture et l'historique, mais aucun email ne sera envoyé au client.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading || !isValidSelection}
              >
                {isLoading ? 'Modification...' : 'Modifier'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
