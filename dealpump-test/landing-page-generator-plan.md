# AI Landing Page Generator — Build Plan

> Test task · 6-hour limit · Next.js + TypeScript + Supabase + Vercel

---

## Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 15 + TypeScript | App Router, server actions, zero-config Vercel deploy |
| Hosting | Vercel | Instant deploys, no Dockerfile, free tier is enough |
| Database | Supabase | One table, shareable project IDs, easy setup |
| Auth | Supabase Auth + `@supabase/ssr` | Session handling, RLS, prebuilt UI component |
| AI | Anthropic SDK (`claude-sonnet-4-5`) | Direct, no abstraction overhead |
| Styling | Tailwind + shadcn/ui | Fast, polished, mobile-first out of the box |
| Preview | `iframe srcdoc` + `/p/[id]` route | Isolated rendering + real shareable URL |

---

## Generation Pipeline

```
Prompt input → Call 1: draft JSON → User review + edit + refine → Call 2: final HTML → Live preview
```

### Call 1 — Draft generation
**Input:** user prompt  
**Output:** structured JSON

```json
{
  "sections": [
    {
      "type": "hero",
      "heading": "...",
      "subheading": "...",
      "cta": "...",
      "visual": "dark bg, bold type, large headline"
    },
    { "type": "features", "heading": "...", "items": [...], "visual": "..." },
    { "type": "social_proof", "heading": "...", "items": [...], "visual": "..." },
    { "type": "cta", "heading": "...", "subheading": "...", "cta": "...", "visual": "..." }
  ],
  "palette": "midnight + electric blue",
  "style": "minimal dark SaaS"
}
```

### Call 1b — Regenerate draft (optional, repeatable)
**Input:** original prompt + current draft JSON + user feedback text  
**Output:** updated draft JSON in same structure  
**Prompt pattern:**
```
Original prompt: [...]
Current draft: [JSON]
User feedback: "[e.g. make it more aggressive, focus on enterprise buyers]"

Update the draft based on the feedback. Return the same JSON structure.
```

### Call 2 — Final HTML generation
**Input:** approved (and possibly edited/regenerated) draft JSON  
**Output:** single self-contained HTML file  

**System prompt instructions:**
- Single self-contained HTML file — no external dependencies except CDN
- Tailwind v4 play CDN (`<script src="https://cdn.tailwindcss.com">`)
- Google Fonts via `<link>` tag
- Inline SVGs only — no `<img>` tags
- Mobile-first responsive layout
- Smooth scroll, subtle CSS animations
- Real copy — no Lorem ipsum
- Return ONLY the HTML, no markdown fences, no explanation

---

## Auth

### Setup
- Package: `@supabase/ssr` for session handling across server/client
- Provider: **Magic link** (fastest to set up) or Google OAuth
- Login UI: `@supabase/auth-ui-react` prebuilt component on `/login` — no custom form needed

### Protected vs public routes
- Protected (require login): `/`, `/generate/[id]`, `/preview/[id]`
- Public (no auth): `/p/[id]` — this is the shareable landing page URL

### Middleware

```ts
// middleware.ts
import { createMiddlewareClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const { data: { session } } = await supabase.auth.getSession()

  const isPublic = req.nextUrl.pathname.startsWith('/p/')
  const isAuth = req.nextUrl.pathname === '/login'

  if (!session && !isPublic && !isAuth) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return res
}
```

### RLS policy
One policy locks the projects table down — no manual auth checks needed in API routes. Pass the user's session cookie and Supabase enforces ownership automatically.

### Home page update
With auth, `/` shows a "your pages" list — fetch all projects for `auth.uid()` ordered by `created_at desc`. Simple card grid above the prompt input. Gives the app a real product feel with minimal extra work.

---

## Supabase Schema

```sql
create table projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  prompt      text not null,
  draft       jsonb,          -- sections array + palette + style
  html        text,           -- final generated HTML string
  status      text default 'pending',  -- pending | draft | approved | done
  created_at  timestamptz default now()
);

alter table projects enable row level security;

create policy "users see own projects" on projects
  for all using (auth.uid() = user_id);
```

---

## File Structure

```
app/
  page.tsx                      ← prompt input + "your pages" list
  login/
    page.tsx                    ← Supabase auth UI component
  generate/[id]/
    page.tsx                    ← draft review + edit + refine
  preview/[id]/
    page.tsx                    ← iframe preview + share toolbar
  p/[id]/
    route.ts                    ← returns raw HTML (public shareable page)

lib/
  prompts.ts                    ← all AI prompt templates
  supabase.ts                   ← supabase client (server + browser)
  types.ts                      ← shared TypeScript types

middleware.ts                   ← auth route protection

app/api/
  generate-draft/route.ts       ← Call 1
  regenerate-draft/route.ts     ← Call 1b
  generate-page/route.ts        ← Call 2
```

---

## Pages

### `/login` — Auth
- Supabase `<Auth>` component from `@supabase/auth-ui-react`
- Magic link or Google OAuth
- Redirect to `/` on success

