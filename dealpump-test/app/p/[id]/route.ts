import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('projects')
    .select('html')
    .eq('id', id)
    .single()

  if (error || !data?.html) {
    return new Response('Page not found', { status: 404 })
  }

  return new Response(data.html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
