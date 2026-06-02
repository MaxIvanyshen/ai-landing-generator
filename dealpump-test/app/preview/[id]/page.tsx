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
    <div className="h-screen flex flex-col bg-slate-50">
      <motion.div
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-white border-b border-slate-100 shadow-sm shrink-0"
      >
        <div className="max-w-6xl mx-auto px-4 h-12 flex items-center justify-between gap-3">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Home
          </button>

          <div className="flex items-center gap-2">
            {/* Toggle */}
            <div className="flex items-center rounded-lg border border-slate-200 overflow-hidden text-xs">
              <button
                onClick={() => setMobile(false)}
                className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${!mobile ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800 bg-white'}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Desktop
              </button>
              <button
                onClick={() => setMobile(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${mobile ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-800 bg-white'}`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Mobile
              </button>
            </div>

            <button onClick={copyShareLink} className="btn-secondary h-8 px-3 text-xs">
              {copied ? '✓ Copied' : 'Copy link'}
            </button>

            <button onClick={downloadHtml} disabled={!html} className="btn-primary h-8 px-3 text-xs">
              Download HTML
            </button>
          </div>
        </div>
      </motion.div>

      {/* Preview */}
      <div className="flex-1 overflow-hidden bg-slate-200 flex items-start justify-center">
        {loading ? (
          <div className="w-full h-full bg-slate-200 animate-pulse" />
        ) : html ? (
          <motion.div
            layout
            transition={{ duration: 0.2 }}
            className={`h-full transition-all duration-300 ${mobile ? 'w-[390px] shadow-xl' : 'w-full'}`}
          >
            <iframe
              srcDoc={html}
              className="w-full h-full border-0"
              title="Landing page preview"
              sandbox="allow-scripts"
            />
          </motion.div>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">Page not found</div>
        )}
      </div>
    </div>
  )
}
