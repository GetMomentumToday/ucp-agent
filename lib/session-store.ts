import { getDb } from './db/connection';
import {
  getSession,
  upsertSession,
} from './db/session-repository';

export function getCheckoutSessionId(sessionId: string): string | undefined {
  const db = getDb();
  const session = getSession(db, sessionId);
  return session?.checkoutSessionId ?? undefined;
}

export function setCheckoutSessionId(sessionId: string, checkoutSessionId: string): void {
  const db = getDb();
  upsertSession(db, sessionId, { checkoutSessionId });
}

export function clearCheckoutSessionId(sessionId: string): void {
  const db = getDb();
  upsertSession(db, sessionId, { checkoutSessionId: null });
}

export function getCartSessionId(sessionId: string): string | undefined {
  const db = getDb();
  const session = getSession(db, sessionId);
  return session?.cartId ?? undefined;
}

export function setCartSessionId(sessionId: string, cartId: string): void {
  const db = getDb();
  upsertSession(db, sessionId, { cartId });
}

export function clearCartSessionId(sessionId: string): void {
  const db = getDb();
  upsertSession(db, sessionId, { cartId: null });
}