### `/` — Prompt input + your pages
- "Your pages" card grid at top — all projects for current user, ordered by newest first, each card shows prompt truncated + status badge + link to preview
- Large textarea with placeholder below
- Example prompt chips (click to fill): "SaaS time tracker for freelancers", "AI interior design tool", "B2B invoicing app"
- One primary button: "Generate landing page"
- On submit → POST `/api/generate-draft` → save to Supabase with `user_id` → redirect to `/generate/[id]`

### `/generate/[id]` — Draft review
The core product interaction. Three layers of user control:

**1. Inline editing**
- Each section renders as a card: type badge, heading, copy, visual direction note
- Pencil icon on hover → turns heading/subheading/CTA into editable inputs on click
- Editing updates local React state only — no DB call until approve

**2. Refinement input**
- Text field at the bottom of the page: "What should be different?"
- "Regenerate" button → POST `/api/regenerate-draft` with current draft + feedback
- While regenerating: keep current cards visible, show loading overlay on them
- Swap in new draft when response arrives, update Supabase
- User can regenerate as many times as they want

**3. Approve**
- "Approve & Generate" button at the bottom
- POSTs the final (possibly edited + regenerated) draft JSON to `/api/generate-page`
- Shows a full-page loading state ("Building your landing page…") — this takes 15–30s
- On complete → redirect to `/preview/[id]`

### `/preview/[id]` — Final preview
- Thin toolbar at top: mobile/desktop toggle, "Download HTML" button, copy shareable link
- `<iframe srcDoc={html}>` fills the rest of the viewport
- Mobile toggle shrinks iframe to 390px centered; desktop fills full width
- Download button creates a Blob and triggers browser download

### `/p/[id]` — Public page (raw HTML)
- Next.js route handler that fetches `html` from Supabase by ID
- Returns it as `text/html` response with no app shell
- This is the real shareable URL — opens as a standalone landing page

---

## API Routes

### `POST /api/generate-draft`
```ts
// body: { prompt: string }
// 1. call Claude → get draft JSON
// 2. insert into projects table with status: 'draft'
// 3. return { id, draft }
```

### `POST /api/regenerate-draft`
```ts
// body: { id: string, draft: Draft, feedback: string, prompt: string }
// 1. call Claude with original prompt + current draft + feedback
// 2. update projects set draft = newDraft where id = id
// 3. return { draft }
```

### `POST /api/generate-page`
```ts
// body: { id: string, draft: Draft }
// 1. call Claude with draft JSON → get HTML string
// 2. strip markdown fences if present: html.replace(/^```html\n?/, '').replace(/```$/, '')
// 3. update projects set html = html, status = 'done' where id = id
// 4. return { id }
```

> **Use Edge runtime on Call 2** to avoid Vercel's 60s serverless timeout:
> ```ts
> export const runtime = 'edge'
> ```

---

## 6-Hour Time Budget

| Block | Time | Notes |
|---|---|---|
| Repo setup, Supabase project, env vars, Vercel link | ~30m | Do this first, unblock everything |
| Auth — middleware, login page, RLS policy | ~40m | Mostly copy-paste from Supabase docs |
| Prompt input page + your pages list (`/`) | ~45m | Simple UI, just needs to work |
| API routes + AI calls (all three) | ~1h | Core logic — get this working before any polish |
| Draft review page — cards + inline edit + refinement input | ~1.5h | Most important page, most time |
| Preview page — iframe, toolbar, download | ~45m | Mostly layout work |
| Prompt tuning — iterate on output quality | ~45m | Don't skip this, it's what makes the demo impressive |
| Deploy to Vercel + write README | ~30m | Leave real time for README, it's evaluated |

**Total: ~6.5h** — trim prompt tuning or polish if running long

---

## README Structure (required)

The README is explicitly evaluated. Cover these four things concisely:

1. **Architecture** — Next.js App Router, Supabase Auth + single table, RLS for data isolation, 3 API routes, Vercel Edge for long-running calls
2. **Pipeline** — prompt → Call 1 (draft JSON) → optional refinement loop (Call 1b) → user approves → Call 2 (full HTML) → iframe preview + public URL
3. **How AI tools were used during development** — Claude Code for scaffolding, what was generated vs. hand-written, prompt iteration process
4. **Intentional simplifications** — no team/sharing permissions, no edit history, no image generation, no section reordering, no multi-page output

---

## Gotchas

| Risk | Mitigation |
|---|---|
| Call 2 takes 15–30s | Full-page loading state + Edge runtime streaming |
| Claude wraps HTML in markdown fences | Strip with regex in API route before saving |
| Vercel 60s serverless timeout | `export const runtime = 'edge'` on generate-page route |
| `srcdoc` ~32kb browser limit | Save HTML to Supabase, use `/p/[id]` as the real render if needed |
| Draft JSON malformed / missing fields | Validate structure after Call 1, show error and retry option |
| Regenerate replaces good copy with worse | Keep "undo last regeneration" in local state (just store prev draft) |

---

## What to Deliberately Skip

- Team accounts / sharing permissions (users can only see their own projects)
- Edit history or version control
- Section reordering drag-and-drop
- Image generation or real visuals
- Multiple pages / multi-section add/remove
- Custom domain for `/p/[id]`
- Analytics or click tracking on generated pages

These are all reasonable product features. Mention them in the README as "next steps" — it shows you thought about scope, not that you ran out of time.
