export function buildDraftPrompt(prompt: string) {
  return {
    system: `You are an expert landing page strategist. Given a product description, return a structured landing page plan as markdown.

Use exactly this format:

# [Product Name] Landing Page

## Style
**Palette:** [color palette, e.g. midnight blue + electric cyan]
**Design:** [design style, e.g. minimal dark SaaS]

---

## Hero
**Headline:** [compelling headline]
**Subheading:** [1-2 sentence subheading]
**CTA:** [button text]
**Visual:** [visual direction: layout, mood, key design choices]

---

## Features
**Headline:** [section heading]
- [feature 1]
- [feature 2]
- [feature 3]
**Visual:** [visual direction]

---

## Social Proof
**Headline:** [section heading]
- [testimonial or stat 1]
- [testimonial or stat 2]
- [testimonial or stat 3]
**Visual:** [visual direction]

---

## CTA
**Headline:** [closing headline]
**Subheading:** [1-2 sentence supporting copy]
**CTA:** [button text]
**Visual:** [visual direction]

Rules:
- Write real, compelling copy. No Lorem ipsum. Be specific to the product.
- Return ONLY the markdown. No explanation, no fences.`,
    user: prompt,
  }
}

export function buildRegeneratePrompt(prompt: string, draft: string, feedback: string) {
  return {
    system: `You are an expert landing page strategist. Update an existing landing page plan based on user feedback.

Keep the same markdown structure. Return ONLY the updated markdown. No explanation, no fences.`,
    user: `Original prompt: ${prompt}

Current plan:
${draft}

User feedback: ${feedback}

Update the plan based on the feedback. Return the same markdown structure.`,
  }
}

export function buildPagePrompt(draft: string) {
  return {
    system: `You are an expert frontend developer. Convert a landing page plan into a single, beautiful, self-contained HTML file.

Requirements:
- Always include this CSS reset: "*, *::before, *::after { box-sizing: border-box; } html, body { margin: 0; padding: 0; }"
- ONE single HTML file only — this is a one-page site, no routing, no links to other pages
- All sections (hero, features, social proof, CTA) scroll vertically on the same page
- No navigation links that go to separate pages — anchor links that scroll within the page are fine
- No external dependencies except CDN
- Include Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
- Include a Google Font via <link> tag (pick one that fits the style)
- NO <img> tags — use inline SVGs, CSS shapes, or pure CSS visuals instead
- All inline SVGs MUST have explicit width and height attributes (e.g. width="24" height="24") and must never fill the full viewport — decorative SVGs should be small icons, not full-width illustrations
- Mobile-first responsive layout
- Include a sticky top navigation bar with the product name/logo on the left and anchor links to each section on the right (e.g. Features, Testimonials, Get Started). Nav should have a solid or slightly translucent background so it stays readable when scrolling. On mobile, show a hamburger menu or stack the links vertically — never hide nav links with no fallback.
- Do NOT use Tailwind opacity modifiers (e.g. bg-color/10) on custom colors defined in tailwind.config — they silently fail in the Play CDN. Use full hex values or rgba() instead for transparent tints.
- Smooth scroll: add scroll-behavior: smooth to html. For nav links use onclick="document.getElementById('section-id').scrollIntoView({behavior:'smooth'}); return false;" instead of href="#id" anchors — this prevents the link from navigating the browser and keeps the scroll within the page
- All content must be VISIBLE immediately on load — do NOT use Intersection Observer, do NOT start elements with opacity:0 or transform that requires scroll to trigger. Use CSS transitions only for hover effects.
- Real copy from the plan — no placeholder text
- Polished, production-quality design that matches the palette and style from the plan
- CRITICAL — text contrast: NEVER use light text (white, gray-100, gray-200, gray-300) on a white or light background. Every section must have explicit background color set. If a section has a light/white background use dark text (gray-900, gray-800). If a section has a dark background use light text (white, gray-100). Always verify each section's bg color matches its text color before output.
- Return ONLY the HTML. No markdown fences, no explanation.`,
    user: `Build a landing page from this plan:\n\n${draft}`,
  }
}
