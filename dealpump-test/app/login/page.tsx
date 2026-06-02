'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase/client'

function LaunchlyLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
        </svg>
      </div>
      <span className="text-lg font-bold text-slate-900 tracking-tight">Launchly</span>
    </div>
  )
}

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="card p-8">
          <div className="mb-7 text-center">
            <div className="flex justify-center mb-4">
              <LaunchlyLogo />
            </div>
            <p className="text-sm text-slate-500">Turn ideas into landing pages</p>
          </div>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#4F46E5',
                    brandAccent: '#4338CA',
                    inputBackground: '#ffffff',
                    inputText: '#0F172A',
                    inputBorder: '#E2E8F0',
                    inputBorderFocus: '#6366F1',
                    inputLabelText: '#64748B',
                    messageText: '#334155',
                    anchorTextColor: '#4F46E5',
                    dividerBackground: '#E2E8F0',
                    defaultButtonBackground: '#F8FAFC',
                    defaultButtonBackgroundHover: '#F1F5F9',
                    defaultButtonBorder: '#E2E8F0',
                    defaultButtonText: '#334155',
                  },
                  radii: {
                    borderRadiusButton: '0.5rem',
                    buttonBorderRadius: '0.5rem',
                    inputBorderRadius: '0.5rem',
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
