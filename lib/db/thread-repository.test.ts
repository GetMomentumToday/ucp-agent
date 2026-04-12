import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './connection';
import {
  listThreads,
  getThread,
  createThread,
  updateThread,
  deleteThread,
} from './thread-repository';

function freshDb() {
  return createTestDb();
}

const USER_A = 'user-a';
const USER_B = 'user-b';

describe('thread-repository', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = freshDb();
  });

  describe('createThread', () => {
    it('creates a thread with defaults', () => {
      const thread = createThread(db, { id: 'thread-1', userId: USER_A });
      expect(thread.id).toBe('thread-1');
      expect(thread.userId).toBe(USER_A);
      expect(thread.status).toBe('regular');
      expect(thread.title).toBeNull();
    });

    it('creates a thread with title and status', () => {
      const thread = createThread(db, {
        id: 'thread-2',
        userId: USER_A,
        title: 'My chat',
        status: 'archived',
      });
      expect(thread.title).toBe('My chat');
      expect(thread.status).toBe('archived');
    });

    it('returns existing thread on conflict', () => {
      createThread(db, { id: 'thread-1', userId: USER_A, title: 'Original' });
      const duplicate = createThread(db, { id: 'thread-1', userId: USER_A, title: 'Duplicate' });
      expect(duplicate.title).toBe('Original');
    });
  });

  describe('getThread', () => {
    it('returns undefined for nonexistent thread', () => {
      expect(getThread(db, 'nope', USER_A)).toBeUndefined();
    });

    it('returns the thread by id and userId', () => {
      createThread(db, { id: 'thread-1', userId: USER_A, title: 'Test' });
      const thread = getThread(db, 'thread-1', USER_A);
      expect(thread?.title).toBe('Test');
    });

    it('does not return another user thread', () => {
      createThread(db, { id: 'thread-1', userId: USER_A });
      expect(getThread(db, 'thread-1', USER_B)).toBeUndefined();
    });
  });

  describe('listThreads', () => {
    it('returns empty array when no threads exist', () => {
      expect(listThreads(db, USER_A)).toEqual([]);
    });

    it('returns only threads for the given user', () => {
      createThread(db, { id: 'a-1', userId: USER_A });
      createThread(db, { id: 'b-1', userId: USER_B });
      createThread(db, { id: 'a-2', userId: USER_A });

      const listA = listThreads(db, USER_A);
      expect(listA).toHaveLength(2);
      expect(listA.map((t) => t.id).sort()).toEqual(['a-1', 'a-2']);

      const listB = listThreads(db, USER_B);
      expect(listB).toHaveLength(1);
      expect(listB[0]!.id).toBe('b-1');
    });

    it('returns threads ordered by updatedAt desc', () => {
      createThread(db, { id: 'a', userId: USER_A });
      createThread(db, { id: 'b', userId: USER_A });
      updateThread(db, 'a', USER_A, { title: 'Updated' });

      const list = listThreads(db, USER_A);
      expect(list[0]!.id).toBe('a');
    });
  });

  describe('updateThread', () => {
    it('updates title', () => {
      createThread(db, { id: 'thread-1', userId: USER_A });
      const updated = updateThread(db, 'thread-1', USER_A, { title: 'New title' });
      expect(updated?.title).toBe('New title');
    });

    it('updates status', () => {
      createThread(db, { id: 'thread-1', userId: USER_A });
      const updated = updateThread(db, 'thread-1', USER_A, { status: 'archived' });
      expect(updated?.status).toBe('archived');
    });

    it('returns undefined for nonexistent thread', () => {
      expect(updateThread(db, 'nope', USER_A, { title: 'test' })).toBeUndefined();
    });

    it('does not update another user thread', () => {
      createThread(db, { id: 'thread-1', userId: USER_A, title: 'Original' });
      const result = updateThread(db, 'thread-1', USER_B, { title: 'Hacked' });
      expect(result).toBeUndefined();
      expect(getThread(db, 'thread-1', USER_A)?.title).toBe('Original');
    });
  });

  describe('deleteThread', () => {
    it('deletes a thread', () => {
      createThread(db, { id: 'thread-1', userId: USER_A });
      deleteThread(db, 'thread-1', USER_A);
      expect(getThread(db, 'thread-1', USER_A)).toBeUndefined();
    });

    it('does not delete another user thread', () => {
      createThread(db, { id: 'thread-1', userId: USER_A });
      deleteThread(db, 'thread-1', USER_B);
      expect(getThread(db, 'thread-1', USER_A)).toBeDefined();
    });

    it('does not throw for nonexistent thread', () => {
      expect(() => deleteThread(db, 'nope', USER_A)).not.toThrow();
    });
  });
});
