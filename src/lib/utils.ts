import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(date: Date, locale = 'fr-FR'): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Europe/Paris',
  }).format(date)
}

export function formatDateOnly(date: Date, locale = 'fr-FR'): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeZone: 'Europe/Paris',
  }).format(date)
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount)
}

export function generateReference(prefix: string, counter: number, year?: number): string {
  const currentYear = year || new Date().getFullYear()
  return `${prefix}${currentYear}${counter.toString().padStart(4, '0')}`
}

export function isDateInCurrentMonth(date: Date): boolean {
  const now = new Date()
  return date.getFullYear() === now.getFullYear() && 
         date.getMonth() === now.getMonth()
}

/**
 * Crée une date en tenant compte de la timezone française
 * Détecte automatiquement l'heure d'été/hiver
 */
export function createFrenchDate(dateString: string, timeString?: string): Date {
  if (timeString) {
    // Si on a date et heure séparées, les combiner
    const combined = `${dateString}T${timeString}:00`
    return createFrenchDate(combined)
  }
  
  // Vérifier si la date contient déjà une timezone
  if (dateString.includes('+') || dateString.includes('Z')) {
    return new Date(dateString)
  }
  
  // Créer une date temporaire pour déterminer si on est en heure d'été ou d'hiver
  const tempDate = new Date(dateString)
  
  // Détection automatique de l'heure d'été/hiver en France
  // L'heure d'été va du dernier dimanche de mars au dernier dimanche d'octobre
  const year = tempDate.getFullYear()
  
  // Dernier dimanche de mars
  const lastSundayMarch = new Date(year, 2, 31) // 31 mars
  lastSundayMarch.setDate(31 - lastSundayMarch.getDay()) // Reculer au dimanche
  
  // Dernier dimanche d'octobre
  const lastSundayOctober = new Date(year, 9, 31) // 31 octobre
  lastSundayOctober.setDate(31 - lastSundayOctober.getDay()) // Reculer au dimanche
  
  // Déterminer si on est en heure d'été (UTC+2) ou d'hiver (UTC+1)
  const isDST = tempDate >= lastSundayMarch && tempDate < lastSundayOctober
  const offset = isDST ? '+02:00' : '+01:00'
  
  return new Date(dateString + offset)
}

/**
 * Formate une date pour les inputs datetime-local en tenant compte de la timezone française
 */
export function formatDateForInput(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  // Convertir en heure française pour l'affichage dans l'input
  const frenchDate = new Date(d.toLocaleString('sv-SE', { timeZone: 'Europe/Paris' }))
  
  // Retourner au format datetime-local (YYYY-MM-DDTHH:MM)
  return frenchDate.toISOString().slice(0, 16)
}

/**
 * Détermine si un devis payé nécessite l'envoi d'une facture
 * Un devis nécessite une facture si :
 * - Il est dans le statut PAID
 * - La date de fin de location est passée de plus d'1 heure
 */
export function needsInvoice(quote: {
  status: string
  desiredEnd: string | Date
}): boolean {
  if (quote.status !== 'PAID') {
    return false
  }

  const endDate = new Date(quote.desiredEnd)
  const now = new Date()
  const oneHourAfterEnd = new Date(endDate.getTime() + (60 * 60 * 1000)) // +1 heure

  return now > oneHourAfterEnd
}

/**
 * Retourne le statut d'affichage d'un devis
 * Si le devis est PAID mais nécessite une facture, retourne 'NEEDS_INVOICE'
 */
export function getDisplayStatus(quote: {
  status: string
  desiredEnd: string | Date
}): string {
  if (needsInvoice(quote)) {
    return 'NEEDS_INVOICE'
  }
  return quote.status
}
