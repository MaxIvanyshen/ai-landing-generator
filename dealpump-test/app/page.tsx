import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Project } from '@/lib/types'
import { PromptForm } from './PromptForm'
import { ProjectGrid } from './ProjectGrid'
import { NavBar } from './NavBar'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar email={user.email ?? ''} />

      <main className="max-w-2xl mx-auto px-4 py-14">
        {/* Hero */}
        <div className="text-center mb-10 relative">
          {/* Subtle radial glow behind heading */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-[200px] rounded-full"
            style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.10) 0%, transparent 70%)' }}
          />
          <h1 className="relative text-3xl sm:text-[2.75rem] font-extrabold tracking-tight leading-tight mb-3 gradient-text">
            Turn ideas into<br />landing pages
          </h1>
          <p className="text-lg text-slate-500 max-w-md mx-auto">
            Describe your product and get a polished, mobile-ready landing page in seconds.
          </p>
        </div>

        {/* Prompt form */}
        <div className="card p-6 mb-10">
          <PromptForm />
        </div>

        {/* Your pages */}
        <section>
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
            Your pages
          </h2>
          <ProjectGrid projects={(projects ?? []) as Project[]} />
        </section>
      </main>
    </div>
  )
}
