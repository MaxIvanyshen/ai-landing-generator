import { createClient } from '@/lib/supabase/server'
import { getAI, MODEL } from '@/lib/ai'
import { buildPagePrompt } from '@/lib/prompts'

export const maxDuration = 60

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, draft } = await req.json()
  if (!id || !draft) return Response.json({ error: 'id and draft are required' }, { status: 400 })

  // Verify ownership before streaming
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })

  const messages = buildPagePrompt(draft)

  const stream = await getAI().chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: messages.system },
      { role: 'user', content: messages.user },
    ],
    temperature: 0.5,
    stream: true,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content ?? ''
        if (text) controller.enqueue(encoder.encode(text))
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
