import { eq, and, desc } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { threads, type Thread } from './schema';
import type * as schema from './schema';

type Db = BetterSQLite3Database<typeof schema>;

export function listThreads(db: Db, userId: string): readonly Thread[] {
  return db
    .select()
    .from(threads)
    .where(eq(threads.userId, userId))
    .orderBy(desc(threads.updatedAt))
    .all();
}

export function getThread(db: Db, threadId: string, userId: string): Thread | undefined {
  return db
    .select()
    .from(threads)
    .where(and(eq(threads.id, threadId), eq(threads.userId, userId)))
    .get();
}

export function createThread(
  db: Db,
  data: {
    readonly id: string;
    readonly userId: string;
    readonly title?: string;
    readonly status?: 'regular' | 'archived';
  },
): Thread {
  const now = new Date();
  const row = db
    .insert(threads)
    .values({
      id: data.id,
      userId: data.userId,
      title: data.title ?? null,
      status: data.status ?? 'regular',
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing()
    .returning()
    .get();

  if (row) return row;
  return db.select().from(threads).where(eq(threads.id, data.id)).get()!;
}

export function updateThread(
  db: Db,
  threadId: string,
  userId: string,
  updates: { readonly title?: string; readonly status?: 'regular' | 'archived' },
): Thread | undefined {
  const values: Record<string, unknown> = { updatedAt: new Date() };
  if (updates.title !== undefined) values['title'] = updates.title;
  if (updates.status !== undefined) values['status'] = updates.status;

  return db
    .update(threads)
    .set(values)
    .where(and(eq(threads.id, threadId), eq(threads.userId, userId)))
    .returning()
    .get();
}

export function deleteThread(db: Db, threadId: string, userId: string): void {
  db.delete(threads)
    .where(and(eq(threads.id, threadId), eq(threads.userId, userId)))
    .run();
}
