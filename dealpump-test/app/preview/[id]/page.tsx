'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'

export default function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [html, setHtml] = useState('')
  const [loading, setLoading] = useState(true)
  const [mobile, setMobile] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('projects').select('html').eq('id', id).single()
      if (data?.html) setHtml(data.html)
      setLoading(false)
    }
    load()
  }, [id, supabase])

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
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="h-screen flex flex-col bg-zinc-950">
      {/* Floating toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between gap-3 px-4 py-2.5 glass border-b border-white/[0.06] shrink-0"
      >
        <button
          onClick={() => router.push('/')}
          className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors flex items-center gap-1.5"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Home
        </button>

        <div className="flex items-center gap-2">
          {/* Mobile/desktop toggle */}
          <div className="flex items-center rounded-lg border border-white/[0.08] overflow-hidden bg-white/[0.03]">
            <button
              onClick={() => setMobile(false)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${!mobile ? 'bg-violet-600/80 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Desktop
            </button>
            <button
              onClick={() => setMobile(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors ${mobile ? 'bg-violet-600/80 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Mobile
            </button>
          </div>

          <button
            onClick={copyShareLink}
            className="px-3 py-1.5 rounded-lg border border-white/[0.08] text-zinc-400 hover:border-violet-500/40 hover:text-violet-400 text-xs transition-all"
          >
            {copied ? '✓ Copied' : 'Copy link'}
          </button>

          <button
            onClick={downloadHtml}
            disabled={!html}
            className="gradient-btn px-3 py-1.5 rounded-lg text-white text-xs font-medium disabled:opacity-40"
          >
            Download HTML
          </button>
        </div>
      </motion.div>

      {/* Preview */}
      <div className="flex-1 overflow-hidden bg-zinc-900 flex items-start justify-center">
        {loading ? (
          <div className="w-full h-full bg-zinc-900 animate-pulse" />
        ) : html ? (
          <motion.div
            layout
            transition={{ duration: 0.25 }}
            className={`h-full transition-all duration-300 ${mobile ? 'w-[390px] shadow-2xl' : 'w-full'}`}
          >
            <iframe
              srcDoc={html}
              className="w-full h-full border-0"
              title="Landing page preview"
              sandbox="allow-scripts"
            />
          </motion.div>
        ) : (
          <div className="flex items-center justify-center h-full text-zinc-600">Page not found</div>
        )}
      </div>
    </div>
  )
}
