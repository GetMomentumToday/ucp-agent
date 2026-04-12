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

function createFormattedAdapter<TMessage, TStorageFormat extends Record<string, unknown>>(
  aui: ReturnType<typeof useAui>,
  formatAdapter: MessageFormatAdapter<TMessage, TStorageFormat>,
): GenericThreadHistoryAdapter<TMessage> {
  return {
    async load(): Promise<MessageFormatRepository<TMessage>> {
      const remoteId = aui.threadListItem().getState().remoteId;
      if (!remoteId) return { messages: [] };

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

export function ServerThreadHistoryProvider({
  children,
}: {
  readonly children: ReactNode;
}) {
  const aui = useAui();
  const history = useMemo(() => createHistoryAdapter(aui), [aui]);
  const adapters = useMemo(() => ({ history }), [history]);

  return <RuntimeAdapterProvider adapters={adapters}>{children}</RuntimeAdapterProvider>;
}
