import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const config = {
      NODE_ENV: process.env.NODE_ENV,
      RESEND_API_KEY_EXISTS: !!process.env.RESEND_API_KEY,
      RESEND_API_KEY_LENGTH: process.env.RESEND_API_KEY?.length || 0,
      RESEND_API_KEY_PREFIX: process.env.RESEND_API_KEY?.substring(0, 7) + '...' || 'N/A',
      isDevelopment: process.env.NODE_ENV === 'development',
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      message: 'Configuration email debug',
      config
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Erreur lors du test de configuration',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
