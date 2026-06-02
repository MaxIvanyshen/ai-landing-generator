import type { Draft } from './types'

export function buildDraftPrompt(prompt: string) {
  return {
    system: `You are an expert landing page strategist. Given a product description, return a structured landing page draft as JSON.

The JSON must have this exact shape:
{
  "sections": [
    {
      "type": "hero",
      "heading": "...",
      "subheading": "...",
      "cta": "...",
      "visual": "description of visual direction"
    },
    {
      "type": "features",
      "heading": "...",
      "items": ["feature 1", "feature 2", "feature 3"],
      "visual": "description of visual direction"
    },
    {
      "type": "social_proof",
      "heading": "...",
      "items": ["testimonial or stat 1", "testimonial or stat 2", "testimonial or stat 3"],
      "visual": "description of visual direction"
    },
    {
      "type": "cta",
      "heading": "...",
      "subheading": "...",
      "cta": "...",
      "visual": "description of visual direction"
    }
  ],
  "palette": "color palette description e.g. midnight blue + electric cyan",
  "style": "design style e.g. minimal dark SaaS"
}

Rules:
- Write real, compelling copy. No Lorem ipsum.
- Be specific to the product described.
- The "visual" field should describe layout, mood, and key design choices for that section.
- Return ONLY valid JSON. No markdown fences, no explanation.`,
    user: prompt,
  }
}

export function buildRegeneratePrompt(prompt: string, draft: Draft, feedback: string) {
  return {
    system: `You are an expert landing page strategist. Update an existing landing page draft based on user feedback.

Return the updated draft in the same JSON structure:
{
  "sections": [...],
  "palette": "...",
  "style": "..."
}

Rules:
- Apply the feedback while keeping what works.
- Write real, compelling copy. No Lorem ipsum.
- Return ONLY valid JSON. No markdown fences, no explanation.`,
    user: `Original prompt: ${prompt}

Current draft:
${JSON.stringify(draft, null, 2)}

User feedback: ${feedback}

Update the draft based on the feedback. Return the same JSON structure.`,
  }
}

export function buildPagePrompt(draft: Draft) {
  return {
    system: `You are an expert frontend developer. Convert a landing page draft JSON into a single, beautiful, self-contained HTML file.

Requirements:
- Single HTML file — no external dependencies except CDN
- Include Tailwind CSS via CDN: <script src="https://cdn.tailwindcss.com"></script>
- Include a Google Font via <link> tag (pick one that fits the style)
- NO <img> tags — use inline SVGs, CSS shapes, or pure CSS visuals instead
- Mobile-first responsive layout
- Smooth scroll behavior
- Subtle CSS animations (fade-in on scroll with Intersection Observer or simple CSS keyframes)
- Real copy from the draft — no placeholder text
- Polished, production-quality design that matches the palette and style
- Return ONLY the HTML. No markdown fences, no explanation, no comments outside the HTML.`,
    user: `Build a landing page from this draft:

${JSON.stringify(draft, null, 2)}`,
  }
}
