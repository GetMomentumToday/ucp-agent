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

        {error && <div className={styles.error}>Error: {error.message}</div>}

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

interface ToolPart {
  readonly toolName: string;
  readonly state: string;
  readonly output?: unknown;
}

function extractToolPart(part: { type: string }): ToolPart | null {
  if (part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
    const p = part as unknown as { toolName?: string; state: string; output?: unknown };
    return {
      toolName: p.toolName ?? part.type.replace('tool-', ''),
      state: p.state,
      output: p.output,
    };
  }
  return null;
}

function MessageBubble({ message }: { readonly message: UIMessage }) {
  const isUser = message.role === 'user';

  if (isUser) {
    const text = message.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('');

    return (
      <div className={`${styles.msg} ${styles.user}`}>
        <div className={styles.bubble}>
          <div className={styles.bubbleText}>{text}</div>
        </div>
      </div>
    );
  }

  const toolParts: ToolPart[] = [];
  const textParts: string[] = [];

  for (const part of message.parts) {
    const tp = extractToolPart(part);
    if (tp) {
      toolParts.push(tp);
    } else if (part.type === 'text' && (part as { text: string }).text.trim()) {
      textParts.push((part as { text: string }).text);
    }
  }

  const hasContent = textParts.length > 0 || toolParts.some((t) => t.output !== null && t.output !== undefined);
  const completedTools = toolParts.filter((t) => t.output !== null && t.output !== undefined);

  return (
    <div className={`${styles.msg} ${styles.agent}`}>
      {toolParts.map((tp, i) => (
        <ToolIndicator key={`tool-${i}`} toolName={tp.toolName} state={tp.state} />
      ))}

      {hasContent && (
        <div className={styles.bubble}>
          {textParts.map((text, i) => (
            <div key={`text-${i}`} className={styles.bubbleText}>
              {text}
            </div>
          ))}
          {completedTools.map((tp, i) => (
            <ToolResultRenderer key={`result-${i}`} toolName={tp.toolName} result={tp.output} />
          ))}
        </div>
      )}
    </div>
  );
}
