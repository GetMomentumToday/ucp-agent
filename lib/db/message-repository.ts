import { eq, asc } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { messages } from './schema';
import type * as schema from './schema';

type Db = BetterSQLite3Database<typeof schema>;

export interface StoredMessage {
  readonly id: string;
  readonly parentId: string | null;
  readonly format: string;
  readonly content: unknown;
}

export function loadMessages(db: Db, threadId: string): readonly StoredMessage[] {
  const rows = db
    .select()
    .from(messages)
    .where(eq(messages.threadId, threadId))
    .orderBy(asc(messages.createdAt))
    .all();

  return rows.map((row) => ({
    id: row.id,
    parentId: row.parentId,
    format: row.format,
    content: row.content,
  }));
}

export function appendMessage(
  db: Db,
  threadId: string,
  entry: {
    readonly id: string;
    readonly parentId: string | null;
    readonly format: string;
    readonly content: unknown;
  },
): void {
  db.insert(messages)
    .values({
      id: entry.id,
      threadId,
      parentId: entry.parentId,
      format: entry.format,
      content: entry.content,
      createdAt: new Date(),
    })
    .onConflictDoUpdate({
      target: messages.id,
      set: {
        parentId: entry.parentId,
        content: entry.content,
      },
    })
    .run();
}

export function deleteMessages(db: Db, threadId: string): void {
  db.delete(messages).where(eq(messages.threadId, threadId)).run();
}
