'use client';

import { useRef, useEffect } from 'react';
import type { UIMessage } from 'ai';
import styles from './ChatArea.module.css';
import { ToolIndicator } from './ToolIndicator';
import { ToolResultRenderer } from './ToolResultRenderer';
import { TypingIndicator } from './TypingIndicator';

interface ChatAreaProps {
  readonly messages: readonly UIMessage[];
  readonly input: string;
  readonly isLoading: boolean;
  readonly error: Error | undefined;
  readonly sessionId: string;
  readonly onInputChange: (value: string) => void;
  readonly onSubmit: () => void;
}

export function ChatArea({
  messages,
  input,
  isLoading,
  error,
  sessionId,
  onInputChange,
  onSubmit,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className={styles.chatArea}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Shopping assistant</span>
        <span className={styles.sessionBadge}>{sessionId}</span>
      </div>

      <div className={styles.messages}>
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isLoading && (
          <div className={`${styles.msg} ${styles.agent}`}>
            <TypingIndicator />
          </div>
        )}

        {error && (
          <div className={styles.error}>Error: {error.message}</div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputRow}>
        <input
          className={styles.chatInput}
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search for products, ask about orders..."
          disabled={isLoading}
        />
        <button
          className={styles.sendBtn}
          onClick={onSubmit}
          disabled={isLoading || !input.trim()}
          type="button"
        >
          <svg viewBox="0 0 16 16" width={14} height={14}>
            <path d="M2 8L14 2L9 14L7.5 9.5Z" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { readonly message: UIMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`${styles.msg} ${isUser ? styles.user : styles.agent}`}>
      {message.parts.map((part, i) => {
        const key = `${message.id}-${i}`;

        if (part.type === 'text' && part.text.trim()) {
          return (
            <div key={key} className={styles.bubble}>
              <div className={styles.bubbleText}>{part.text}</div>
            </div>
          );
        }

        if (part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
          const toolPart = part as { toolName?: string; state: string; output?: unknown };
          const toolName = toolPart.toolName ?? part.type.replace('tool-', '');
          return (
            <div key={key}>
              <ToolIndicator toolName={toolName} state={toolPart.state} />
              {toolPart.state === 'result' && toolPart.output != null && (
                <ToolResultRenderer toolName={toolName} result={toolPart.output} />
              )}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
