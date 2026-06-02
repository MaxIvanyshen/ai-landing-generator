'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  // Uncontrolled input — ref always reflects the real DOM value,
  // including iOS/Android autofill that skips onChange.
  const emailRef = useRef<HTMLInputElement>(null)
  const [sentTo, setSentTo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.push('/')
        router.refresh()
      }
    })
    return () => subscription.unsubscribe()
  }, [router, supabase])

  async function handleSubmit() {
    const value = emailRef.current?.value.trim() ?? ''
    if (!value) return
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithOtp({
      email: value,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })

    if (error) {
      setError(error.message)
    } else {
      setSentTo(value)
    }
    setLoading(false)
  }

  function reset() {
    setSentTo('')
    setError('')
    // Clear the uncontrolled input
    if (emailRef.current) emailRef.current.value = ''
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="card p-8">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                  </svg>
                </div>
                <span className="text-lg font-bold text-slate-900 tracking-tight">Launchly</span>
              </div>
            </div>
            <p className="text-sm text-slate-500">Turn ideas into landing pages</p>
          </div>

          {sentTo ? (
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-semibold text-slate-900">Check your email</p>
              <p className="text-sm text-slate-500">
                We sent a magic link to{' '}
                <span className="font-medium text-slate-700">{sentTo}</span>.
                Click it to sign in.
              </p>
              <button onClick={reset} className="text-xs text-indigo-600 hover:text-indigo-800 transition-colors">
                Use a different email
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email address
                </label>
                <input
                  ref={emailRef}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  defaultValue=""
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="you@example.com"
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-colors"
                />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary w-full text-sm"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Sending…
                  </span>
                ) : 'Continue with email →'}
              </button>

              <p className="text-xs text-center text-slate-400">
                We'll send you a magic link — no password needed.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
