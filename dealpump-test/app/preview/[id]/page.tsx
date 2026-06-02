'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

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
    const url = `${window.location.origin}/p/${id}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="h-screen flex flex-col bg-gray-950">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-gray-800 bg-gray-900 shrink-0">
        <Button
          onClick={() => router.push('/')}
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-white"
        >
          ← Home
        </Button>

        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border border-gray-700 overflow-hidden">
            <button
              onClick={() => setMobile(false)}
              className={`px-3 py-1.5 text-xs transition-colors ${!mobile ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Desktop
            </button>
            <button
              onClick={() => setMobile(true)}
              className={`px-3 py-1.5 text-xs transition-colors ${mobile ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Mobile
            </button>
          </div>

          <Button
            onClick={copyShareLink}
            size="sm"
            variant="outline"
            className="border-gray-700 text-gray-300 hover:border-indigo-500 text-xs"
          >
            {copied ? 'Copied!' : 'Copy link'}
          </Button>

          <Button
            onClick={downloadHtml}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
            disabled={!html}
          >
            Download HTML
          </Button>
        </div>
      </div>

      {/* Preview */}
      <div className="flex-1 overflow-hidden bg-gray-800 flex items-start justify-center">
        {loading ? (
          <Skeleton className="w-full h-full bg-gray-700" />
        ) : html ? (
          <div
            className={`h-full transition-all duration-300 ${
              mobile ? 'w-[390px] shadow-2xl' : 'w-full'
            }`}
          >
            <iframe
              srcDoc={html}
              className="w-full h-full border-0"
              title="Landing page preview"
              sandbox="allow-scripts"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Page not found
          </div>
        )}
      </div>
    </div>
  )
}
