import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname
        
        // Pages publiques autorisées pour les clients (avec tokens)
        const publicClientRoutes = [
          '/quote/validate/',     // Validation devis
          '/location-info/',      // Rappel location
          '/payment/',           // Pages de paiement
          '/login',              // Page de connexion
          '/api/quote/validate/', // API validation devis
          '/api/location-info/',  // API rappel location
        ]
        
        // Vérifier si c'est une route cliente publique
        const isPublicClientRoute = publicClientRoutes.some(route => 
          pathname.startsWith(route)
        )
        
        // Si c'est une route cliente publique, autoriser l'accès
        if (isPublicClientRoute) {
          return true
        }
        
        // Pour toutes les autres routes, exiger une authentification
        return !!token
      },
    },
  }
)

export const config = {
  // Appliquer le middleware à toutes les routes sauf les fichiers statiques et l'API d'auth
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/auth).*)'],
}
