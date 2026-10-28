import { z } from 'zod';

export const mailboxReplySchema = z.object({
  id: z.uuid(), messageId: z.uuid(), body: z.string().trim().min(1).max(20000),
}).strict();

export type MailboxMessage = {
  is_read?: boolean;
  id: string; sender_name: string; sender_address: string; reply_address: string | null;
  subject: string; received_at: string; body_limited: boolean;
};
export type MailboxCursor = { before: string; beforeId: string };
export const mailboxPageSchema = z.object({
  before: z.string().datetime({ offset: true }).nullable(), beforeId: z.uuid().nullable(),
  search: z.string().trim().max(120),
}).refine(value => Boolean(value.before) === Boolean(value.beforeId));
export type MailboxDetail = MailboxMessage & {
  body_text: string;
  attachments: Array<{ name: string; size: number }>;
  replies: Array<{ id: string; recipient: string; body_text: string; status: string; created_at: string }>;
};
export type MailboxState = {
  last_success_at: string | null; last_error: string | null; smtp_verified_at: string | null;
};

// Header values must never carry CR/LF or NUL into SMTP.
export function cleanMailHeader(value: string, max = 300) {
  return value.replace(/[\r\n\0]/g, ' ').trim().slice(0, max);
}
export function safeMailAddress(value: string | undefined | null) {
  if (!value || /[\r\n\0]/.test(value)) return null;
  const parsed = z.email().max(254).safeParse(value.trim());
  return parsed.success ? parsed.data : null;
}
export function safeMessageId(value: string | undefined | null) {
  return value && /^<[^<>\s\x00-\x1f]{1,250}>$/.test(value) ? value : undefined;
}
