'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { createClient } from '@/lib/supabase/client'

type Tab = 'preview' | 'editor'

export default function GeneratePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [prompt, setPrompt] = useState('')
  const [draft, setDraft] = useState('')
  const [prevDraft, setPrevDraft] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [apiError, setApiError] = useState('')
  const [tab, setTab] = useState<Tab>('preview')

  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('projects').select('*').eq('id', id).single()
      if (data) {
        setPrompt(data.prompt)
        setDraft(data.draft ?? '')
      }
      setLoading(false)
    }
    load()
  }, [id, supabase])

  async function regenerate() {
    if (!draft || !feedback.trim()) return
    setRegenerating(true)
    setApiError('')
    setPrevDraft(draft)

    const res = await fetch('/api/regenerate-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, draft, feedback, prompt }),
    })
    const data = await res.json()
    setRegenerating(false)
    if (!res.ok) { setApiError(data.error ?? 'Regeneration failed'); return }
    setDraft(data.draft)
    setFeedback('')
  }

  async function approvePage() {
    if (!draft) return
    setGenerating(true)
    setApiError('')

    try {
      const res = await fetch('/api/generate-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, draft }),
      })

      if (!res.ok) {
        const data = await res.json()
        setApiError(data.error ?? 'Generation failed')
        setGenerating(false)
        return
      }

      // fetch has resolved — React has re-rendered and the iframe is now in the DOM
      const doc = iframeRef.current?.contentDocument
      if (doc) doc.open()

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let html = ''
      let fenceStripped = false
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        html += chunk

        if (!fenceStripped) {
          buffer += chunk
          // Wait until we have enough chars to detect ```html\n (8 chars)
          if (buffer.length >= 8) {
            fenceStripped = true
            const clean = buffer.replace(/^```html\n?/, '').replace(/^```\n?/, '')
            doc?.write(clean)
            buffer = ''
          }
        } else {
          doc?.write(chunk)
        }
      }

      doc?.close()

      html = html.replace(/^```html\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '').trim()

      if (!html.includes('<html') && !html.includes('<!DOCTYPE')) {
        setApiError('AI returned invalid HTML — try again')
        setGenerating(false)
        return
      }

      await supabase.from('projects').update({ html, status: 'done' }).eq('id', id)
      router.push(`/preview/${id}`)
    } catch {
      setApiError('Network error — check your connection and try again')
      setGenerating(false)
    }
  }

  return (
    <>
      {/* Live render overlay — same layout as the preview page, buttons disabled */}
      <AnimatePresence>
        {generating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col bg-slate-50"
          >
            {/* Toolbar — mirrors preview/[id] exactly, everything disabled */}
            <div className="bg-white border-b border-slate-100 shadow-sm shrink-0">
              <div className="max-w-6xl mx-auto px-3 h-12 flex items-center gap-2">
                {/* Back — disabled during generation */}
                <button disabled className="text-sm text-slate-300 flex items-center gap-1 shrink-0 cursor-not-allowed">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>

                {/* View toggle — disabled */}
                <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden text-xs shrink-0 opacity-40">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-indigo-600 text-white">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="hidden md:inline">Desktop</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-slate-500 bg-white">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="hidden md:inline">Mobile</span>
                  </div>
                </div>

                {/* Secondary action stubs — disabled */}
                <button disabled className="btn-secondary h-8 px-2.5 text-xs shrink-0 opacity-40 cursor-not-allowed">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden sm:inline">Regenerate</span>
                </button>
                <button disabled className="btn-secondary h-8 px-2.5 text-xs shrink-0 opacity-40 cursor-not-allowed">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="hidden sm:inline">Download</span>
                </button>

                {/* Generating indicator — where Publish lives */}
                <div className="flex items-center gap-2 h-8 px-3 rounded-lg bg-indigo-50 border border-indigo-100 text-xs font-medium text-indigo-600 shrink-0 ml-auto">
                  <span className="w-3 h-3 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  Generating…
                </div>
              </div>
            </div>

            {/* Live iframe fills the rest */}
            <iframe
              ref={iframeRef}
              className="flex-1 w-full border-0 bg-white"
              title="Live generation preview"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Top nav */}
        <div className="bg-white border-b border-slate-100 sticky top-0 z-10 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 h-12 flex items-center gap-2 text-sm">
            <button onClick={() => router.push('/')} className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors shrink-0">
              Launchly
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500 truncate">{prompt}</span>
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-4 sm:py-6 flex flex-col min-h-0">

          {/* Mobile tab bar */}
          <div className="flex lg:hidden items-center justify-between mb-3">
            <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-medium">
              <button
                onClick={() => setTab('preview')}
                className={`px-4 py-2 transition-colors ${tab === 'preview' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}
              >
                Preview
              </button>
              <button
                onClick={() => setTab('editor')}
                className={`px-4 py-2 transition-colors ${tab === 'editor' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}
              >
                Editor
              </button>
            </div>
            <p className="text-xs text-slate-400">Edit or approve below</p>
          </div>

          {/* Desktop header */}
          <div className="hidden lg:flex items-center justify-between mb-4">
            <h1 className="text-base font-semibold text-slate-900">Review your draft</h1>
            <p className="text-xs text-slate-400">Edit the markdown or ask for changes below</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[0, 1].map((i) => (
                <div key={i} className="card h-64 sm:h-96 animate-pulse bg-slate-100" />
              ))}
            </div>
          ) : (
            <>
              {/* Desktop: both panels side by side */}
              <div
                className="hidden lg:grid grid-cols-2 gap-4"
                style={{ height: 'calc(100vh - 260px)', minHeight: 400 }}
              >
                <div className="card overflow-y-auto relative">
                  {regenerating && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
                      <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium">
                        <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                        Regenerating…
                      </div>
                    </div>
                  )}
                  <div className="p-5 draft-prose">
                    <ReactMarkdown>{draft}</ReactMarkdown>
                  </div>
                </div>
                <div className="card flex flex-col overflow-hidden">
                  <div className="px-4 pt-3 pb-2 border-b border-slate-100">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Markdown editor</p>
                  </div>
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className="flex-1 font-mono text-xs text-slate-700 bg-slate-50 p-4 resize-none focus:outline-none focus:bg-white transition-colors leading-relaxed"
                    spellCheck={false}
                  />
                </div>
              </div>

              {/* Mobile: single active panel */}
              <div className="lg:hidden" style={{ height: 'calc(100vh - 320px)', minHeight: 280 }}>
                {tab === 'preview' ? (
                  <div className="card h-full overflow-y-auto relative">
                    {regenerating && (
                      <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
                        <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium">
                          <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                          Regenerating…
                        </div>
                      </div>
                    )}
                    <div className="p-4 draft-prose">
                      <ReactMarkdown>{draft}</ReactMarkdown>
                    </div>
                  </div>
                ) : (
                  <div className="card h-full flex flex-col overflow-hidden">
                    <div className="px-4 pt-3 pb-2 border-b border-slate-100">
                      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Markdown editor</p>
                    </div>
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      className="flex-1 font-mono text-xs text-slate-700 bg-slate-50 p-4 resize-none focus:outline-none focus:bg-white transition-colors leading-relaxed"
                      spellCheck={false}
                    />
                  </div>
                )}
              </div>
            </>
          )}

          {/* Action bar */}
          {!loading && (
            <div className="mt-4 pt-4 border-t border-slate-200 space-y-3">
              {prevDraft && (
                <button
                  onClick={() => { setDraft(prevDraft); setPrevDraft(null) }}
                  className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
                >
                  ↩ Undo last regeneration
                </button>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); regenerate() } }}
                  placeholder="What should be different? e.g. More aggressive tone, focus on enterprise…"
                  disabled={regenerating}
                  className="flex-1 h-9 px-3.5 rounded-lg text-sm border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-50 transition-colors"
                />
                <button
                  onClick={regenerate}
                  disabled={regenerating || !feedback.trim()}
                  className="btn-secondary h-9 px-4 text-sm shrink-0"
                >
                  Regenerate
                </button>
              </div>

              {apiError && <p className="text-sm text-red-500">{apiError}</p>}

              <button
                onClick={approvePage}
                disabled={!draft || generating}
                className="btn-primary w-full text-sm"
              >
                Approve &amp; Generate Page →
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
