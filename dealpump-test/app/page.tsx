import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Project } from '@/lib/types'
import { PromptForm } from './PromptForm'
import { ProjectGrid } from './ProjectGrid'

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
    <main className="min-h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Hero section with dot grid */}
      <div className="relative dot-grid border-b border-white/[0.06]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-zinc-950 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            AI-Powered
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight gradient-text leading-tight mb-4">
            Turn ideas into<br />landing pages
          </h1>
          <p className="text-lg text-zinc-400 max-w-md mx-auto mb-10">
            Describe your product. Get a polished, mobile-ready landing page in seconds.
          </p>
          <PromptForm />
        </div>
      </div>

      {/* Your pages */}
      {projects && projects.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 py-12">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-5">Your pages</h2>
          <ProjectGrid projects={projects as Project[]} />
        </div>
      )}
    </main>
  )
}
