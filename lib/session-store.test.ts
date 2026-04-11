import { describe, it, expect, beforeEach } from 'vitest';
import {
  getCheckoutSessionId,
  setCheckoutSessionId,
  clearCheckoutSessionId,
  getCartSessionId,
  setCartSessionId,
  clearCartSessionId,
} from './session-store';

describe('session-store', () => {
  beforeEach(() => {
    clearCheckoutSessionId('test-session');
    clearCartSessionId('test-session');
  });

  describe('checkout sessions', () => {
    it('returns undefined for unknown session', () => {
      expect(getCheckoutSessionId('nonexistent')).toBeUndefined();
    });

    it('stores and retrieves a checkout session ID', () => {
      setCheckoutSessionId('test-session', 'checkout-123');
      expect(getCheckoutSessionId('test-session')).toBe('checkout-123');
    });

    it('overwrites existing checkout session ID', () => {
      setCheckoutSessionId('test-session', 'checkout-123');
      setCheckoutSessionId('test-session', 'checkout-456');
      expect(getCheckoutSessionId('test-session')).toBe('checkout-456');
    });

    it('clears a checkout session ID', () => {
      setCheckoutSessionId('test-session', 'checkout-123');
      clearCheckoutSessionId('test-session');
      expect(getCheckoutSessionId('test-session')).toBeUndefined();
    });

    it('isolates sessions by sessionId', () => {
      setCheckoutSessionId('session-a', 'checkout-a');
      setCheckoutSessionId('session-b', 'checkout-b');
      expect(getCheckoutSessionId('session-a')).toBe('checkout-a');
      expect(getCheckoutSessionId('session-b')).toBe('checkout-b');
    });
  });

  describe('cart sessions', () => {
    it('returns undefined for unknown session', () => {
      expect(getCartSessionId('nonexistent')).toBeUndefined();
    });

    it('stores and retrieves a cart session ID', () => {
      setCartSessionId('test-session', 'cart-123');
      expect(getCartSessionId('test-session')).toBe('cart-123');
    });

    it('overwrites existing cart session ID', () => {
      setCartSessionId('test-session', 'cart-123');
      setCartSessionId('test-session', 'cart-456');
      expect(getCartSessionId('test-session')).toBe('cart-456');
    });

    it('clears a cart session ID', () => {
      setCartSessionId('test-session', 'cart-123');
      clearCartSessionId('test-session');
      expect(getCartSessionId('test-session')).toBeUndefined();
    });

    it('isolates sessions by sessionId', () => {
      setCartSessionId('session-a', 'cart-a');
      setCartSessionId('session-b', 'cart-b');
      expect(getCartSessionId('session-a')).toBe('cart-a');
      expect(getCartSessionId('session-b')).toBe('cart-b');
    });
  });

  describe('cross-store isolation', () => {
    it('checkout and cart sessions are independent', () => {
      setCheckoutSessionId('test-session', 'checkout-123');
      setCartSessionId('test-session', 'cart-456');

      expect(getCheckoutSessionId('test-session')).toBe('checkout-123');
      expect(getCartSessionId('test-session')).toBe('cart-456');

      clearCheckoutSessionId('test-session');
      expect(getCheckoutSessionId('test-session')).toBeUndefined();
      expect(getCartSessionId('test-session')).toBe('cart-456');
    });
  });
});
