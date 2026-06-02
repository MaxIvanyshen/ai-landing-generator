'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const EXAMPLES = [
  'SaaS time tracker for freelancers',
  'AI interior design tool for homeowners',
  'B2B invoicing app for small agencies',
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
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Describe your product or offer
        </label>
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. A SaaS tool that helps remote teams track time and bill clients automatically..."
          className="min-h-[120px] bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:border-indigo-500 resize-none"
          disabled={loading}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => setPrompt(ex)}
            className="text-xs px-3 py-1.5 rounded-full border border-gray-700 text-gray-400 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
          >
            {ex}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button
        type="submit"
        disabled={loading || !prompt.trim()}
        className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white"
      >
        {loading ? 'Generating draft…' : 'Generate landing page'}
      </Button>
    </form>
  )
}
