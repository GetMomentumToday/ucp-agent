import { eq } from 'drizzle-orm';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import { sessions, type Session } from './schema';
import type * as schema from './schema';

type Db = BetterSQLite3Database<typeof schema>;

export function getSession(db: Db, threadId: string): Session | undefined {
  return db.select().from(sessions).where(eq(sessions.threadId, threadId)).get();
}

export function upsertSession(
  db: Db,
  threadId: string,
  data: { readonly checkoutSessionId?: string | null; readonly cartId?: string | null },
): void {
  db.insert(sessions)
    .values({
      threadId,
      checkoutSessionId: data.checkoutSessionId ?? null,
      cartId: data.cartId ?? null,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: sessions.threadId,
      set: {
        ...(data.checkoutSessionId !== undefined
          ? { checkoutSessionId: data.checkoutSessionId ?? null }
          : {}),
        ...(data.cartId !== undefined ? { cartId: data.cartId ?? null } : {}),
        updatedAt: new Date(),
      },
    })
    .run();
}

export function clearSession(db: Db, threadId: string): void {
  db.delete(sessions).where(eq(sessions.threadId, threadId)).run();
}
