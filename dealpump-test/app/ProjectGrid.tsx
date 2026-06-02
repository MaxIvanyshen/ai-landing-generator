'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { Project } from '@/lib/types'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
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
            className="block glass rounded-xl p-4 card-glow transition-all duration-200"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="text-sm text-zinc-200 line-clamp-2 flex-1">{p.prompt}</p>
              <StatusDot status={p.status} />
            </div>
            <p className="text-xs text-zinc-600">{new Date(p.created_at).toLocaleDateString()}</p>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  )
}

function StatusDot({ status }: { status: Project['status'] }) {
  if (status === 'done')
    return <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">Done</span>
  if (status === 'draft')
    return <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">Draft</span>
  return <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-zinc-700/50 text-zinc-500 border border-zinc-700">Pending</span>
}
