'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LaunchlyLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center">
        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
        </svg>
      </div>
      <span className="text-base font-bold text-slate-900 tracking-tight">Launchly</span>
    </div>
  )
}

export function NavBar({ email }: { email: string }) {
  const router = useRouter()
  const supabase = createClient()

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <LaunchlyLogo />
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400 hidden sm:block">{email}</span>
          <button onClick={signOut} className="text-sm text-slate-500 hover:text-slate-900 transition-colors">
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
