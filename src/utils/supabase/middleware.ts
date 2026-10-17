import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({ request })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    const pathname = request.nextUrl.pathname

    let role = 'customer'
    let isActive = true

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .maybeSingle()

      if (profile) {
        role = profile.role || 'customer'
        isActive = profile.is_active ?? true
      }
    }

    // 1. Deactivated user protection
    if (user && !isActive) {
      if (pathname.startsWith('/dashboard') || pathname.startsWith('/teacher') || pathname.startsWith('/admin')) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('error', 'deactivated')
        return NextResponse.redirect(url)
      }
    }

    // 2. Already logged in user navigating to /login or /signup
    if (user && isActive && (pathname === '/login' || pathname === '/signup')) {
      const redirectUrl = request.nextUrl.clone()
      if (role === 'admin') {
        redirectUrl.pathname = '/admin'
      } else if (role === 'teacher') {
        redirectUrl.pathname = '/teacher'
      } else {
        redirectUrl.pathname = '/dashboard'
      }
      return NextResponse.redirect(redirectUrl)
    }

    // 3. /admin/* route protection (admin only)
    if (pathname.startsWith('/admin')) {
      if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('returnTo', pathname)
        return NextResponse.redirect(url)
      }
      if (role !== 'admin') {
        const url = request.nextUrl.clone()
        url.pathname = role === 'teacher' ? '/teacher' : '/dashboard'
        return NextResponse.redirect(url)
      }
    }

    // 4. /teacher/* route protection (teacher & admin only)
    if (pathname.startsWith('/teacher')) {
      if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('returnTo', pathname)
        return NextResponse.redirect(url)
      }
      if (role !== 'teacher' && role !== 'admin') {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }
    }

    // 5. /dashboard/* route protection (any authenticated active user)
    if (pathname.startsWith('/dashboard')) {
      if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('returnTo', pathname)
        return NextResponse.redirect(url)
      }
    }

    return supabaseResponse
  } catch (_error) {
    return NextResponse.next({ request })
  }
}
