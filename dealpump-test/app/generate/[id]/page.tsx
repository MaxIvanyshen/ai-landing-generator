'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { createClient } from '@/lib/supabase/client'

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

    const res = await fetch('/api/generate-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, draft }),
    })
    const data = await res.json()
    if (!res.ok) { setApiError(data.error ?? 'Generation failed'); setGenerating(false); return }
    router.push(`/preview/${data.id}`)
  }

  return (
    <>
      <AnimatePresence>
        {generating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-indigo-600 animate-spin" />
              <p className="text-lg font-semibold text-slate-900">Building your landing page…</p>
              <p className="text-sm text-slate-400">This takes 15–30 seconds</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-slate-50 flex flex-col">
        {/* Top nav */}
        <div className="bg-white border-b border-slate-100 sticky top-0 z-10 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 h-12 flex items-center gap-2 text-sm">
            <button onClick={() => router.push('/')} className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors">
              Launchly
            </button>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500 truncate max-w-xs">{prompt}</span>
          </div>
        </div>

        {/* Main */}
        <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-base font-semibold text-slate-900">Review your draft</h1>
            <p className="text-xs text-slate-400">Edit the markdown or ask for changes below</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[0, 1].map((i) => (
                <div key={i} className="card h-96 animate-pulse bg-slate-100" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ height: 'calc(100vh - 260px)', minHeight: 400 }}>
              {/* Left: preview */}
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

              {/* Right: editor */}
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

              <div className="flex gap-2">
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
                  className="btn-secondary h-9 px-4 text-sm"
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
