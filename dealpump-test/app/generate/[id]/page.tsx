'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Draft, Section } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'

const SECTION_LABELS: Record<string, string> = {
  hero: 'HERO',
  features: 'FEATURES',
  social_proof: 'SOCIAL PROOF',
  cta: 'CTA',
}

export default function GeneratePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [prompt, setPrompt] = useState('')
  const [draft, setDraft] = useState<Draft | null>(null)
  const [prevDraft, setPrevDraft] = useState<Draft | null>(null)
  const [editorValue, setEditorValue] = useState('')
  const [editorError, setEditorError] = useState('')
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
        setDraft(data.draft)
        setEditorValue(JSON.stringify(data.draft, null, 2))
      }
      setLoading(false)
    }
    load()
  }, [id, supabase])

  function applyEditor() {
    setEditorError('')
    try {
      const parsed = JSON.parse(editorValue)
      if (!Array.isArray(parsed.sections)) throw new Error('sections must be an array')
      setDraft(parsed)
    } catch (e) {
      setEditorError((e as Error).message)
    }
  }

  function syncEditorFromDraft(d: Draft) {
    setDraft(d)
    setEditorValue(JSON.stringify(d, null, 2))
  }

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
    syncEditorFromDraft(data.draft)
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

  if (generating) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white gap-4">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-lg font-medium">Building your landing page…</p>
        <p className="text-sm text-gray-400">This takes 15–30 seconds</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold">Review Draft</h1>
            <p className="text-sm text-gray-400 mt-1 line-clamp-1">{prompt}</p>
          </div>
          <Button
            onClick={() => router.push('/')}
            variant="ghost"
            className="text-gray-400 hover:text-white"
          >
            ← Back
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-3">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 bg-gray-800" />)}</div>
            <Skeleton className="h-96 bg-gray-800" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Plan list */}
            <div className="space-y-3 relative">
              {regenerating && (
                <div className="absolute inset-0 bg-gray-950/70 rounded-lg flex items-center justify-center z-10">
                  <div className="flex items-center gap-2 text-indigo-400">
                    <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Regenerating…</span>
                  </div>
                </div>
              )}
              {draft?.sections.map((section, i) => (
                <SectionCard key={i} section={section} />
              ))}
              {draft && (
                <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 text-xs text-gray-400 space-y-1">
                  <div><span className="text-gray-500">Palette:</span> {draft.palette}</div>
                  <div><span className="text-gray-500">Style:</span> {draft.style}</div>
                </div>
              )}
            </div>

            {/* Right: Editor */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-300">Edit JSON directly</p>
                <Button
                  onClick={applyEditor}
                  size="sm"
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:border-indigo-500 hover:text-indigo-400"
                >
                  Apply
                </Button>
              </div>
              {editorError && <p className="text-xs text-red-400">{editorError}</p>}
              <Textarea
                value={editorValue}
                onChange={(e) => setEditorValue(e.target.value)}
                className="min-h-[400px] font-mono text-xs bg-gray-900 border-gray-700 text-gray-200 focus:border-indigo-500 resize-y"
                spellCheck={false}
              />
            </div>
          </div>
        )}

        {!loading && (
          <div className="mt-8 space-y-4 border-t border-gray-800 pt-6">
            {prevDraft && (
              <Button
                onClick={() => { syncEditorFromDraft(prevDraft); setPrevDraft(null) }}
                variant="ghost"
                size="sm"
                className="text-gray-400 hover:text-white"
              >
                ↩ Undo last regeneration
              </Button>
            )}

            <div className="flex gap-3 items-start flex-col sm:flex-row">
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="What should be different? e.g. Make it more aggressive, focus on enterprise buyers…"
                className="flex-1 min-h-[60px] bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-indigo-500 resize-none text-sm"
                disabled={regenerating}
              />
              <Button
                onClick={regenerate}
                disabled={regenerating || !feedback.trim()}
                variant="outline"
                className="border-gray-700 text-gray-300 hover:border-indigo-500 hover:text-indigo-400 shrink-0"
              >
                {regenerating ? 'Regenerating…' : 'Regenerate'}
              </Button>
            </div>

            {apiError && <p className="text-sm text-red-400">{apiError}</p>}

            <Button
              onClick={approvePage}
              disabled={!draft || generating}
              className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              Approve &amp; Generate Page →
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

function SectionCard({ section }: { section: Section }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Badge className="bg-indigo-900/50 text-indigo-300 border-indigo-800 text-xs">
          {SECTION_LABELS[section.type] ?? section.type.toUpperCase()}
        </Badge>
      </div>
      <p className="font-semibold text-white text-sm">{section.heading}</p>
      {section.subheading && <p className="text-sm text-gray-300">{section.subheading}</p>}
      {section.cta && <p className="text-xs text-indigo-400">CTA: {section.cta}</p>}
      {section.items && section.items.length > 0 && (
        <ul className="text-xs text-gray-400 space-y-1 pl-3">
          {section.items.map((item, i) => <li key={i} className="list-disc">{item}</li>)}
        </ul>
      )}
      <p className="text-xs text-gray-500 italic border-t border-gray-800 pt-2">
        Visual: {section.visual}
      </p>
    </div>
  )
}
