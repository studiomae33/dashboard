import { withAuth } from 'next-auth/middleware'

export default withAuth(
  function middleware(req) {
    // Middleware logic here
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const isOnAdmin = req.nextUrl.pathname.startsWith('/admin')
        
        if (isOnAdmin) {
          return !!token
        }
        
        return true
      },
    },
  }
)

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
}
