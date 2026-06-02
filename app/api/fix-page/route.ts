import { createClient } from '@/lib/supabase/server'
import { getAI, MODEL } from '@/lib/ai'

export const maxDuration = 60

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, html, feedback } = await req.json()
  if (!id || !html || !feedback) {
    return Response.json({ error: 'id, html, and feedback are required' }, { status: 400 })
  }

  // Verify ownership before streaming
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 })

  const stream = await getAI().chat.completions.create({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: `You are an expert frontend developer. The user has a landing page and wants specific fixes applied. Apply ONLY the requested changes to the HTML and return the complete corrected HTML file. Keep everything else identical. Return ONLY the HTML, no markdown fences, no explanation.`,
      },
      {
        role: 'user',
        content: `Here is the current HTML:\n\n${html}\n\nApply this fix: ${feedback}`,
      },
    ],
    temperature: 0.3,
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
