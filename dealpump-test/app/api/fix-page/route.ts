import { createClient } from '@/lib/supabase/server'
import { getAI, MODEL } from '@/lib/ai'

export const runtime = 'edge'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, html, feedback } = await req.json()
  if (!id || !html || !feedback) {
    return Response.json({ error: 'id, html, and feedback are required' }, { status: 400 })
  }

  const completion = await getAI().chat.completions.create({
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
  })

  let fixed = completion.choices[0]?.message?.content ?? ''
  fixed = fixed.replace(/^```html\n?/, '').replace(/^```\n?/, '').replace(/\n?```$/, '').trim()

  if (!fixed.includes('<html') && !fixed.includes('<!DOCTYPE')) {
    return Response.json({ error: 'AI did not return valid HTML' }, { status: 422 })
  }

  const { error } = await supabase
    .from('projects')
    .update({ html: fixed })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json({ ok: true })
}
