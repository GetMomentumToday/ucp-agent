import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './connection';
import { createThread, deleteThread } from './thread-repository';
import { loadMessages, appendMessage, deleteMessages } from './message-repository';

function freshDb() {
  return createTestDb();
}

describe('message-repository', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = freshDb();
    createThread(db, { id: 'thread-1', userId: 'user-1' });
  });

  describe('appendMessage', () => {
    it('inserts a new message', () => {
      appendMessage(db, 'thread-1', {
        id: 'msg-1',
        parentId: null,
        format: 'ai-sdk/v6',
        content: { role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
      });

      const messages = loadMessages(db, 'thread-1');
      expect(messages).toHaveLength(1);
      expect(messages[0]!.id).toBe('msg-1');
      expect(messages[0]!.parentId).toBeNull();
    });

    it('upserts on conflict', () => {
      appendMessage(db, 'thread-1', {
        id: 'msg-1',
        parentId: null,
        format: 'ai-sdk/v6',
        content: { role: 'user', parts: [{ type: 'text', text: 'v1' }] },
      });

      appendMessage(db, 'thread-1', {
        id: 'msg-1',
        parentId: 'parent-1',
        format: 'ai-sdk/v6',
        content: { role: 'user', parts: [{ type: 'text', text: 'v2' }] },
      });

      const messages = loadMessages(db, 'thread-1');
      expect(messages).toHaveLength(1);
      expect(messages[0]!.parentId).toBe('parent-1');
      expect((messages[0]!.content as { parts: { text: string }[] }).parts[0]!.text).toBe('v2');
    });
  });

  describe('loadMessages', () => {
    it('returns empty array for thread with no messages', () => {
      expect(loadMessages(db, 'thread-1')).toEqual([]);
    });

    it('returns messages ordered by insertion time', () => {
      appendMessage(db, 'thread-1', {
        id: 'msg-1',
        parentId: null,
        format: 'ai-sdk/v6',
        content: { role: 'user' },
      });
      appendMessage(db, 'thread-1', {
        id: 'msg-2',
        parentId: 'msg-1',
        format: 'ai-sdk/v6',
        content: { role: 'assistant' },
      });

      const messages = loadMessages(db, 'thread-1');
      expect(messages).toHaveLength(2);
      expect(messages[0]!.id).toBe('msg-1');
      expect(messages[1]!.id).toBe('msg-2');
      expect(messages[1]!.parentId).toBe('msg-1');
    });

    it('returns empty for nonexistent thread', () => {
      expect(loadMessages(db, 'nonexistent')).toEqual([]);
    });
  });

  describe('deleteMessages', () => {
    it('deletes all messages for a thread', () => {
      appendMessage(db, 'thread-1', {
        id: 'msg-1',
        parentId: null,
        format: 'ai-sdk/v6',
        content: {},
      });
      deleteMessages(db, 'thread-1');
      expect(loadMessages(db, 'thread-1')).toEqual([]);
    });
  });

  describe('cascade delete', () => {
    it('deletes messages when thread is deleted', () => {
      appendMessage(db, 'thread-1', {
        id: 'msg-1',
        parentId: null,
        format: 'ai-sdk/v6',
        content: {},
      });
      deleteThread(db, 'thread-1', 'user-1');
      expect(loadMessages(db, 'thread-1')).toEqual([]);
    });
  });
});
