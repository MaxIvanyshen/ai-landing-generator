'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.push('/')
        router.refresh()
      }
    })
    return () => subscription.unsubscribe()
  }, [router, supabase])

  return (
    <div className="min-h-screen dot-grid bg-zinc-950 flex items-center justify-center px-4">
      {/* Radial fade overlay */}
      <div className="absolute inset-0 bg-radial-[ellipse_at_center] from-transparent to-zinc-950/80 pointer-events-none" />

      <div className="relative w-full max-w-sm">
        <div className="glass rounded-2xl p-8">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 mb-4">
              <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold gradient-text">Landing Page Generator</h1>
            <p className="mt-1.5 text-sm text-zinc-500">Sign in to start generating</p>
          </div>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#7c3aed',
                    brandAccent: '#6d28d9',
                    inputBackground: 'rgba(255,255,255,0.05)',
                    inputText: '#f4f4f5',
                    inputBorder: 'rgba(255,255,255,0.1)',
                    inputBorderFocus: '#7c3aed',
                    inputLabelText: '#71717a',
                    messageText: '#f4f4f5',
                    anchorTextColor: '#a78bfa',
                    dividerBackground: 'rgba(255,255,255,0.08)',
                    defaultButtonBackground: 'rgba(255,255,255,0.05)',
                    defaultButtonBackgroundHover: 'rgba(255,255,255,0.08)',
                    defaultButtonBorder: 'rgba(255,255,255,0.1)',
                    defaultButtonText: '#f4f4f5',
                  },
                  radii: {
                    borderRadiusButton: '0.625rem',
                    buttonBorderRadius: '0.625rem',
                    inputBorderRadius: '0.625rem',
                  },
                },
              },
            }}
            providers={[]}
            redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/auth/callback`}
          />
        </div>
      </div>
    </div>
  )
}
