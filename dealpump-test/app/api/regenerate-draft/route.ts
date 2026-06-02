import { createClient } from '@/lib/supabase/server'
import { ai, MODEL } from '@/lib/ai'
import { buildRegeneratePrompt } from '@/lib/prompts'
import type { Draft } from '@/lib/types'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, draft, feedback, prompt } = await req.json()
  if (!id || !draft || !feedback?.trim()) {
    return Response.json({ error: 'id, draft, and feedback are required' }, { status: 400 })
  }

  const messages = buildRegeneratePrompt(prompt, draft, feedback.trim())

  const completion = await ai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: messages.system },
      { role: 'user', content: messages.user },
    ],
    temperature: 0.7,
  })

  const raw = completion.choices[0]?.message?.content ?? ''
  const cleaned = raw.replace(/^```json\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '').trim()

  let newDraft: Draft
  try {
    newDraft = JSON.parse(cleaned)
  } catch {
    return Response.json({ error: 'AI returned malformed JSON', raw }, { status: 422 })
  }

  if (!Array.isArray(newDraft.sections) || newDraft.sections.length === 0) {
    return Response.json({ error: 'Regenerated draft missing sections', raw }, { status: 422 })
  }

  const { error } = await supabase
    .from('projects')
    .update({ draft: newDraft })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ draft: newDraft })
}
