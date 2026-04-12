import { createAssistantStream, type AssistantStream } from 'assistant-stream';
import type { ThreadMessage } from '@assistant-ui/core';
import { ServerThreadHistoryProvider } from './server-thread-history-provider';

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

type StoredMessageEntry = {
  readonly id: string;
  readonly parent_id: string | null;
  readonly format: string;
  readonly content: unknown;
};

function extractTitle(messages: readonly ThreadMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user');
  if (!firstUser) return 'New chat';

  const textPart = firstUser.content.find(
    (p): p is { type: 'text'; text: string } => p.type === 'text',
  );
  if (!textPart) return 'New chat';

  const raw = textPart.text.trim();
  return raw.length > 40 ? raw.slice(0, 40).trimEnd() + '\u2026' : raw;
}

const prefetchedMessages = new Map<string, readonly StoredMessageEntry[]>();

export function getPrefetchedMessages(threadId: string): readonly StoredMessageEntry[] | undefined {
  const messages = prefetchedMessages.get(threadId);
  if (messages) {
    prefetchedMessages.delete(threadId);
  }
  return messages;
}

export class RemoteThreadListAdapter {
  unstable_Provider = ServerThreadHistoryProvider;

  async list(): Promise<RemoteThreadListResponse> {
    const res = await fetch('/api/threads');
    if (!res.ok) return { threads: [] };

    const data = (await res.json()) as {
      threads: RemoteThreadMetadata[];
      latestThreadId?: string;
      latestMessages?: StoredMessageEntry[];
    };

    if (data.latestThreadId && data.latestMessages) {
      prefetchedMessages.set(data.latestThreadId, data.latestMessages);
    }

    return { threads: data.threads };
  }

  async initialize(threadId: string): Promise<RemoteThreadInitializeResponse> {
    const res = await fetch('/api/threads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ threadId }),
    });
    if (!res.ok) return { remoteId: threadId, externalId: undefined };
    return res.json();
  }

  async rename(remoteId: string, newTitle: string): Promise<void> {
    await fetch(`/api/threads/${remoteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle }),
    });
  }

  async archive(remoteId: string): Promise<void> {
    await fetch(`/api/threads/${remoteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'archived' }),
    });
  }

  async unarchive(remoteId: string): Promise<void> {
    await fetch(`/api/threads/${remoteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'regular' }),
    });
  }

  async delete(remoteId: string): Promise<void> {
    await fetch(`/api/threads/${remoteId}`, { method: 'DELETE' });
  }

  async generateTitle(
    remoteId: string,
    messages: readonly ThreadMessage[],
  ): Promise<AssistantStream> {
    const title = extractTitle(messages);
    this.rename(remoteId, title);

    return createAssistantStream((controller) => {
      controller.appendText(title);
    });
  }

  async fetch(threadId: string): Promise<RemoteThreadMetadata> {
    const res = await fetch(`/api/threads/${threadId}`);
    if (!res.ok) throw new Error('Thread not found');
    return res.json();
  }
}
