import type { AssistantStreamChunk } from 'assistant-stream';
import type { ThreadMessage } from '@assistant-ui/core';
import {
  saveConversation,
  updateConversation,
  deleteConversation,
  loadConversations,
  findConversation,
  type StoredConversation,
} from './conversation-storage';

type RemoteThreadInitializeResponse = {
  remoteId: string;
  externalId: string | undefined;
};

type RemoteThreadMetadata = {
  readonly status: 'regular' | 'archived';
  readonly remoteId: string;
  readonly externalId?: string | undefined;
  readonly title?: string | undefined;
};

type RemoteThreadListResponse = {
  threads: RemoteThreadMetadata[];
};

function toMetadata(conv: StoredConversation): RemoteThreadMetadata {
  return {
    remoteId: conv.remoteId,
    status: conv.status,
    title: conv.title,
    externalId: undefined,
  };
}

function extractTitle(messages: readonly ThreadMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user');
  if (!firstUser) return 'New chat';

  const textPart = firstUser.content.find(
    (p): p is { type: 'text'; text: string } => p.type === 'text',
  );
  if (!textPart) return 'New chat';

  const raw = textPart.text.trim();
  return raw.length > 40 ? raw.slice(0, 40).trimEnd() + '…' : raw;
}

export class LocalStorageThreadListAdapter {
  list(): Promise<RemoteThreadListResponse> {
    const conversations = loadConversations();
    return Promise.resolve({
      threads: conversations.map(toMetadata),
    });
  }

  initialize(threadId: string): Promise<RemoteThreadInitializeResponse> {
    saveConversation({
      remoteId: threadId,
      title: undefined,
      status: 'regular',
      createdAt: Date.now(),
    });
    return Promise.resolve({ remoteId: threadId, externalId: undefined });
  }

  rename(remoteId: string, newTitle: string): Promise<void> {
    updateConversation(remoteId, { title: newTitle });
    return Promise.resolve();
  }

  archive(remoteId: string): Promise<void> {
    updateConversation(remoteId, { status: 'archived' });
    return Promise.resolve();
  }

  unarchive(remoteId: string): Promise<void> {
    updateConversation(remoteId, { status: 'regular' });
    return Promise.resolve();
  }

  delete(remoteId: string): Promise<void> {
    deleteConversation(remoteId);
    return Promise.resolve();
  }

  generateTitle(
    remoteId: string,
    messages: readonly ThreadMessage[],
  ): Promise<ReadableStream<AssistantStreamChunk>> {
    const title = extractTitle(messages);
    updateConversation(remoteId, { title });

    const stream = new ReadableStream<AssistantStreamChunk>({
      start(controller) {
        controller.enqueue({
          type: 'text-delta',
          textDelta: title,
          path: [],
        } as AssistantStreamChunk);
        controller.close();
      },
    });
    return Promise.resolve(stream);
  }

  fetch(threadId: string): Promise<RemoteThreadMetadata> {
    const conv = findConversation(threadId);
    if (!conv) return Promise.reject(new Error('Thread not found'));
    return Promise.resolve(toMetadata(conv));
  }
}
