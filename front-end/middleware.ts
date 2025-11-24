import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if user has completed onboarding
  const hasSeenOnboarding = request.cookies.get('hasSeenOnboarding');
  
  // Paths that don't require onboarding check
  const publicPaths = ['/onboarding', '/_next', '/api'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));
  
  // Check if it's a static file (images, SVGs, fonts, etc.)
  const staticFileExtensions = ['.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.woff', '.woff2', '.ttf', '.eot'];
  const isStaticFile = staticFileExtensions.some(ext => pathname.toLowerCase().endsWith(ext));
  
  // If accessing a public path or static file, allow through
  if (isPublicPath || isStaticFile) {
    return NextResponse.next();
  }
  
  // If user hasn't seen onboarding and is trying to access any other route
  if (!hasSeenOnboarding && pathname !== '/onboarding') {
    const url = request.nextUrl.clone();
    url.pathname = '/onboarding';
    return NextResponse.redirect(url);
  }
  
  // Allow the request to continue
  return NextResponse.next();
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};

