'use client';

import { useChat } from '@ai-sdk/react';

export default function ChatPage() {
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: '/api/chat',
  });

  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 24, fontFamily: 'system-ui' }}>
      <h1>UCP Shopping Assistant</h1>

      <div style={{ marginBottom: 16 }}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              padding: '8px 12px',
              margin: '4px 0',
              borderRadius: 8,
              background: m.role === 'user' ? '#e3f2fd' : '#f5f5f5',
            }}
          >
            <strong>{m.role === 'user' ? 'You' : 'Assistant'}:</strong>
            <div style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
          </div>
        ))}
      </div>

      {error && (
        <div style={{ color: 'red', marginBottom: 8 }}>Error: {error.message}</div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Search for products, ask about orders..."
          style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          style={{ padding: '8px 16px', borderRadius: 4, cursor: 'pointer' }}
        >
          {isLoading ? '...' : 'Send'}
        </button>
      </form>
    </main>
  );
}
