'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, use, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/app/ToastProvider'

export default function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const toast = useToast()

  const [html, setHtml] = useState('')
  const [draft, setDraft] = useState('')
  const [published, setPublished] = useState(false)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [fixFeedback, setFixFeedback] = useState('')
  const [fixing, setFixing] = useState(false)

  // Auto-switch to mobile view on small screens
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    if (mq.matches) setMobile(true)
    const handler = (e: MediaQueryListEvent) => setMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('projects')
        .select('html, draft, published')
        .eq('id', id)
        .single()
      if (data?.html) setHtml(data.html)
      if (data?.draft) setDraft(data.draft)
      if (data?.published) setPublished(data.published)
      setLoading(false)
    }
    load()
  }, [id, supabase])

  async function regeneratePage() {
    if (!draft || regenerating) return
    setRegenerating(true)
    const res = await fetch('/api/generate-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, draft }),
    })
    if (res.ok) {
      const { data: fresh } = await supabase.from('projects').select('html').eq('id', id).single()
      if (fresh?.html) setHtml(fresh.html)
      toast('Page regenerated')
    } else {
      toast('Regeneration failed', 'error')
    }
    setRegenerating(false)
  }

  async function publishPage() {
    if (publishing || published) return
    setPublishing(true)
    const res = await fetch('/api/publish', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setPublished(true)
      toast('Page published — share link is now live')
    } else {
      toast('Failed to publish', 'error')
    }
    setPublishing(false)
  }

  async function applyFix() {
    if (!fixFeedback.trim() || fixing || !html) return
    setFixing(true)
    const res = await fetch('/api/fix-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, html, feedback: fixFeedback }),
    })
    if (res.ok) {
      const { data: fresh } = await supabase.from('projects').select('html').eq('id', id).single()
      if (fresh?.html) setHtml(fresh.html)
      setFixFeedback('')
      toast('Fixes applied')
    } else {
      const data = await res.json()
      toast(data.error ?? 'Failed to apply fixes', 'error')
    }
    setFixing(false)
  }

  function downloadHtml() {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `landing-page-${id.slice(0, 8)}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  function copyShareLink() {
    navigator.clipboard.writeText(`${window.location.origin}/p/${id}`)
    toast('Share link copied')
  }

  const busy = regenerating || fixing

  const safeHtml = useMemo(() => {
    if (!html) return ''
    const guard = `<script>
(function(){
  document.addEventListener('click', function(e) {
    var el = e.target.closest('a');
    if (!el) return;
    var href = el.getAttribute('href') || '';
    if (!href || href === '#') return;
    if (href.startsWith('#')) {
      e.preventDefault();
      var target = document.getElementById(href.slice(1));
      if (target) target.scrollIntoView({behavior:'smooth'});
      return;
    }
    e.preventDefault();
  }, true);
})();
<\/script>`
    return html.includes('</head>')
      ? html.replace('</head>', guard + '</head>')
      : guard + html
  }, [html])

  return (
    <div className="h-screen flex flex-col bg-slate-50">
      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-white border-b border-slate-100 shadow-sm shrink-0"
      >
        {/* Single row on desktop, two rows on mobile */}
        <div className="max-w-6xl mx-auto px-4">

          {/* Row 1: always visible */}
          <div className="h-12 flex items-center justify-between gap-2">
            <button
              onClick={() => router.push('/')}
              className="text-sm text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">Home</span>
            </button>

            {/* Desktop/Mobile view toggle — hidden on very small, shown from sm */}
            <div className="hidden sm:flex items-center rounded-lg border border-slate-200 overflow-hidden text-xs">
              <button
                onClick={() => setMobile(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${!mobile ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800 bg-white'}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span className="hidden md:inline">Desktop</span>
              </button>
              <button
                onClick={() => setMobile(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${mobile ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800 bg-white'}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <span className="hidden md:inline">Mobile</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {/* Secondary actions — hidden on mobile, shown from md */}
              <div className="hidden md:flex items-center gap-2">
                <button
                  onClick={regeneratePage}
                  disabled={busy || !draft}
                  className="btn-secondary h-8 px-3 text-xs"
                >
                  {regenerating ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                      Regenerating…
                    </span>
                  ) : '↺ Regenerate'}
                </button>
                <button onClick={downloadHtml} disabled={!html} className="btn-secondary h-8 px-3 text-xs">
                  Download HTML
                </button>
              </div>

              {/* Publish / Published — always visible */}
              {published ? (
                <>
                  <button onClick={copyShareLink} className="btn-secondary h-8 px-3 text-xs">
                    Copy link
                  </button>
                  <span className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="hidden sm:inline">Published</span>
                  </span>
                </>
              ) : (
                <button
                  onClick={publishPage}
                  disabled={publishing || !html}
                  className="btn-primary h-8 px-3 text-xs"
                >
                  {publishing ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span className="hidden sm:inline">Publishing…</span>
                    </span>
                  ) : 'Publish'}
                </button>
              )}
            </div>
          </div>

          {/* Row 2: mobile-only secondary actions */}
          <div className="md:hidden flex items-center gap-2 pb-2">
            {/* View toggle on small screens */}
            <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden text-xs sm:hidden">
              <button
                onClick={() => setMobile(false)}
                className={`flex items-center gap-1 px-2.5 py-1.5 transition-colors ${!mobile ? 'bg-indigo-600 text-white' : 'text-slate-500 bg-white'}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={() => setMobile(true)}
                className={`flex items-center gap-1 px-2.5 py-1.5 transition-colors ${mobile ? 'bg-indigo-600 text-white' : 'text-slate-500 bg-white'}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </button>
            </div>

            <button
              onClick={regeneratePage}
              disabled={busy || !draft}
              className="btn-secondary h-7 px-2.5 text-xs"
            >
              {regenerating ? (
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
                  Regenerating…
                </span>
              ) : '↺ Regenerate'}
            </button>

            <button onClick={downloadHtml} disabled={!html} className="btn-secondary h-7 px-2.5 text-xs">
              Download
            </button>
          </div>
        </div>
      </motion.div>

      {/* Preview area */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 overflow-hidden bg-slate-200 flex items-start justify-center relative min-h-0">
          {busy && (
            <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-slate-600 font-medium bg-white border border-slate-200 shadow-sm rounded-lg px-4 py-2.5">
                <span className="w-4 h-4 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                {fixing ? 'Applying fixes…' : 'Regenerating page…'}
              </div>
            </div>
          )}
          {loading ? (
            <div className="w-full h-full bg-slate-200 animate-pulse" />
          ) : safeHtml ? (
            <motion.div
              layout
              transition={{ duration: 0.2 }}
              className={`h-full transition-all duration-300 ${mobile ? 'w-[390px] shadow-xl' : 'w-full'}`}
            >
              <iframe
                srcDoc={safeHtml}
                className="w-full h-full border-0"
                title="Landing page preview"
                sandbox="allow-scripts"
              />
            </motion.div>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400 text-sm">Page not found</div>
          )}
        </div>

        {/* Fix feedback panel */}
        {safeHtml && (
          <div className="bg-white border-t border-slate-100 shrink-0 px-4 py-3">
            <div className="max-w-6xl mx-auto flex items-start gap-3">
              <div className="flex-1">
                <textarea
                  value={fixFeedback}
                  onChange={e => setFixFeedback(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) applyFix()
                  }}
                  placeholder="Describe what to fix — e.g. make the CTA button red, fix nav text contrast…"
                  rows={2}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 placeholder:text-slate-400"
                />
              </div>
              <button
                onClick={applyFix}
                disabled={!fixFeedback.trim() || fixing || !html}
                className="btn-primary px-4 text-sm shrink-0 self-stretch"
              >
                {fixing ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span className="hidden sm:inline">Applying…</span>
                  </span>
                ) : (
                  <>
                    <span className="hidden sm:inline">Apply fixes</span>
                    <span className="sm:hidden">Fix</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
