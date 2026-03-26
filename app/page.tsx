'use client';

import { useState, useMemo } from 'react';
import { DefaultChatTransport } from 'ai';
import { useChat } from '@ai-sdk/react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import styles from './page.module.css';

function useStableId(): string {
  return useMemo(() => `sess_${Math.random().toString(36).slice(2, 8)}`, []);
}

export default function ChatPage() {
  const sessionId = useStableId();

  const transport = useMemo(
    () => new DefaultChatTransport({ api: '/api/chat', body: { sessionId } }),
    [sessionId],
  );

  const { messages, status, error, sendMessage } = useChat({ transport });

  const [input, setInput] = useState('');
  const [gatewayConnected] = useState(true);

  const isLoading = status === 'submitted' || status === 'streaming';

  const checkoutId = extractCheckoutId(messages);

  const handleSubmit = (): void => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    void sendMessage({ text });
  };

  return (
    <main className={styles.main}>
      <div className={styles.header}>localhost:3001 — demo page</div>
      <div className={styles.wrap}>
        <Sidebar
          sessionId={sessionId}
          checkoutId={checkoutId}
          gatewayConnected={gatewayConnected}
        />
        <ChatArea
          messages={messages}
          input={input}
          isLoading={isLoading}
          error={error}
          sessionId={sessionId}
          onInputChange={setInput}
          onSubmit={handleSubmit}
        />
      </div>
    </main>
  );
}

function extractCheckoutId(
  messages: readonly { parts: readonly { type: string }[] }[],
): string | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (!msg) continue;
    for (const part of msg.parts) {
      if (part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
        const toolPart = part as { output?: unknown };
        if (toolPart.output && typeof toolPart.output === 'object' && 'id' in toolPart.output) {
          const output = toolPart.output as { id?: string; status?: string };
          if (output.id && output.status) {
            return output.id;
          }
        }
      }
    }
  }
  return null;
}
