'use client';

import { useMemo } from 'react';
import { DefaultChatTransport } from 'ai';
import {
  AssistantRuntimeProvider,
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
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

function MyThread() {
  return (
    <ThreadPrimitive.Root className={styles.threadRoot}>
      <div className={styles.chatHeader}>
        <div className={styles.chatHeaderLeft}>
          <span className={styles.chatHeaderTitle}>Shopping assistant</span>
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

        <div style={{ height: 1 }} />
      </ThreadPrimitive.Viewport>

      <MyComposer />
    </ThreadPrimitive.Root>
  );
}

function MyUserMessage() {
  return (
    <div className={`${styles.msg} ${styles.userMsg}`}>
      <MessagePrimitive.Content />
    </div>
  );
}

function MyAssistantMessage() {
  return (
    <div className={`${styles.msg} ${styles.agentMsg}`}>
      <MessagePrimitive.Content
        components={{
          Text: ({ text }) => <p className={styles.agentText}>{text}</p>,
        }}
      />
    </div>
  );
}

function MyComposer() {
  return (
    <ComposerPrimitive.Root className={styles.inputRow}>
      <ComposerPrimitive.Input placeholder="Type a message..." className={styles.chatInput} />
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
        <div className={styles.header}>localhost:3001</div>
        <div className={styles.wrap}>
          <Sidebar sessionId={sessionId} checkoutId={null} gatewayConnected={true} />
          <MyThread />
        </div>
      </main>
    </AssistantRuntimeProvider>
  );
}
