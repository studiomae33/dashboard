import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    console.log('=== DIAGNOSTIC CRÉATION DEVIS ===')
    
    // 1. Test de connexion à la base de données
    console.log('Test de connexion à la base de données...')
    const settings = await prisma.settings.findUnique({
      where: { id: 'singleton' }
    })
    console.log('✅ Base de données connectée, settings trouvés:', !!settings)
    
    // 2. Test de récupération des clients
    console.log('Test de récupération des clients...')
    const clients = await prisma.client.findMany({
      take: 1
    })
    console.log('✅ Clients trouvés:', clients.length)
    
    // 3. Test de création d'un dossier uploads s'il n'existe pas
    const fs = require('fs')
    const path = require('path')
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    
    if (!fs.existsSync(uploadsDir)) {
      console.log('Création du dossier uploads...')
      fs.mkdirSync(uploadsDir, { recursive: true })
      console.log('✅ Dossier uploads créé')
    } else {
      console.log('✅ Dossier uploads existe')
    }
    
    // 4. Test d'écriture de fichier
    console.log('Test d\'écriture de fichier...')
    const testFile = path.join(uploadsDir, 'test.txt')
    fs.writeFileSync(testFile, 'test')
    fs.unlinkSync(testFile)
    console.log('✅ Écriture de fichier fonctionne')
    
    return NextResponse.json({
      success: true,
      checks: {
        database: !!settings,
        clients: clients.length,
        uploadsDir: fs.existsSync(uploadsDir),
        writePermission: true
      },
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasDatabase: !!process.env.DATABASE_URL,
        cwd: process.cwd()
      }
    })
    
  } catch (error) {
    console.error('❌ Erreur diagnostic:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
