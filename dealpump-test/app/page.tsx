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

      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 mb-3">
            Turn ideas into landing pages
          </h1>
          <p className="text-lg text-slate-500">
            Describe your product and get a polished, mobile-ready landing page in seconds.
          </p>
        </div>

        {/* Prompt form */}
        <div className="card p-6 mb-10">
          <PromptForm />
        </div>

        {/* Your pages */}
        {projects && projects.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
              Your pages
            </h2>
            <ProjectGrid projects={projects as Project[]} />
          </section>
        )}
      </main>
    </div>
  )
}
