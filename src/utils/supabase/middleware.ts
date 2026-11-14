import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { signProxyUser } from '@/utils/proxyAuth'

function stripProxyUserHeaders(headers: Headers) {
  headers.delete('x-user-id')
  headers.delete('x-user-email')
  headers.delete('x-user-role')
  headers.delete('x-user-name')
  headers.delete('x-user-phone')
  headers.delete('x-user-avatar')
  headers.delete('x-user-active')
  headers.delete('x-user-ts')
  headers.delete('x-user-sig')
}

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://heslqxyonklerdcxjohf.supabase.co'
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhlc2xxeHlvbmtsZXJkY3hqb2hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5ODMyOTIsImV4cCI6MjEwNDU1OTI5Mn0.NaVbb5W4lZa82GjtFBjE3hur60p68v5r13OdOwp3iwE'

  // Unconditionally sanitize any client-supplied internal identity headers
  const sanitizedIncomingHeaders = new Headers(request.headers)
  stripProxyUserHeaders(sanitizedIncomingHeaders)

  let supabaseResponse = NextResponse.next({
    request: { headers: sanitizedIncomingHeaders },
  })

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
            supabaseResponse = NextResponse.next({
              request: { headers: sanitizedIncomingHeaders },
            })
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
    let fullName = 'Valued User'
    let phone = ''
    let avatarUrl = ''

    if (user) {
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('role, is_active, full_name, phone, avatar_url')
        .eq('id', user.id)
        .maybeSingle()

      if (profileErr) {
        isActive = false
      } else if (profile) {
        role = profile.role || 'customer'
        isActive = profile.is_active ?? true
        fullName = profile.full_name || (user.user_metadata?.full_name as string) || 'Valued User'
        phone = profile.phone || (user.user_metadata?.phone as string) || ''
        avatarUrl = profile.avatar_url || ''
      }
    }

    // Helper to preserve refreshed auth session cookies across redirects
    const makeRedirect = (url: URL | string, status = 307) => {
      const redirectRes = NextResponse.redirect(url, status)
      supabaseResponse.cookies.getAll().forEach((c) => {
        redirectRes.cookies.set(c.name, c.value, c)
      })
      return redirectRes
    }

    // Forward authenticated user identity headers downstream only if INTERNAL_PROXY_SECRET is configured
    const requestHeaders = new Headers(sanitizedIncomingHeaders)
    stripProxyUserHeaders(requestHeaders)

    if (user && isActive) {
      const ts = Date.now()
      const email = user.email || ''
      const sig = signProxyUser(user.id, role, true, email, ts)
      if (sig) {
        requestHeaders.set('x-user-id', user.id)
        requestHeaders.set('x-user-email', email)
        requestHeaders.set('x-user-role', role)
        requestHeaders.set('x-user-name', encodeURIComponent(fullName))
        requestHeaders.set('x-user-phone', phone)
        requestHeaders.set('x-user-avatar', avatarUrl)
        requestHeaders.set('x-user-active', 'true')
        requestHeaders.set('x-user-ts', String(ts))
        requestHeaders.set('x-user-sig', sig)
      }
    }

    // 1. Deactivated user protection
    if (user && !isActive) {
      if (pathname.startsWith('/dashboard') || pathname.startsWith('/teacher') || pathname.startsWith('/admin')) {
        await supabase.auth.signOut();
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('error', 'deactivated')
        const redirectRes = makeRedirect(url)
        request.cookies.getAll().forEach((cookie) => {
          if (cookie.name.includes('supabase') || cookie.name.includes('sb-')) {
            redirectRes.cookies.delete(cookie.name)
          }
        })
        return redirectRes
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
      return makeRedirect(redirectUrl)
    }

    // 3. /admin/* route protection (admin only)
    if (pathname.startsWith('/admin')) {
      if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('returnTo', pathname)
        return makeRedirect(url)
      }
      if (role !== 'admin') {
        const url = request.nextUrl.clone()
        url.pathname = role === 'teacher' ? '/teacher' : '/dashboard'
        return makeRedirect(url)
      }
    }

    // 4. /teacher/* route protection (teacher & admin only)
    if (pathname.startsWith('/teacher')) {
      if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('returnTo', pathname)
        return makeRedirect(url)
      }
      if (role !== 'teacher' && role !== 'admin') {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return makeRedirect(url)
      }
    }

    // 5. /dashboard/* route protection (any authenticated active user)
    if (pathname.startsWith('/dashboard')) {
      if (!user) {
        const url = request.nextUrl.clone()
        url.pathname = '/login'
        url.searchParams.set('returnTo', pathname)
        return makeRedirect(url)
      }
    }

    const finalResponse = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
    supabaseResponse.cookies.getAll().forEach((c) => {
      finalResponse.cookies.set(c.name, c.value, c)
    })
    return finalResponse
  } catch (_error) {
    const safeHeaders = new Headers(request.headers)
    stripProxyUserHeaders(safeHeaders)
    return NextResponse.next({
      request: {
        headers: safeHeaders,
      },
    })
  }
}
