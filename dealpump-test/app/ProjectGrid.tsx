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
            className="block bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm text-slate-700 line-clamp-2 flex-1">{p.prompt}</p>
              <StatusChip status={p.status} />
            </div>
            <p className="text-xs text-slate-400">{new Date(p.created_at).toLocaleDateString()}</p>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )
}

function StatusChip({ status }: { status: Project['status'] }) {
  if (status === 'done')
    return <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Done</span>
  if (status === 'draft')
    return <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">Draft</span>
  return <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">Pending</span>
}
