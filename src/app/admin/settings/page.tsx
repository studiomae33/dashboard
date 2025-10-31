'use client'

import { useState, useEffect } from 'react'
import { AdminLayout } from '@/components/admin-layout'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
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
  const [testingReminders, setTestingReminders] = useState(false)
  const [reminderTestResult, setReminderTestResult] = useState<any>(null)
  const [testingEmailReminder, setTestingEmailReminder] = useState(false)
  const [emailReminderTestResult, setEmailReminderTestResult] = useState<any>(null)
  
  // États pour le diagnostic SMS
  const [testingSMSDiagnostic, setTestingSMSDiagnostic] = useState(false)
  const [smsDiagnosticResult, setSMSDiagnosticResult] = useState<any>(null)
  const [testingSMSSend, setTestingSMSSend] = useState(false)
  const [smsSendResult, setSMSSendResult] = useState<any>(null)

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

  async function testReminders() {
    setTestingReminders(true)
    setReminderTestResult(null)

    try {
      const response = await fetch('/api/admin/test-sms', {
        method: 'POST',
      })

      if (response.ok) {
        const data = await response.json()
        setReminderTestResult(data)
      } else {
        setReminderTestResult({ error: 'Erreur lors du test SMS' })
      }
    } catch (error) {
      console.error('Erreur lors du test SMS:', error)
      setReminderTestResult({ error: 'Erreur lors du test SMS' })
    } finally {
      setTestingReminders(false)
    }
  }

  async function testEmailReminder() {
    setTestingEmailReminder(true)
    setEmailReminderTestResult(null)

    try {
      const response = await fetch('/api/admin/test-location-reminder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testEmail: 'contact@studiomae.fr',
          testKey: 'dev-test'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setEmailReminderTestResult(data)
      } else {
        const error = await response.json()
        setEmailReminderTestResult({ error: error.error || 'Erreur lors du test email' })
      }
    } catch (error) {
      console.error('Erreur lors du test email:', error)
      setEmailReminderTestResult({ error: 'Erreur lors du test email' })
    } finally {
      setTestingEmailReminder(false)
    }
  }

  async function testEmailReminders() {
    setTestingEmailReminder(true)
    setEmailReminderTestResult(null)
    
    try {
      const response = await fetch('/api/admin/test-reminders', {
        method: 'POST'
      })
      
      const result = await response.json()
      setEmailReminderTestResult(result)
    } catch (error) {
      setEmailReminderTestResult({
        success: false,
        error: 'Erreur lors du test des rappels email'
      })
    } finally {
      setTestingEmailReminder(false)
    }
  }

  // Fonction pour tester le diagnostic SMS
  async function testSMSDiagnostic() {
    setTestingSMSDiagnostic(true)
    setSMSDiagnosticResult(null)
    
    try {
      const response = await fetch('/api/admin/sms-diagnostic', {
        method: 'POST'
      })
      
      const result = await response.json()
      setSMSDiagnosticResult(result)
    } catch (error) {
      setSMSDiagnosticResult({
        success: false,
        error: 'Erreur lors du diagnostic SMS'
      })
    } finally {
      setTestingSMSDiagnostic(false)
    }
  }

  // Fonction pour tester l'envoi SMS
  async function testSMSSend() {
    setTestingSMSSend(true)
    setSMSSendResult(null)
    
    try {
      const response = await fetch('/api/admin/test-sms', {
        method: 'POST'
      })
      
      const result = await response.json()
      setSMSSendResult(result)
    } catch (error) {
      setSMSSendResult({
        success: false,
        error: 'Erreur lors du test d\'envoi SMS'
      })
    } finally {
      setTestingSMSSend(false)
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
                  placeholder="05.54.54.70.93"
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

          {/* Système de rappels SMS */}
          <Card>
            <CardHeader>
              <CardTitle>📱 Rappels SMS automatiques</CardTitle>
              <CardDescription>Système de rappels 48h avant les locations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">🤖 Fonctionnement automatique</h4>
                <p className="text-sm text-blue-800 mb-2">
                  Chaque jour à 10h00, le système vérifie automatiquement les locations prévues dans 48h et envoie un SMS de rappel.
                </p>
                <p className="text-xs text-blue-600">
                  • SMS envoyés aux numéros configurés dans SMS_ADMIN_NUMBERS<br/>
                  • Uniquement pour les devis signés/payés/facturés<br/>
                  • Contient : date, heure, client, référence, type de fond
                </p>
              </div>
              
              <div>
                <button
                  onClick={testReminders}
                  disabled={testingReminders}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {testingReminders ? '⏳ Envoi en cours...' : '📱 Envoyer un SMS de test'}
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Envoie un SMS de test aux numéros administrateurs configurés
                </p>
              </div>
              
              {reminderTestResult && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <h5 className="font-medium text-gray-900 mb-2">Résultat du test :</h5>
                  <pre className="text-xs bg-white p-2 rounded border overflow-auto">
                    {JSON.stringify(reminderTestResult, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Système de rappels Email clients */}
          <Card>
            <CardHeader>
              <CardTitle>📱 Diagnostic SMS</CardTitle>
              <CardDescription>Diagnostic et test du système SMS OVH</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-200">
                <h4 className="font-medium text-blue-900 mb-2">🔍 Diagnostic complet</h4>
                <p className="text-sm text-blue-800 mb-2">
                  Vérification de la configuration OVH, connectivité API, services SMS disponibles
                </p>
                <p className="text-xs text-blue-600">
                  • Variables d'environnement<br/>
                  • Authentification OVH<br/>
                  • Services SMS actifs<br/>
                  • Test de connectivité
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <button
                    onClick={testSMSDiagnostic}
                    disabled={testingSMSDiagnostic}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {testingSMSDiagnostic ? '⏳ Diagnostic...' : '🔍 Diagnostic SMS'}
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    Vérification complète de la config OVH
                  </p>
                </div>
                
                <div>
                  <button
                    onClick={testSMSSend}
                    disabled={testingSMSSend}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {testingSMSSend ? '⏳ Envoi...' : '📱 Test envoi SMS'}
                  </button>
                  <p className="text-xs text-gray-500 mt-1">
                    Envoi d'un SMS de test réel
                  </p>
                </div>
              </div>
              
              {smsDiagnosticResult && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <h5 className="font-medium text-gray-900 mb-2">Résultat du diagnostic :</h5>
                  <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-64">
                    {JSON.stringify(smsDiagnosticResult, null, 2)}
                  </pre>
                </div>
              )}
              
              {smsSendResult && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <h5 className="font-medium text-gray-900 mb-2">Résultat de l'envoi SMS :</h5>
                  <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-64">
                    {JSON.stringify(smsSendResult, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Système de rappels Email clients */}
          <Card>
            <CardHeader>
              <CardTitle>📧 Rappels Email automatiques</CardTitle>
              <CardDescription>Emails de rappel aux clients 48h avant leur location</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-200">
                <h4 className="font-medium text-green-900 mb-2">📬 Fonctionnement automatique</h4>
                <p className="text-sm text-green-800 mb-2">
                  En même temps que les SMS admin, le système envoie automatiquement un email de rappel aux clients.
                </p>
                <p className="text-xs text-green-600">
                  • Email envoyé directement au client<br/>
                  • Contient : date, heure, configuration, lien vers infos pratiques<br/>
                  • Page d'infos avec FAQ, adresse, parking, matériel inclus
                </p>
              </div>
              
              <div>
                <button
                  onClick={testEmailReminder}
                  disabled={testingEmailReminder}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {testingEmailReminder ? '⏳ Envoi en cours...' : '📧 Tester l\'email de rappel'}
                </button>
                <p className="text-xs text-gray-500 mt-1">
                  Envoie un email de test à contact@studiomae.fr avec une réservation fictive
                </p>
              </div>
              
              {emailReminderTestResult && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <h5 className="font-medium text-gray-900 mb-2">Résultat du test :</h5>
                  <pre className="text-xs bg-white p-2 rounded border overflow-auto">
                    {JSON.stringify(emailReminderTestResult, null, 2)}
                  </pre>
                </div>
              )}
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
