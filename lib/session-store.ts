const checkoutSessions = new Map<string, string>();
const cartSessions = new Map<string, string>();

export function getCheckoutSessionId(sessionId: string): string | undefined {
  return checkoutSessions.get(sessionId);
}

export function setCheckoutSessionId(sessionId: string, checkoutSessionId: string): void {
  checkoutSessions.set(sessionId, checkoutSessionId);
}

export function clearCheckoutSessionId(sessionId: string): void {
  checkoutSessions.delete(sessionId);
}

export function getCartSessionId(sessionId: string): string | undefined {
  return cartSessions.get(sessionId);
}

export function setCartSessionId(sessionId: string, cartId: string): void {
  cartSessions.set(sessionId, cartId);
}

export function clearCartSessionId(sessionId: string): void {
  cartSessions.delete(sessionId);
}
