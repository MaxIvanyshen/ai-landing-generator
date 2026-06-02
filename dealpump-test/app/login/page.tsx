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
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-white">Landing Page Generator</h1>
          <p className="mt-2 text-sm text-gray-400">Sign in to create and manage your pages</p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#6366f1',
                  brandAccent: '#4f46e5',
                  inputBackground: '#1f2937',
                  inputText: '#f9fafb',
                  inputBorder: '#374151',
                  inputBorderFocus: '#6366f1',
                  inputLabelText: '#9ca3af',
                  messageText: '#f9fafb',
                  anchorTextColor: '#6366f1',
                  dividerBackground: '#374151',
                },
              },
            },
          }}
          providers={[]}
          redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/auth/callback`}
        />
      </div>
    </div>
  )
}
