'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Textarea } from '@/components/ui/textarea'

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
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <Textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your product… e.g. A SaaS tool that helps remote teams track time and bill clients automatically"
        className="min-h-[100px] bg-white/[0.04] border-white/[0.08] text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500/60 focus:ring-1 focus:ring-violet-500/30 resize-none rounded-xl text-sm"
        disabled={loading}
      />

      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setPrompt(ex)}
            className="text-xs px-3 py-1.5 rounded-full border border-white/[0.07] text-zinc-500 hover:border-violet-500/40 hover:text-violet-400 transition-all duration-150"
          >
            {ex}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading || !prompt.trim()}
        className="gradient-btn w-full sm:w-auto px-6 py-2.5 rounded-xl text-white text-sm font-medium"
      >
        {loading ? (
          <span className="flex items-center gap-2 justify-center">
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating draft…
          </span>
        ) : (
          'Generate landing page →'
        )}
      </button>
    </form>
  )
}
