'use client';

import { useMemo, useState } from 'react';
import { DefaultChatTransport } from 'ai';
import {
  AssistantRuntimeProvider,
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ActionBarPrimitive,
  AuiIf,
  makeAssistantToolUI,
} from '@assistant-ui/react';
import { useChatRuntime } from '@assistant-ui/react-ai-sdk';
import { useTheme } from 'next-themes';
import { UCP_TOOL_RENDER } from '@/lib/ucp-toolkit';
import { Sidebar } from './components/Sidebar';
import styles from './page.module.css';

function useStableSessionId(): string {
  return useMemo(() => `sess_${Math.random().toString(36).slice(2, 8)}`, []);
}

const TOOL_NAMES = Object.keys(UCP_TOOL_RENDER);

const toolUIs = TOOL_NAMES.filter((name) => UCP_TOOL_RENDER[name] !== undefined).map((toolName) => {
  const renderFn = UCP_TOOL_RENDER[toolName]!;
  return makeAssistantToolUI({
    toolName,
    render: (props) => {
      const status = { type: props.status?.type ?? 'complete' };
      return <>{renderFn({ args: props.args ?? {}, result: props.result, status })}</>;
    },
  });
});

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button
      className={styles.themeToggle}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      type="button"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19'}
    </button>
  );
}

function CopyIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width={12}
      height={12}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <rect x="5" y="5" width="8" height="8" rx="1.5" />
      <path d="M3 11V3.5A1.5 1.5 0 014.5 2H11" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width={12}
      height={12}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M3 8.5l3 3 7-7" />
    </svg>
  );
}

function ReloadIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width={12}
      height={12}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path d="M2.5 8a5.5 5.5 0 019.3-4M13.5 8a5.5 5.5 0 01-9.3 4" />
      <path d="M12 1v3.5h-3.5M4 15v-3.5h3.5" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width={14}
      height={14}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

function CopyButton() {
  const [copied, setCopied] = useState(false);
  return (
    <ActionBarPrimitive.Copy
      className={styles.actionBtn}
      aria-label="Copy message"
      onClick={() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </ActionBarPrimitive.Copy>
  );
}

function MyThread() {
  return (
    <ThreadPrimitive.Root className={styles.threadRoot}>
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderLeft}>
          <span className={styles.agentAvatar}>S</span>
          <div>
            <span className={styles.chatHeaderTitle}>Scout</span>
            <span className={styles.chatHeaderSub}>Shopping assistant</span>
          </div>
        </div>
        <ThemeToggle />
      </div>

      <ThreadPrimitive.Viewport className={styles.viewport}>
        <ThreadPrimitive.Empty>
          <div className={styles.welcome}>
            <div className={styles.welcomeIcon}>&#x1F6D2;</div>
            <h2 className={styles.welcomeTitle}>Welcome to Scout</h2>
            <p className={styles.welcomeText}>
              I can help you find products, compare options, and complete purchases. Try one of
              these:
            </p>
            <div className={styles.suggestions}>
              <ThreadPrimitive.Suggestion prompt="Show me running shoes" autoSend>
                <span className={styles.suggestion}>Show me running shoes</span>
              </ThreadPrimitive.Suggestion>
              <ThreadPrimitive.Suggestion prompt="What bags do you have?" autoSend>
                <span className={styles.suggestion}>What bags do you have?</span>
              </ThreadPrimitive.Suggestion>
              <ThreadPrimitive.Suggestion prompt="Find a jacket under $100" autoSend>
                <span className={styles.suggestion}>Find a jacket under $100</span>
              </ThreadPrimitive.Suggestion>
            </div>
          </div>
        </ThreadPrimitive.Empty>

        <ThreadPrimitive.Messages
          components={{
            UserMessage: MyUserMessage,
            AssistantMessage: MyAssistantMessage,
          }}
        />

        <AuiIf condition={(s) => s.thread.isRunning}>
          <div className={styles.typingRow}>
            <span className={styles.agentAvatarSmall}>S</span>
            <div className={styles.typing}>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </div>
          </div>
        </AuiIf>

        <div style={{ height: 1 }} />
      </ThreadPrimitive.Viewport>

      <ScrollToBottomButton />
      <MyComposer />
    </ThreadPrimitive.Root>
  );
}

function ScrollToBottomButton() {
  return (
    <ThreadPrimitive.ScrollToBottom className={styles.scrollToBottom}>
      <ChevronDownIcon />
    </ThreadPrimitive.ScrollToBottom>
  );
}

function MyUserMessage() {
  return (
    <div className={styles.userRow}>
      <div className={`${styles.msg} ${styles.userMsg}`}>
        <MessagePrimitive.Content />
      </div>
      <span className={styles.userAvatar}>U</span>
    </div>
  );
}

function ToolCallFallback(props: { toolName: string; result?: unknown; status: { type: string } }) {
  const isDone = props.status.type === 'complete';
  return (
    <div className={styles.toolFallback}>
      <span className={isDone ? styles.toolDotDone : styles.toolDotRunning} />
      <span>
        {isDone ? 'called' : 'calling'} {props.toolName}
      </span>
    </div>
  );
}

function MyAssistantMessage() {
  return (
    <div className={styles.agentRow}>
      <span className={styles.agentAvatarSmall}>S</span>
      <div className={`${styles.msg} ${styles.agentMsg}`}>
        <MessagePrimitive.Content
          components={{
            Text: ({ text }) => {
              if (!text.trim()) return null;
              return (
                <p
                  className={styles.agentText}
                  dangerouslySetInnerHTML={{
                    __html: text
                      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br />'),
                  }}
                />
              );
            },
            tools: { Fallback: ToolCallFallback },
          }}
        />
        <MessagePrimitive.Error>
          <div className={styles.errorMsg}>Something went wrong. Please try again.</div>
        </MessagePrimitive.Error>
        <div className={styles.actionBar}>
          <CopyButton />
          <ActionBarPrimitive.Reload className={styles.actionBtn} aria-label="Regenerate">
            <ReloadIcon />
          </ActionBarPrimitive.Reload>
        </div>
      </div>
    </div>
  );
}

function MyComposer() {
  return (
    <ComposerPrimitive.Root className={styles.inputRow}>
      <ComposerPrimitive.Input
        placeholder="Type a message..."
        className={styles.chatInput}
        autoFocus
        rows={1}
      />
      <ComposerPrimitive.Send className={styles.sendBtn}>
        <svg viewBox="0 0 16 16" width={14} height={14}>
          <path d="M2 8L14 2L9 14L7.5 9.5Z" fill="currentColor" />
        </svg>
      </ComposerPrimitive.Send>
    </ComposerPrimitive.Root>
  );
}

export default function ChatPage() {
  const sessionId = useStableSessionId();

  const transport = useMemo(
    () => new DefaultChatTransport({ api: '/api/chat', body: { sessionId } }),
    [sessionId],
  );

  const runtime = useChatRuntime({ transport });

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {toolUIs.map((ToolUI, i) => (
        <ToolUI key={i} />
      ))}

      <main className={styles.main}>
        <div className={styles.wrap}>
          <Sidebar />
          <MyThread />
        </div>
      </main>
    </AssistantRuntimeProvider>
  );
}
