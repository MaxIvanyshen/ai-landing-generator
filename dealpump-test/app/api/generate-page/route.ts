import { createClient } from '@/lib/supabase/server'
import { getAI, MODEL } from '@/lib/ai'
import { buildPagePrompt } from '@/lib/prompts'

export const runtime = 'edge'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, draft } = await req.json()
  if (!id || !draft) return Response.json({ error: 'id and draft are required' }, { status: 400 })

  const messages = buildPagePrompt(draft)

  const completion = await getAI().chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: messages.system },
      { role: 'user', content: messages.user },
    ],
    temperature: 0.5,
  })

  let html = completion.choices[0]?.message?.content ?? ''
  html = html.replace(/^```html\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '').trim()

  if (!html.includes('<html') && !html.includes('<!DOCTYPE')) {
    return Response.json({ error: 'AI did not return valid HTML' }, { status: 422 })
  }

  const { error } = await supabase
    .from('projects')
    .update({ html, status: 'done' })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ id })
}
