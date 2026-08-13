import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isAuthRoute = request.nextUrl.pathname.startsWith('/login') || 
                      request.nextUrl.pathname.startsWith('/forgot-password') || 
                      request.nextUrl.pathname.startsWith('/reset-password') ||
                      request.nextUrl.pathname.startsWith('/auth') ||
                      request.nextUrl.pathname.startsWith('/api/auth')

  const isPublicRoute = 
    request.nextUrl.pathname === '/' || 
    request.nextUrl.pathname === '/home' ||
    request.nextUrl.pathname === '/features' ||
    request.nextUrl.pathname === '/pricing' ||
    request.nextUrl.pathname === '/about';

  if (!user && !isAuthRoute && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (user) {
    const role = user.app_metadata?.role

    let targetDashboard = '/'
    if (role === 'superadmin' || role === 'agency_staff') {
      targetDashboard = '/agency/dashboard'
    } else if (role === 'college_admin' || role === 'college_staff') {
      targetDashboard = '/college/dashboard'
    } else if (role === 'student') {
      targetDashboard = '/student/dashboard'
    }

    const isOnboarding = request.nextUrl.pathname.startsWith('/onboarding')
    const needsOnboarding = user.app_metadata?.onboarding_complete === false

    // Force onboarding
    if (needsOnboarding && !isOnboarding) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding'
      return NextResponse.redirect(url)
    }

    // Prevent accessing onboarding if completed
    if (!needsOnboarding && isOnboarding) {
      const url = request.nextUrl.clone()
      url.pathname = targetDashboard
      return NextResponse.redirect(url)
    }

    // If user is on an auth route, redirect them to their dashboard
    if (isAuthRoute && !request.nextUrl.pathname.startsWith('/reset-password') && !isOnboarding) {
      const url = request.nextUrl.clone()
      url.pathname = targetDashboard
      return NextResponse.redirect(url)
    }

    // Role-based route protection
    const path = request.nextUrl.pathname
    if (path.startsWith('/agency') && role !== 'superadmin' && role !== 'agency_staff') {
      const url = request.nextUrl.clone()
      url.pathname = targetDashboard
      return NextResponse.redirect(url)
    }
    if (path.startsWith('/college') && role !== 'college_admin' && role !== 'college_staff') {
      const url = request.nextUrl.clone()
      url.pathname = targetDashboard
      return NextResponse.redirect(url)
    }
    if (path.startsWith('/student') && role !== 'student') {
      const url = request.nextUrl.clone()
      url.pathname = targetDashboard
      return NextResponse.redirect(url)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
