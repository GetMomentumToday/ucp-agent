const STORAGE_KEY = 'ucp-agent-conversations';
const MAX_CONVERSATIONS = 50;

export interface StoredConversation {
  readonly remoteId: string;
  readonly title: string | undefined;
  readonly status: 'regular' | 'archived';
  readonly createdAt: number;
}

function readAll(): readonly StoredConversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredConversation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(conversations: readonly StoredConversation[]): void {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = conversations.slice(0, MAX_CONVERSATIONS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // quota exceeded or other storage error — silently ignore
  }
}

export function loadConversations(): readonly StoredConversation[] {
  return readAll();
}

export function saveConversation(conv: StoredConversation): void {
  const existing = readAll();
  const filtered = existing.filter((c) => c.remoteId !== conv.remoteId);
  writeAll([conv, ...filtered]);
}

export function updateConversation(
  remoteId: string,
  updates: Partial<Pick<StoredConversation, 'title' | 'status'>>,
): void {
  const existing = readAll();
  const updated = existing.map((c) => (c.remoteId === remoteId ? { ...c, ...updates } : c));
  writeAll(updated);
}

export function deleteConversation(remoteId: string): void {
  const existing = readAll();
  const filtered = existing.filter((c) => c.remoteId !== remoteId);
  writeAll(filtered);
}

export function findConversation(remoteId: string): StoredConversation | undefined {
  return readAll().find((c) => c.remoteId === remoteId);
}
