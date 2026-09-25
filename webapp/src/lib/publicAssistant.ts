// Browser-side call to the public-assistant edge function (built-in, no external AI model).
import { supabase } from './supabase'

export type AssistantReply = {
  answer: string
  intent: string
  sources: string[]
  links: { label: string; href: string }[]
  suggestions: string[]
}

export async function askPublicAssistant(message: string): Promise<AssistantReply> {
  const { data, error } = await supabase.functions.invoke('public-assistant', { body: { message } })
  if (error) {
    let text = 'The assistant is unavailable right now. You can email contact@medtechfixaters.in.'
    try {
      const ctx = (error as { context?: Response }).context
      const parsed = ctx ? await ctx.json() : null
      if (parsed?.error) text = parsed.error
    } catch {
      /* keep the generic message */
    }
    throw new Error(text)
  }
  if (!data?.success || !data.reply) throw new Error(data?.error || 'The assistant is unavailable right now.')
  // Only internal links are rendered as buttons.
  const reply = data.reply as AssistantReply
  return { ...reply, links: (reply.links || []).filter((l) => typeof l.href === 'string' && l.href.startsWith('/')) }
}
