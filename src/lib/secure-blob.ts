import { createHash, createHmac } from 'crypto'

const SECRET_KEY = process.env.NEXTAUTH_SECRET || 'your-secret-key'

interface SecureDownloadData {
  blobUrl: string
  expiresAt: number
  clientEmail: string
  invoiceRef: string
}

// Générer une URL sécurisée avec expiration
export function generateSecureDownloadUrl(
  blobUrl: string, 
  clientEmail: string, 
  invoiceRef: string,
  expiresInHours: number = 72 // 72h par défaut
): string {
  const expiresAt = Date.now() + (expiresInHours * 60 * 60 * 1000)
  
  const data: SecureDownloadData = {
    blobUrl,
    expiresAt,
    clientEmail,
    invoiceRef
  }
  
  const payload = Buffer.from(JSON.stringify(data)).toString('base64')
  const signature = createHmac('sha256', SECRET_KEY)
    .update(payload)
    .digest('hex')
  
  return `${process.env.NEXTAUTH_URL}/api/secure-download/${payload}/${signature}`
}

// Vérifier et décoder une URL sécurisée
export function verifySecureDownloadUrl(payload: string, signature: string): SecureDownloadData | null {
  try {
    // Vérifier la signature
    const expectedSignature = createHmac('sha256', SECRET_KEY)
      .update(payload)
      .digest('hex')
    
    if (signature !== expectedSignature) {
      console.log('❌ Signature invalide')
      return null
    }
    
    // Décoder les données
    const data: SecureDownloadData = JSON.parse(
      Buffer.from(payload, 'base64').toString()
    )
    
    // Vérifier l'expiration
    if (Date.now() > data.expiresAt) {
      console.log('❌ Lien expiré')
      return null
    }
    
    return data
  } catch (error) {
    console.error('❌ Erreur décodage URL sécurisée:', error)
    return null
  }
}

// Obfusquer les noms de fichiers pour éviter la prédictibilité
export function generateObfuscatedFileName(invoiceRef: string): string {
  const timestamp = Date.now()
  const randomSuffix = Math.random().toString(36).substring(2, 8)
  const hash = createHash('md5').update(`${invoiceRef}_${timestamp}`).digest('hex').substring(0, 8)
  
  return `invoices/${hash}_${randomSuffix}_${timestamp}.pdf`
}
