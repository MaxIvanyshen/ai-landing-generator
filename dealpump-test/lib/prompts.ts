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
- Single HTML file — no external dependencies except CDN
- Include Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
- Include a Google Font via <link> tag (pick one that fits the style)
- NO <img> tags — use inline SVGs, CSS shapes, or pure CSS visuals instead
- Mobile-first responsive layout
- Smooth scroll behavior
- Subtle CSS animations (fade-in on scroll with Intersection Observer or simple CSS keyframes)
- Real copy from the plan — no placeholder text
- Polished, production-quality design that matches the palette and style from the plan
- Return ONLY the HTML. No markdown fences, no explanation.`,
    user: `Build a landing page from this plan:\n\n${draft}`,
  }
}
