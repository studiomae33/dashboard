'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface Settings {
  id: string
  quoteCounter: number
  invoiceCounter: number
  quotePrefix: string
  invoicePrefix: string
  studioName: string
  studioAddress: string
  studioPhone: string
  studioEmail: string
  resendApiKey: string
  senderEmail: string
  emailTemplate: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const response = await fetch('/api/admin/settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des paramètres:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function saveSettings() {
    if (!settings) return

    setIsSaving(true)
    setMessage('')

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (response.ok) {
        setMessage('Paramètres sauvegardés avec succès')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage('Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
      setMessage('Erreur lors de la sauvegarde')
    } finally {
      setIsSaving(false)
    }
  }

  function updateSettings(field: keyof Settings, value: string | number) {
    if (settings) {
      setSettings({
        ...settings,
        [field]: value,
      })
    }
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Chargement...</div>
        </div>
      </AdminLayout>
    )
  }

  if (!settings) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Erreur lors du chargement des paramètres</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Paramètres</h1>
          <Button onClick={saveSettings} disabled={isSaving}>
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
          </Button>
        </div>

        {message && (
          <div className={`p-4 rounded-md ${
            message.includes('succès') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Informations Studio */}
          <Card>
            <CardHeader>
              <CardTitle>Informations du Studio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du studio
                </label>
                <Input
                  value={settings.studioName}
                  onChange={(e) => updateSettings('studioName', e.target.value)}
                  placeholder="Studio MAE"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Adresse
                </label>
                <Textarea
                  value={settings.studioAddress}
                  onChange={(e) => updateSettings('studioAddress', e.target.value)}
                  placeholder="123 Rue de la Photographie, 75001 Paris"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Téléphone
                </label>
                <Input
                  value={settings.studioPhone}
                  onChange={(e) => updateSettings('studioPhone', e.target.value)}
                  placeholder="01 23 45 67 89"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email du studio
                </label>
                <Input
                  type="email"
                  value={settings.studioEmail}
                  onChange={(e) => updateSettings('studioEmail', e.target.value)}
                  placeholder="contact@studiomae.fr"
                />
              </div>
            </CardContent>
          </Card>

          {/* Configuration Email */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration Email</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clé API Resend
                </label>
                <Input
                  type="password"
                  value={settings.resendApiKey}
                  onChange={(e) => updateSettings('resendApiKey', e.target.value)}
                  placeholder="re_xxxxxxxxx"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Obtenez votre clé sur <a href="https://resend.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">resend.com</a>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email expéditeur
                </label>
                <Input
                  type="email"
                  value={settings.senderEmail}
                  onChange={(e) => updateSettings('senderEmail', e.target.value)}
                  placeholder="devis@mail.studiomae.fr"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Doit être un domaine vérifié dans Resend
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Numérotation */}
          <Card>
            <CardHeader>
              <CardTitle>Numérotation automatique</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Préfixe devis
                  </label>
                  <Input
                    value={settings.quotePrefix}
                    onChange={(e) => updateSettings('quotePrefix', e.target.value)}
                    placeholder="DE"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compteur devis
                  </label>
                  <Input
                    type="number"
                    value={settings.quoteCounter}
                    onChange={(e) => updateSettings('quoteCounter', parseInt(e.target.value) || 1)}
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Préfixe facture
                  </label>
                  <Input
                    value={settings.invoicePrefix}
                    onChange={(e) => updateSettings('invoicePrefix', e.target.value)}
                    placeholder="FA"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compteur facture
                  </label>
                  <Input
                    type="number"
                    value={settings.invoiceCounter}
                    onChange={(e) => updateSettings('invoiceCounter', parseInt(e.target.value) || 1)}
                    min="1"
                  />
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm text-gray-600">
                  <strong>Exemples :</strong><br />
                  Prochain devis : <span className="font-mono">{settings.quotePrefix}{new Date().getFullYear()}{settings.quoteCounter.toString().padStart(4, '0')}</span><br />
                  Prochaine facture : <span className="font-mono">{settings.invoicePrefix}{new Date().getFullYear()}{settings.invoiceCounter.toString().padStart(4, '0')}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Template Email */}
          <Card>
            <CardHeader>
              <CardTitle>Template Email (avancé)</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Template personnalisé
                </label>
                <Textarea
                  value={settings.emailTemplate}
                  onChange={(e) => updateSettings('emailTemplate', e.target.value)}
                  placeholder="HTML personnalisé (optionnel)"
                  rows={8}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Variables disponibles : {'{'}{'{'} studioName {'}'}{'}'}, {'{'}{'{'} clientName {'}'}{'}'}, {'{'}{'{'} quoteRef {'}'}{'}'}, {'{'}{'{'} validationUrl {'}'}{'}'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={fetchSettings}>
            Annuler
          </Button>
          <Button onClick={saveSettings} disabled={isSaving}>
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  )
}
