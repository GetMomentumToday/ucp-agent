/**
 * In-memory session store mapping sessionId → checkoutSessionId.
 * Swap for Redis in production.
 */
const sessions = new Map<string, string>();

export function getCheckoutSessionId(sessionId: string): string | undefined {
  return sessions.get(sessionId);
}

export function setCheckoutSessionId(sessionId: string, checkoutSessionId: string): void {
  sessions.set(sessionId, checkoutSessionId);
}

export function clearCheckoutSessionId(sessionId: string): void {
  sessions.delete(sessionId);
}
