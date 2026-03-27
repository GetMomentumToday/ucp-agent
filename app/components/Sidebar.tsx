'use client';

import { ThreadListPrimitive, ThreadListItemPrimitive } from '@assistant-ui/react';
import styles from './Sidebar.module.css';

function ConversationItem() {
  return (
    <ThreadListItemPrimitive.Root className={styles.itemRoot}>
      <ThreadListItemPrimitive.Trigger className={styles.item}>
        <span className={styles.itemIcon}>💬</span>
        <div className={styles.itemContent}>
          <ThreadListItemPrimitive.Title fallback="New chat" />
        </div>
      </ThreadListItemPrimitive.Trigger>
      <ThreadListItemPrimitive.Delete className={styles.deleteBtn} aria-label="Delete conversation">
        ×
      </ThreadListItemPrimitive.Delete>
    </ThreadListItemPrimitive.Root>
  );
}

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandDot} />
        <span className={styles.brandName}>Scout</span>
      </div>

      <div className={styles.label}>Conversations</div>

      <div className={styles.conversationList}>
        <ThreadListPrimitive.Root>
          <ThreadListPrimitive.New className={styles.newBtn}>
            <span className={styles.newBtnIcon}>+</span>
            New conversation
          </ThreadListPrimitive.New>
          <ThreadListPrimitive.Items components={{ ThreadListItem: ConversationItem }} />
        </ThreadListPrimitive.Root>
      </div>

      <div className={styles.spacer} />

      <div className={styles.powered}>
        <span className={styles.poweredBadge}>UCP</span>
        Powered by <strong>Momentum</strong>
      </div>
    </aside>
  );
}
