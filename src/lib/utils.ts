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
