import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const threads = sqliteTable('threads', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  status: text('status', { enum: ['regular', 'archived'] })
    .notNull()
    .default('regular'),
  title: text('title'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  threadId: text('thread_id')
    .notNull()
    .references(() => threads.id, { onDelete: 'cascade' }),
  parentId: text('parent_id'),
  format: text('format').notNull().default('ai-sdk/v6'),
  content: text('content', { mode: 'json' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export const sessions = sqliteTable('sessions', {
  threadId: text('thread_id')
    .primaryKey()
    .references(() => threads.id, { onDelete: 'cascade' }),
  checkoutSessionId: text('checkout_session_id'),
  cartId: text('cart_id'),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

export type Thread = typeof threads.$inferSelect;
export type NewThread = typeof threads.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Session = typeof sessions.$inferSelect;
