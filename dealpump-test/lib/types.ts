export type SectionType = 'hero' | 'features' | 'social_proof' | 'cta'

export type Section = {
  type: SectionType
  heading: string
  subheading?: string
  cta?: string
  items?: string[]
  visual: string
}

export type Draft = {
  sections: Section[]
  palette: string
  style: string
}

export type Project = {
  id: string
  user_id: string
  prompt: string
  draft: Draft | null
  html: string | null
  status: 'pending' | 'draft' | 'done'
  created_at: string
}
