'use client';

import { useMemo, type ReactNode } from 'react';
import { RuntimeAdapterProvider } from '@assistant-ui/react';
import { useAui } from '@assistant-ui/store';
import type {
  ThreadHistoryAdapter,
  ExportedMessageRepository,
  ExportedMessageRepositoryItem,
  MessageFormatAdapter,
  GenericThreadHistoryAdapter,
  MessageFormatItem,
  MessageFormatRepository,
  MessageStorageEntry,
} from '@assistant-ui/core';
import { getPrefetchedMessages } from './remote-thread-list-adapter';

type RawEntry = { id: string; parent_id: string | null; format: string; content: unknown };

function sortByParentChain(entries: readonly RawEntry[]): readonly RawEntry[] {
  if (entries.length <= 1) return entries;

  const byParent = new Map<string | null, RawEntry>();
  for (const entry of entries) {
    byParent.set(entry.parent_id, entry);
  }

  const sorted: RawEntry[] = [];
  let current = byParent.get(null);
  const visited = new Set<string>();

  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    sorted.push(current);
    current = byParent.get(current.id);
  }

  if (sorted.length < entries.length) {
    for (const entry of entries) {
      if (!visited.has(entry.id)) sorted.push(entry);
    }
  }

  return sorted;
}

function decodeMessages<TMessage, TStorageFormat extends Record<string, unknown>>(
  entries: readonly RawEntry[],
  formatAdapter: MessageFormatAdapter<TMessage, TStorageFormat>,
): MessageFormatRepository<TMessage> {
  const sorted = sortByParentChain(entries);
  const decoded = sorted.map((entry) =>
    formatAdapter.decode(entry as MessageStorageEntry<TStorageFormat>),
  );
  const headId =
    decoded.length > 0 ? formatAdapter.getId(decoded[decoded.length - 1]!.message) : undefined;
  return { messages: decoded, headId };
}

function createFormattedAdapter<TMessage, TStorageFormat extends Record<string, unknown>>(
  aui: ReturnType<typeof useAui>,
  formatAdapter: MessageFormatAdapter<TMessage, TStorageFormat>,
): GenericThreadHistoryAdapter<TMessage> {
  return {
    async load(): Promise<MessageFormatRepository<TMessage>> {
      const remoteId = aui.threadListItem().getState().remoteId;
      if (!remoteId) return { messages: [] };

      const cached = getPrefetchedMessages(remoteId);
      if (cached) return decodeMessages(cached, formatAdapter);

      const res = await fetch(`/api/threads/${remoteId}/messages`);
      if (!res.ok) return { messages: [] };

      const data = (await res.json()) as {
        messages: MessageStorageEntry<TStorageFormat>[];
      };
      return decodeMessages(data.messages, formatAdapter);
    },

    async append(item: MessageFormatItem<TMessage>): Promise<void> {
      const { remoteId } = await aui.threadListItem().initialize();

      const encoded = formatAdapter.encode(item);
      const id = formatAdapter.getId(item.message);

      await fetch(`/api/threads/${remoteId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          parent_id: item.parentId,
          format: formatAdapter.format,
          content: encoded,
        }),
      });
    },
  };
}

function createHistoryAdapter(aui: ReturnType<typeof useAui>): ThreadHistoryAdapter {
  return {
    async load(): Promise<ExportedMessageRepository & { unstable_resume?: boolean }> {
      return { messages: [] };
    },

    async append(_item: ExportedMessageRepositoryItem): Promise<void> {},

    withFormat<TMessage, TStorageFormat extends Record<string, unknown>>(
      formatAdapter: MessageFormatAdapter<TMessage, TStorageFormat>,
    ): GenericThreadHistoryAdapter<TMessage> {
      return createFormattedAdapter(aui, formatAdapter);
    },
  };
}

export function ServerThreadHistoryProvider({ children }: { readonly children: ReactNode }) {
  const aui = useAui();
  const history = useMemo(() => createHistoryAdapter(aui), [aui]);
  const adapters = useMemo(() => ({ history }), [history]);

  return <RuntimeAdapterProvider adapters={adapters}>{children}</RuntimeAdapterProvider>;
}
