export type Draft = string

export type Project = {
  id: string
  user_id: string
  prompt: string
  draft: Draft | null
  html: string | null
  status: 'pending' | 'draft' | 'done'
  created_at: string
}
