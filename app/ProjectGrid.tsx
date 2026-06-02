'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Project } from '@/lib/types'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
}

export function ProjectGrid({ projects }: { projects: Project[] }) {
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
      {projects.map((p) => (
        <motion.div key={p.id} variants={item}>
          <Link
            href={p.status === 'done' ? `/preview/${p.id}` : `/generate/${p.id}`}
            className="block bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 group"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm text-slate-700 line-clamp-2 flex-1 group-hover:text-slate-900 transition-colors">{p.prompt}</p>
              <StatusChip status={p.status} published={p.published} />
            </div>
            <p className="text-xs text-slate-400">{new Date(p.created_at).toLocaleDateString()}</p>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )
}

function StatusChip({ status, published }: { status: Project['status']; published: boolean }) {
  if (status === 'done' && published)
    return <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Published</span>
  if (status === 'done')
    return <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">Ready</span>
  if (status === 'draft')
    return <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Draft</span>
  return <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">Pending</span>
}
