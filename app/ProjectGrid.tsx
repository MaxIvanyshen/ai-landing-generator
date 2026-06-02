'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import type { Project } from '@/lib/types'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
}

export function ProjectGrid({ projects: initial }: { projects: Project[] }) {
  const [projects, setProjects] = useState(initial)

  async function deleteProject(e: React.MouseEvent, id: string) {
    e.preventDefault()
    e.stopPropagation()
    setProjects(prev => prev.filter(p => p.id !== id))
    await fetch('/api/project', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  }

  if (projects.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center justify-center py-14 text-center"
      >
        <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-700 mb-1">No pages yet</p>
        <p className="text-sm text-slate-400">Generate your first landing page above.</p>
      </motion.div>
    )
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
      <AnimatePresence>
        {projects.map((p) => (
          <motion.div
            key={p.id}
            variants={item}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
            layout
          >
            <Link
              href={p.status === 'done' ? `/preview/${p.id}` : `/generate/${p.id}`}
              className="block bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm text-slate-700 line-clamp-2 flex-1 group-hover:text-slate-900 transition-colors">{p.prompt}</p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <StatusChip status={p.status} published={p.published} />
                  <button
                    onClick={e => deleteProject(e, p.id)}
                    title="Delete"
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-red-50 text-slate-300 hover:text-red-500"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-400">{new Date(p.created_at).toLocaleDateString()}</p>
            </Link>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  )
}

function StatusChip({ status, published }: { status: Project['status']; published: boolean }) {
  if (status === 'done' && published)
    return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Published</span>
  if (status === 'done')
    return <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">Ready</span>
  if (status === 'draft')
    return <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Draft</span>
  return <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">Pending</span>
}
