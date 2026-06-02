'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, use, useMemo, useRef } from 'react'
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
    try {
      const res = await fetch('/api/generate-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, draft }),
      })
      if (!res.ok) { toast('Regeneration failed', 'error'); setRegenerating(false); return }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let newHtml = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        newHtml += decoder.decode(value, { stream: true })
      }
      newHtml = newHtml.replace(/^```html\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '').trim()

      await supabase.from('projects').update({ html: newHtml }).eq('id', id)
      setHtml(newHtml)
      toast('Page regenerated')
    } catch {
      toast('Network error — try again', 'error')
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

  async function unpublishPage() {
    if (publishing || !published) return
    setPublishing(true)
    const res = await fetch('/api/publish', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setPublished(false)
      toast('Page unpublished — share link is now offline')
    } else {
      toast('Failed to unpublish', 'error')
    }
    setPublishing(false)
  }

  async function applyFix() {
    if (!fixFeedback.trim() || fixing || !html) return
    setFixing(true)
    try {
      const res = await fetch('/api/fix-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, html, feedback: fixFeedback }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast(data.error ?? 'Failed to apply fixes', 'error')
        setFixing(false)
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let fixed = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fixed += decoder.decode(value, { stream: true })
      }
      fixed = fixed.replace(/^```html\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '').trim()

      if (!fixed.includes('<html') && !fixed.includes('<!DOCTYPE')) {
        toast('AI returned invalid HTML — try again', 'error')
        setFixing(false)
        return
      }

      await supabase.from('projects').update({ html: fixed }).eq('id', id)
      setHtml(fixed)
      setFixFeedback('')
      toast('Fixes applied')
    } catch {
      toast('Network error — try again', 'error')
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

  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 })
  useEffect(() => {
    if (!containerRef.current) return
    const obs = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      setContainerSize({ w: width, h: height })
    })
    obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  const DESKTOP_W = 1280
  const desktopScale = containerSize.w > 0 ? containerSize.w / DESKTOP_W : 1

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
      {/* Toolbar — single row always */}
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-white border-b border-slate-100 shadow-sm shrink-0"
      >
        <div className="max-w-6xl mx-auto px-3 h-12 flex items-center gap-2">
          {/* Back */}
          <button
            onClick={() => router.push('/')}
            className="text-sm text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden text-xs shrink-0">
            <button
              onClick={() => setMobile(false)}
              title="Desktop view"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 transition-colors ${!mobile ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800 bg-white'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="hidden md:inline">Desktop</span>
            </button>
            <button
              onClick={() => setMobile(true)}
              title="Mobile view"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 transition-colors ${mobile ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800 bg-white'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span className="hidden md:inline">Mobile</span>
            </button>
          </div>

          {/* Secondary actions */}
          <button
            onClick={regeneratePage}
            disabled={busy || !draft}
            title="Regenerate"
            className="btn-secondary h-8 px-2.5 text-xs shrink-0"
          >
            {regenerating
              ? <span className="w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
              : <><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg><span className="hidden sm:inline">Regenerate</span></>
            }
          </button>

          <button onClick={downloadHtml} disabled={!html} title="Download HTML" className="btn-secondary h-8 px-2.5 text-xs shrink-0">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">Download</span>
          </button>

          {/* Primary: Publish / Published + Copy */}
          {published ? (
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={copyShareLink} title="Copy share link" className="btn-secondary h-8 px-2.5 text-xs">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="hidden sm:inline">Copy link</span>
              </button>
              <button
                onClick={unpublishPage}
                disabled={publishing}
                title="Unpublish"
                className="btn-secondary h-8 px-2.5 text-xs text-red-600 border-red-200 hover:border-red-400 hover:text-red-700"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                <span className="hidden sm:inline">Unpublish</span>
              </button>
            </div>
          ) : (
            <button
              onClick={publishPage}
              disabled={publishing || !html}
              className="btn-primary h-8 px-3 text-xs shrink-0"
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
      </motion.div>

      {/* Preview area */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div ref={containerRef} className="flex-1 overflow-hidden bg-slate-200 relative min-h-0">
          {busy && (
            <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-slate-600 font-medium bg-white border border-slate-200 shadow-sm rounded-lg px-4 py-2.5">
                <span className="w-4 h-4 border-2 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                {fixing ? 'Applying fixes…' : 'Regenerating page…'}
              </div>
            </div>
          )}
          {loading ? (
            <div className="w-full h-full animate-pulse" />
          ) : safeHtml ? mobile ? (
            /* Mobile mode: 390px centered phone frame */
            <div className="absolute inset-0 flex justify-center">
              <div className="w-[390px] h-full shadow-2xl">
                <iframe srcDoc={safeHtml} className="w-full h-full border-0" title="Landing page preview" sandbox="allow-scripts" />
              </div>
            </div>
          ) : (
            /* Desktop mode: rendered at 1280px, scaled to fit — gray space top/bottom */
            <div
              className="absolute left-1/2 top-1/2"
              style={{
                width: DESKTOP_W,
                height: containerSize.h / desktopScale,
                transform: `translate(-50%, -50%) scale(${desktopScale})`,
                transformOrigin: 'center center',
              }}
            >
              <iframe srcDoc={safeHtml} className="w-full h-full border-0" title="Landing page preview" sandbox="allow-scripts" />
            </div>
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
