import { createClient } from '@/lib/supabase/server'
import type { Project } from '@/lib/types'
import { PromptForm } from './PromptForm'
import { ProjectGrid } from './ProjectGrid'
import { NavBar } from './NavBar'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return <LandingPage />

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

function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <nav className="border-b border-slate-100 bg-white/90 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
              </svg>
            </div>
            <span className="text-base font-bold text-slate-900 tracking-tight">Launchly</span>
          </div>
          <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            Sign in
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-5 py-20 sm:py-28 relative overflow-hidden">
        {/* Background glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-[400px]"
          style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.12) 0%, transparent 70%)' }}
        />
        <div className="relative">
          <span className="inline-block text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 mb-6 tracking-wide uppercase">
            AI-powered · No design skills needed
          </span>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.08] mb-5 gradient-text">
            Turn your idea into a<br className="hidden sm:block" /> landing page in seconds
          </h1>
          <p className="text-lg sm:text-xl text-slate-500 max-w-xl mx-auto mb-9 leading-relaxed">
            Describe your product. AI builds a polished, mobile-ready page.<br className="hidden sm:block" />
            Publish with one click and share your link instantly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login" className="btn-primary text-base px-7 py-3">
              Get started — it&apos;s free
            </Link>
            <Link href="/login" className="btn-secondary text-base px-7 py-3">
              Sign in →
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 border-y border-slate-100 py-16 px-5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest text-center mb-10">
            How it works
          </h2>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Describe',
                body: 'Write a few sentences about your product or idea — what it does, who it\'s for.',
              },
              {
                step: '02',
                title: 'Generate',
                body: 'AI builds a complete, styled landing page in seconds. No templates, no fiddling.',
              },
              {
                step: '03',
                title: 'Publish',
                body: 'Review, tweak if needed, then publish. Your page is live with a shareable link.',
              },
            ].map(({ step, title, body }) => (
              <div key={step} className="flex flex-col gap-3">
                <span className="text-3xl font-extrabold text-indigo-100 leading-none">{step}</span>
                <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest text-center mb-10">
            Why Launchly
          </h2>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              {
                icon: (
                  <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                ),
                title: 'Ready in seconds',
                body: 'No design skills or templates required. From idea to live page in under a minute.',
              },
              {
                icon: (
                  <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                ),
                title: 'Mobile-first',
                body: 'Every page looks great on phone, tablet, and desktop — without any extra work.',
              },
              {
                icon: (
                  <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                ),
                title: 'Publish anywhere',
                body: 'One-click publish gives you a shareable link. Download the HTML to host it yourself.',
              },
            ].map(({ icon, title, body }) => (
              <div key={title} className="card p-5 flex flex-col gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center">
                  {icon}
                </div>
                <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="bg-slate-900 py-14 px-5 text-center">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-3 tracking-tight">
          Ready to launch?
        </h2>
        <p className="text-slate-400 mb-7 text-base">
          Get your first landing page live in under a minute.
        </p>
        <Link href="/login" className="btn-primary text-base px-8 py-3 inline-flex">
          Get started — it&apos;s free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-6 px-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-700">Launchly</span>
          </div>
          <p className="text-xs text-slate-400">Built with AI. No designers harmed.</p>
          <Link href="/login" className="text-xs text-slate-400 hover:text-slate-700 transition-colors">
            Sign in
          </Link>
        </div>
      </footer>
    </div>
  )
}
