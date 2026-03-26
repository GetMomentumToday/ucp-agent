'use client';

import styles from './Sidebar.module.css';

interface SidebarProps {
  readonly sessionId: string;
  readonly checkoutId: string | null;
  readonly gatewayConnected: boolean;
}

export function Sidebar({ sessionId, checkoutId, gatewayConnected }: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.title}>UCP Agent</div>

      <div className={styles.label}>Conversations</div>
      <div className={`${styles.item} ${styles.active}`}>Shopping chat</div>
      <div className={styles.item}>New conversation</div>

      <div className={styles.spacer} />

      <div className={styles.label}>Debug</div>
      <div className={styles.debug}>
        Gateway: {gatewayConnected ? '\u2713' : '\u2717'} localhost:3000
      </div>
      <div className={styles.debug}>Session: {sessionId}</div>
      {checkoutId && <div className={styles.debug}>Checkout: {checkoutId}</div>}
    </aside>
  );
}
