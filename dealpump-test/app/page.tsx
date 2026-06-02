import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Project } from '@/lib/types'
import { PromptForm } from './PromptForm'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-3xl font-bold tracking-tight">Landing Page Generator</h1>
          <p className="mt-2 text-gray-400">Describe your product and get a polished landing page in seconds.</p>
        </div>

        {projects && projects.length > 0 && (
          <section className="mb-12">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Your Pages</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(projects as Project[]).map((p) => (
                <Link
                  key={p.id}
                  href={p.status === 'done' ? `/preview/${p.id}` : `/generate/${p.id}`}
                  className="group rounded-lg border border-gray-800 bg-gray-900 p-4 hover:border-indigo-500 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-200 line-clamp-2 flex-1">{p.prompt}</p>
                    <StatusBadge status={p.status} />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <PromptForm />
      </div>
    </main>
  )
}

function StatusBadge({ status }: { status: Project['status'] }) {
  if (status === 'done') return <Badge className="bg-green-900 text-green-300 border-green-800 shrink-0">Done</Badge>
  if (status === 'draft') return <Badge className="bg-yellow-900 text-yellow-300 border-yellow-800 shrink-0">Draft</Badge>
  return <Badge className="bg-gray-800 text-gray-400 border-gray-700 shrink-0">Pending</Badge>
}
