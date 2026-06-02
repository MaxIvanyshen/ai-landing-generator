'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const EXAMPLES = [
  'SaaS time tracker for freelancers',
  'AI interior design tool',
  'B2B invoicing app for agencies',
  'Mobile fitness coaching app',
]

export function PromptForm() {
  const router = useRouter()
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!prompt.trim()) return
    setLoading(true)
    setError('')

    const res = await fetch('/api/generate-draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })

    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setLoading(false)
      return
    }

    router.push(`/generate/${data.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          Describe your product or offer
        </label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. A SaaS tool that helps remote teams track time and bill clients automatically…"
          rows={4}
          disabled={loading}
          className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-slate-900 placeholder:text-slate-400 text-sm focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none transition-colors"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setPrompt(ex)}
            className="text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={loading || !prompt.trim()}
        className="btn-primary w-full text-sm"
      >
        {loading ? (
          <>
            <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            Generating draft…
          </>
        ) : (
          'Generate landing page →'
        )}
      </button>
    </form>
  )
}
