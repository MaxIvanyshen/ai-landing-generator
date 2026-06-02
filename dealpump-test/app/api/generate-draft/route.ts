import { createClient } from '@/lib/supabase/server'
import { getAI, MODEL } from '@/lib/ai'
import { buildDraftPrompt } from '@/lib/prompts'
import type { Draft } from '@/lib/types'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { prompt } = await req.json()
  if (!prompt?.trim()) return Response.json({ error: 'Prompt is required' }, { status: 400 })

  const messages = buildDraftPrompt(prompt.trim())

  const completion = await getAI().chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: messages.system },
      { role: 'user', content: messages.user },
    ],
    temperature: 0.7,
  })

  const raw = completion.choices[0]?.message?.content ?? ''
  const cleaned = raw.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '').trim()

  let draft: Draft
  try {
    draft = JSON.parse(cleaned)
  } catch {
    return Response.json({ error: 'AI returned malformed JSON', raw }, { status: 422 })
  }

  if (!Array.isArray(draft.sections) || draft.sections.length === 0) {
    return Response.json({ error: 'Draft missing sections', raw }, { status: 422 })
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({ user_id: user.id, prompt: prompt.trim(), draft, status: 'draft' })
    .select('id')
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ id: data.id, draft })
}
