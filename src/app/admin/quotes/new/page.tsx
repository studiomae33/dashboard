'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createFrenchDate } from '@/lib/utils'
import Link from 'next/link'

interface Client {
  id: string
  firstName: string
  lastName: string
  companyName?: string
  email: string
}

const backgroundOptions = [
  { value: 'cyclo_blanc', label: 'Cyclo blanc' },
  { value: 'cyclo_noir', label: 'Cyclo noir' },
  { value: 'fonds_colore', label: 'Fonds coloré' },
]

export default function NewQuotePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [formData, setFormData] = useState({
    clientId: '',
    reference: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    selectedBackgrounds: [] as string[],
    colorDetails: '',
    amountTTC: '',
    message: '',
  })
  const [pdfFile, setPdfFile] = useState<File | null>(null)

  // Générer les options d'heures (de 08:00 à 20:00 par tranches de 30 minutes)
  const timeOptions = []
  for (let hour = 8; hour <= 20; hour++) {
    timeOptions.push(`${hour.toString().padStart(2, '0')}:00`)
    if (hour < 20) {
      timeOptions.push(`${hour.toString().padStart(2, '0')}:30`)
    }
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      fetchClients()
    }
  }, [status, router])

  async function fetchClients() {
    try {
      const response = await fetch('/api/admin/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des clients:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Valider que toutes les données sont présentes
      if (!formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime) {
        setError('Veuillez remplir tous les champs de date et heure')
        setIsLoading(false)
        return
      }

      // Combiner date et heure pour créer les DateTime en spécifiant la timezone française
      const startDateTime = createFrenchDate(formData.startDate, formData.startTime)
      const endDateTime = createFrenchDate(formData.endDate, formData.endTime)

      // Vérifier que la fin est après le début
      if (endDateTime <= startDateTime) {
        setError('La date/heure de fin doit être postérieure à celle de début')
        setIsLoading(false)
        return
      }

      // Vérifier que la référence est renseignée
      if (!formData.reference.trim()) {
        setError('Veuillez saisir une référence pour le devis')
        setIsLoading(false)
        return
      }

      // Vérifier qu'au moins un type de fond est sélectionné
      if (formData.selectedBackgrounds.length === 0) {
        setError('Veuillez sélectionner au moins un type de fond')
        setIsLoading(false)
        return
      }

      // Si "fonds coloré" est sélectionné, vérifier que les couleurs sont spécifiées
      if (formData.selectedBackgrounds.includes('fonds_colore') && !formData.colorDetails.trim()) {
        setError('Veuillez préciser les couleurs souhaitées pour les fonds colorés')
        setIsLoading(false)
        return
      }

      // Vérifier et valider le montant TTC
      if (!formData.amountTTC.trim()) {
        setError('Veuillez saisir le montant TTC du devis')
        setIsLoading(false)
        return
      }

      const amountValue = parseFloat(formData.amountTTC.replace(',', '.'))
      if (isNaN(amountValue) || amountValue <= 0) {
        setError('Veuillez saisir un montant TTC valide (supérieur à 0)')
        setIsLoading(false)
        return
      }

      // Construire la description des fonds
      let backgroundDescription = formData.selectedBackgrounds.map(bg => {
        switch(bg) {
          case 'cyclo_blanc': return 'Cyclo blanc'
          case 'cyclo_noir': return 'Cyclo noir'
          case 'fonds_colore': return `Fonds coloré (${formData.colorDetails.trim()})`
          default: return bg
        }
      }).join(', ')

      // Créer FormData pour inclure le fichier PDF
      const formDataToSend = new FormData()
      formDataToSend.append('clientId', formData.clientId)
      formDataToSend.append('reference', formData.reference.trim())
      formDataToSend.append('desiredStart', startDateTime.toISOString())
      formDataToSend.append('desiredEnd', endDateTime.toISOString())
      formDataToSend.append('background', backgroundDescription)
      formDataToSend.append('amountTTC', amountValue.toString())
      formDataToSend.append('message', formData.message)
      
      if (pdfFile) {
        formDataToSend.append('pdfFile', pdfFile)
      }

      const response = await fetch('/api/admin/quotes', {
        method: 'POST',
        body: formDataToSend,
      })

      if (response.ok) {
        const quote = await response.json()
        router.push(`/admin/quotes/${quote.id}`)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Erreur lors de la création du devis')
      }
    } catch (error) {
      setError('Erreur lors de la création du devis')
    } finally {
      setIsLoading(false)
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      
      // Si on change la date de début, mettre à jour la date de fin si nécessaire
      if (name === 'startDate') {
        if (!updated.endDate || updated.endDate < value) {
          updated.endDate = value
        }
      }
      
      // Si on change l'heure de début et que c'est le même jour, s'assurer que l'heure de fin est après
      if (name === 'startTime' && updated.startDate === updated.endDate) {
        const startHour = parseInt(value.split(':')[0])
        const startMinutes = parseInt(value.split(':')[1])
        const endHour = updated.endTime ? parseInt(updated.endTime.split(':')[0]) : 0
        const endMinutes = updated.endTime ? parseInt(updated.endTime.split(':')[1]) : 0
        
        if (startHour > endHour || (startHour === endHour && startMinutes >= endMinutes)) {
          // Ajouter au moins 1 heure
          const newEndHour = startHour + 1
          if (newEndHour <= 20) {
            updated.endTime = `${newEndHour.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`
          } else {
            updated.endTime = '20:00'
          }
        }
      }
      
      return updated
    })
  }

  function handleBackgroundChange(backgroundValue: string, checked: boolean) {
    setFormData(prev => {
      const updated = { ...prev }
      if (checked) {
        updated.selectedBackgrounds = [...prev.selectedBackgrounds, backgroundValue]
      } else {
        updated.selectedBackgrounds = prev.selectedBackgrounds.filter(bg => bg !== backgroundValue)
        // Si on désélectionne "fonds coloré", vider le champ des couleurs
        if (backgroundValue === 'fonds_colore') {
          updated.colorDetails = ''
        }
      }
      return updated
    })
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setPdfFile(file)
      setError('') // Clear any previous error
    } else if (file) {
      setError('Veuillez sélectionner un fichier PDF valide.')
      setPdfFile(null)
    }
  }

  function calculateDuration(): string {
    if (!formData.startDate || !formData.startTime || !formData.endDate || !formData.endTime) {
      return ''
    }

    const start = new Date(`${formData.startDate}T${formData.startTime}:00`)
    const end = new Date(`${formData.endDate}T${formData.endTime}:00`)
    
    const diffMs = end.getTime() - start.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    
    if (diffHours < 0 || (diffHours === 0 && diffMinutes <= 0)) {
      return '⚠️ La fin doit être après le début'
    }
    
    if (diffHours === 0) {
      return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`
    } else if (diffMinutes === 0) {
      return `${diffHours} heure${diffHours > 1 ? 's' : ''}`
    } else {
      return `${diffHours}h${diffMinutes.toString().padStart(2, '0')}`
    }
  }

  if (status === 'loading') {
    return (
      <AdminLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!session) {
    return null
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center mb-6">
          <Link href="/admin/quotes" className="text-blue-600 hover:text-blue-800 mr-4">
            ← Retour aux devis
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Nouveau devis</h1>
            <p className="text-gray-600">Créer une nouvelle demande de devis</p>
          </div>
        </div>

        <div className="max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Informations du devis</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="clientId" className="block text-sm font-medium text-gray-700 mb-1">
                    Client *
                  </label>
                  <select
                    id="clientId"
                    name="clientId"
                    required
                    value={formData.clientId}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.companyName || `${client.firstName} ${client.lastName}`} - {client.email}
                      </option>
                    ))}
                  </select>
                  {clients.length === 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      Aucun client trouvé. <Link href="/admin/clients/new" className="text-blue-600 hover:underline">Créer un client</Link>
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-1">
                    Référence du devis *
                  </label>
                  <Input
                    id="reference"
                    name="reference"
                    type="text"
                    required
                    placeholder="Ex: DE001, DEV2024-015, etc."
                    value={formData.reference}
                    onChange={handleInputChange}
                    className="w-full"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Saisissez la référence que vous utilisez pour ce devis
                  </p>
                </div>

                {/* Date et heure de début */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Date et heure de début *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="startDate" className="block text-xs text-gray-500 mb-1">Date</label>
                      <Input
                        id="startDate"
                        name="startDate"
                        type="date"
                        required
                        value={formData.startDate}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label htmlFor="startTime" className="block text-xs text-gray-500 mb-1">Heure</label>
                      <select
                        id="startTime"
                        name="startTime"
                        required
                        value={formData.startTime}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Sélectionner l'heure</option>
                        {timeOptions.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Date et heure de fin */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Date et heure de fin *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="endDate" className="block text-xs text-gray-500 mb-1">Date</label>
                      <Input
                        id="endDate"
                        name="endDate"
                        type="date"
                        required
                        value={formData.endDate}
                        onChange={handleInputChange}
                        min={formData.startDate || new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <label htmlFor="endTime" className="block text-xs text-gray-500 mb-1">Heure</label>
                      <select
                        id="endTime"
                        name="endTime"
                        required
                        value={formData.endTime}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Sélectionner l'heure</option>
                        {timeOptions.map((time) => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  {/* Affichage de la durée */}
                  {formData.startDate && formData.startTime && formData.endDate && formData.endTime && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-700">
                        📅 <strong>Durée de la session :</strong> {calculateDuration()}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Type de fond * (sélection multiple possible)
                  </label>
                  <div className="space-y-3">
                    {backgroundOptions.map((option) => (
                      <label key={option.value} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.selectedBackgrounds.includes(option.value)}
                          onChange={(e) => handleBackgroundChange(option.value, e.target.checked)}
                          className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">{option.label}</span>
                      </label>
                    ))}
                  </div>
                  
                  {formData.selectedBackgrounds.includes('fonds_colore') && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <label htmlFor="colorDetails" className="block text-sm font-medium text-amber-800 mb-2">
                        Précisez les couleurs souhaitées *
                      </label>
                      <Input
                        id="colorDetails"
                        name="colorDetails"
                        type="text"
                        required
                        placeholder="Ex: Rouge, bleu, vert pastel, dégradé rose-violet..."
                        value={formData.colorDetails}
                        onChange={handleInputChange}
                        className="w-full border-amber-300 focus:border-amber-500 focus:ring-amber-500"
                      />
                      <p className="text-xs text-amber-700 mt-1">
                        Décrivez précisément les couleurs que le client souhaite pour les fonds colorés
                      </p>
                    </div>
                  )}
                  
                  {formData.selectedBackgrounds.length > 0 && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-700">
                        <strong>Sélection actuelle :</strong> {
                          formData.selectedBackgrounds.map(bg => {
                            switch(bg) {
                              case 'cyclo_blanc': return 'Cyclo blanc'
                              case 'cyclo_noir': return 'Cyclo noir'
                              case 'fonds_colore': return `Fonds coloré${formData.colorDetails ? ` (${formData.colorDetails})` : ''}`
                              default: return bg
                            }
                          }).join(', ')
                        }
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="amountTTC" className="block text-sm font-medium text-gray-700 mb-1">
                    Montant TTC *
                  </label>
                  <div className="relative">
                    <Input
                      id="amountTTC"
                      name="amountTTC"
                      type="text"
                      required
                      placeholder="150.00"
                      value={formData.amountTTC}
                      onChange={handleInputChange}
                      className="w-full pr-8"
                    />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 text-sm">
                      €
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Montant total du devis en euros TTC (ex: 150.00 ou 150,50)
                  </p>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message et besoins détaillés (privé)
                  </label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    placeholder="Décrivez les besoins spécifiques du client (nombre de personnes, type de photos, etc.) - Information privée, non visible par le client"
                    rows={4}
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    ℹ️ Ces informations sont privées et ne seront pas transmises au client
                  </p>
                </div>

                <div>
                  <label htmlFor="pdfFile" className="block text-sm font-medium text-gray-700 mb-1">
                    Devis PDF *
                  </label>
                  <Input
                    id="pdfFile"
                    name="pdfFile"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    required
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Sélectionnez le fichier PDF du devis à envoyer au client.
                  </p>
                  {pdfFile && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                      <p className="text-sm text-green-700">
                        ✓ Fichier sélectionné: {pdfFile.name} ({Math.round(pdfFile.size / 1024)} KB)
                      </p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                    {error}
                  </div>
                )}

                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <Link href="/admin/quotes">
                    <Button variant="outline" type="button">
                      Annuler
                    </Button>
                  </Link>
                  <Button type="submit" disabled={isLoading || !formData.clientId || !pdfFile}>
                    {isLoading ? 'Création...' : 'Créer le devis'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
