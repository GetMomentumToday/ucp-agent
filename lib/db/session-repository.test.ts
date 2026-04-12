import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './connection';
import { createThread, deleteThread } from './thread-repository';
import { getSession, upsertSession, clearSession } from './session-repository';

function freshDb() {
  return createTestDb();
}

describe('session-repository', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = freshDb();
    createThread(db, { id: 'thread-1', userId: 'user-1' });
  });

  describe('getSession', () => {
    it('returns undefined for nonexistent session', () => {
      expect(getSession(db, 'thread-1')).toBeUndefined();
    });
  });

  describe('upsertSession', () => {
    it('creates a session with checkout ID', () => {
      upsertSession(db, 'thread-1', { checkoutSessionId: 'checkout-123' });
      const session = getSession(db, 'thread-1');
      expect(session?.checkoutSessionId).toBe('checkout-123');
      expect(session?.cartId).toBeNull();
    });

    it('creates a session with cart ID', () => {
      upsertSession(db, 'thread-1', { cartId: 'cart-456' });
      const session = getSession(db, 'thread-1');
      expect(session?.cartId).toBe('cart-456');
    });

    it('updates existing session', () => {
      upsertSession(db, 'thread-1', { checkoutSessionId: 'v1' });
      upsertSession(db, 'thread-1', { checkoutSessionId: 'v2' });
      expect(getSession(db, 'thread-1')?.checkoutSessionId).toBe('v2');
    });

    it('clears a field by setting null', () => {
      upsertSession(db, 'thread-1', { checkoutSessionId: 'checkout-123' });
      upsertSession(db, 'thread-1', { checkoutSessionId: null });
      expect(getSession(db, 'thread-1')?.checkoutSessionId).toBeNull();
    });

    it('preserves other fields on partial update', () => {
      upsertSession(db, 'thread-1', { checkoutSessionId: 'co', cartId: 'ca' });
      upsertSession(db, 'thread-1', { checkoutSessionId: 'co2' });
      const session = getSession(db, 'thread-1');
      expect(session?.checkoutSessionId).toBe('co2');
      expect(session?.cartId).toBe('ca');
    });
  });

  describe('clearSession', () => {
    it('removes the session row', () => {
      upsertSession(db, 'thread-1', { checkoutSessionId: 'test' });
      clearSession(db, 'thread-1');
      expect(getSession(db, 'thread-1')).toBeUndefined();
    });
  });

  describe('cascade delete', () => {
    it('deletes session when thread is deleted', () => {
      upsertSession(db, 'thread-1', { checkoutSessionId: 'test' });
      deleteThread(db, 'thread-1', 'user-1');
      expect(getSession(db, 'thread-1')).toBeUndefined();
    });
  });
});
