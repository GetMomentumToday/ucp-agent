import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDb } from './connection';
import { createThread, listThreads, getThread, deleteThread } from './thread-repository';
import { appendMessage, loadMessages } from './message-repository';
import { upsertSession, getSession } from './session-repository';

const USER_A = 'user-alice';
const USER_B = 'user-bob';

describe('persistence round-trip', () => {
  let db: ReturnType<typeof createTestDb>;

  beforeEach(() => {
    db = createTestDb();
  });

  it('persists a full conversation: thread → messages → session', () => {
    const thread = createThread(db, { id: 'conv-1', userId: USER_A });
    expect(thread.id).toBe('conv-1');

    appendMessage(db, 'conv-1', {
      id: 'msg-1',
      parentId: null,
      format: 'ai-sdk/v6',
      content: { role: 'user', parts: [{ type: 'text', text: 'Show me watches' }] },
    });
    appendMessage(db, 'conv-1', {
      id: 'msg-2',
      parentId: 'msg-1',
      format: 'ai-sdk/v6',
      content: {
        role: 'assistant',
        parts: [
          { type: 'text', text: 'Here are some watches' },
          { type: 'tool-call', toolName: 'search_products', args: { query: 'watches' } },
        ],
      },
    });

    upsertSession(db, 'conv-1', { checkoutSessionId: 'co-123', cartId: 'cart-456' });

    const messages = loadMessages(db, 'conv-1');
    expect(messages).toHaveLength(2);
    expect(messages[0]!.id).toBe('msg-1');
    expect(messages[1]!.parentId).toBe('msg-1');

    const assistantContent = messages[1]!.content as { parts: { type: string }[] };
    expect(assistantContent.parts).toHaveLength(2);
    expect(assistantContent.parts[1]!.type).toBe('tool-call');

    const session = getSession(db, 'conv-1');
    expect(session?.checkoutSessionId).toBe('co-123');
    expect(session?.cartId).toBe('cart-456');
  });

  it('reloads messages after simulated page refresh (new db reference)', () => {
    appendMessage((createThread(db, { id: 't-1', userId: USER_A }), db), 't-1', {
      id: 'msg-1',
      parentId: null,
      format: 'ai-sdk/v6',
      content: { role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
    });

    const reloaded = loadMessages(db, 't-1');
    expect(reloaded).toHaveLength(1);
    expect((reloaded[0]!.content as { parts: { text: string }[] }).parts[0]!.text).toBe('Hello');
  });

  describe('multi-user isolation', () => {
    it('user A cannot see user B threads', () => {
      createThread(db, { id: 'alice-thread', userId: USER_A, title: 'Alice chat' });
      createThread(db, { id: 'bob-thread', userId: USER_B, title: 'Bob chat' });

      const aliceThreads = listThreads(db, USER_A);
      expect(aliceThreads).toHaveLength(1);
      expect(aliceThreads[0]!.title).toBe('Alice chat');

      const bobThreads = listThreads(db, USER_B);
      expect(bobThreads).toHaveLength(1);
      expect(bobThreads[0]!.title).toBe('Bob chat');
    });

    it('user A cannot read user B thread by ID', () => {
      createThread(db, { id: 'bob-private', userId: USER_B });
      expect(getThread(db, 'bob-private', USER_A)).toBeUndefined();
    });

    it('user A cannot delete user B thread', () => {
      createThread(db, { id: 'bob-thread', userId: USER_B });
      deleteThread(db, 'bob-thread', USER_A);
      expect(getThread(db, 'bob-thread', USER_B)).toBeDefined();
    });

    it('deleting a thread cascades messages and session', () => {
      createThread(db, { id: 'conv-del', userId: USER_A });
      appendMessage(db, 'conv-del', {
        id: 'msg-del',
        parentId: null,
        format: 'ai-sdk/v6',
        content: { role: 'user' },
      });
      upsertSession(db, 'conv-del', { checkoutSessionId: 'co-del' });

      deleteThread(db, 'conv-del', USER_A);

      expect(loadMessages(db, 'conv-del')).toEqual([]);
      expect(getSession(db, 'conv-del')).toBeUndefined();
    });
  });
});
