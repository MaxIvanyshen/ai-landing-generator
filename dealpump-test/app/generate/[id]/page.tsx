'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import { createClient } from '@/lib/supabase/client'
import { Textarea } from '@/components/ui/textarea'

export default function GeneratePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [prompt, setPrompt] = useState('')
  const [draft, setDraft] = useState<string>('')
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
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-zinc-950"
          >
            <div className="absolute inset-0 dot-grid opacity-30" />
            <div className="relative flex flex-col items-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
              <p className="text-lg font-semibold text-white">Building your landing page…</p>
              <p className="text-sm text-zinc-500">This takes 15–30 seconds</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="min-h-screen bg-zinc-950 text-white flex flex-col">
        {/* Top bar */}
        <div className="border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 h-12 flex items-center gap-3">
            <button onClick={() => router.push('/')} className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
              Home
            </button>
            <span className="text-zinc-700">/</span>
            <span className="text-zinc-400 text-sm truncate max-w-xs">{prompt}</span>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold text-zinc-100">Review draft</h1>
            <p className="text-xs text-zinc-600">Edit directly or ask for changes below</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="glass rounded-xl h-96 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-[calc(100vh-280px)] min-h-[400px]">
              {/* Left: markdown preview */}
              <div className="glass rounded-xl overflow-y-auto relative">
                {regenerating && (
                  <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
                    <div className="flex items-center gap-2 text-violet-400 text-sm">
                      <div className="w-4 h-4 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
                      Regenerating…
                    </div>
                  </div>
                )}
                <div className="p-5 draft-prose">
                  <ReactMarkdown>{draft}</ReactMarkdown>
                </div>
              </div>

              {/* Right: raw editor */}
              <div className="flex flex-col gap-2">
                <p className="text-xs text-zinc-600 px-1">Raw markdown — edit directly</p>
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="flex-1 font-mono text-xs bg-white/[0.03] border-white/[0.06] text-zinc-300 focus:border-violet-500/40 resize-none rounded-xl leading-relaxed h-full"
                  spellCheck={false}
                />
              </div>
            </div>
          )}

          {/* Action bar */}
          {!loading && (
            <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-3">
              {prevDraft && (
                <button
                  onClick={() => { setDraft(prevDraft); setPrevDraft(null) }}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  ↩ Undo last regeneration
                </button>
              )}

              <div className="flex gap-2 items-start">
                <input
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); regenerate() } }}
                  placeholder="What should be different? e.g. More aggressive tone, focus on enterprise…"
                  disabled={regenerating}
                  className="flex-1 h-10 px-4 rounded-xl text-sm bg-white/[0.04] border border-white/[0.08] text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-violet-500/50 disabled:opacity-50"
                />
                <button
                  onClick={regenerate}
                  disabled={regenerating || !feedback.trim()}
                  className="h-10 px-4 rounded-xl text-sm border border-white/[0.08] text-zinc-400 hover:border-violet-500/40 hover:text-violet-400 transition-all disabled:opacity-40 shrink-0"
                >
                  Regenerate
                </button>
              </div>

              {apiError && <p className="text-sm text-red-400">{apiError}</p>}

              <button
                onClick={approvePage}
                disabled={!draft || generating}
                className="gradient-btn w-full py-3 rounded-xl text-white text-sm font-semibold"
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
