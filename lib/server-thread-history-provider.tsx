'use client';

import { useMemo, type ReactNode } from 'react';
import { RuntimeAdapterProvider } from '@assistant-ui/react';
import { useAuiState } from '@assistant-ui/store';
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

function createFormattedAdapter<TMessage, TStorageFormat extends Record<string, unknown>>(
  remoteId: string,
  formatAdapter: MessageFormatAdapter<TMessage, TStorageFormat>,
): GenericThreadHistoryAdapter<TMessage> {
  return {
    async load(): Promise<MessageFormatRepository<TMessage>> {
      const res = await fetch(`/api/threads/${remoteId}/messages`);
      if (!res.ok) return { messages: [] };

      const data = (await res.json()) as {
        messages: MessageStorageEntry<TStorageFormat>[];
      };

      const decoded = data.messages.map((entry) => formatAdapter.decode(entry));
      const headId =
        decoded.length > 0 ? formatAdapter.getId(decoded[decoded.length - 1]!.message) : undefined;

      return { messages: decoded, headId };
    },

    async append(item: MessageFormatItem<TMessage>): Promise<void> {
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

function createHistoryAdapter(remoteId: string): ThreadHistoryAdapter {
  return {
    async load(): Promise<ExportedMessageRepository & { unstable_resume?: boolean }> {
      return { messages: [] };
    },

    async append(_item: ExportedMessageRepositoryItem): Promise<void> {},

    withFormat<TMessage, TStorageFormat extends Record<string, unknown>>(
      formatAdapter: MessageFormatAdapter<TMessage, TStorageFormat>,
    ): GenericThreadHistoryAdapter<TMessage> {
      return createFormattedAdapter(remoteId, formatAdapter);
    },
  };
}

export function ServerThreadHistoryProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const remoteId = useAuiState((s) => s.threadListItem.remoteId);

  const history = useMemo((): ThreadHistoryAdapter | undefined => {
    if (!remoteId) return undefined;
    return createHistoryAdapter(remoteId);
  }, [remoteId]);

  if (!history) return <>{children}</>;

  return <RuntimeAdapterProvider adapters={{ history }}>{children}</RuntimeAdapterProvider>;
}
