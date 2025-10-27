import { NextRequest, NextResponse } from 'next/server'
import { verifySecureDownloadUrl } from '@/lib/secure-blob'

export async function GET(
  request: NextRequest,
  { params }: { params: { payload: string; signature: string } }
) {
  try {
    const { payload, signature } = params
    
    // Vérifier l'URL sécurisée
    const downloadData = verifySecureDownloadUrl(payload, signature)
    
    if (!downloadData) {
      return NextResponse.json({ 
        error: 'Lien invalide ou expiré' 
      }, { status: 401 })
    }
    
    // Optionnel: Vérifier l'IP ou autres critères de sécurité
    const clientIp = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    request.ip || 
                    '127.0.0.1'
    
    console.log('🔐 Téléchargement sécurisé:', {
      clientEmail: downloadData.clientEmail,
      invoiceRef: downloadData.invoiceRef,
      clientIp,
      expiresAt: new Date(downloadData.expiresAt).toISOString()
    })
    
    // Récupérer le fichier depuis Vercel Blob
    const response = await fetch(downloadData.blobUrl)
    
    if (!response.ok) {
      return NextResponse.json({ 
        error: 'Fichier introuvable' 
      }, { status: 404 })
    }
    
    const pdfBuffer = await response.arrayBuffer()
    
    // Retourner le PDF avec headers de sécurité
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="facture-${downloadData.invoiceRef}.pdf"`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff'
      },
    })
    
  } catch (error) {
    console.error('❌ Erreur téléchargement sécurisé:', error)
    return NextResponse.json({ 
      error: 'Erreur serveur' 
    }, { status: 500 })
  }
}
