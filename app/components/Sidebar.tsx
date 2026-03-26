'use client';

import styles from './Sidebar.module.css';

function handleNewConversation() {
  window.location.reload();
}

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.title}>Scout</div>

      <div className={styles.label}>Conversations</div>
      <div className={`${styles.item} ${styles.active}`}>Shopping chat</div>
      <button type="button" className={styles.newBtn} onClick={handleNewConversation}>
        + New conversation
      </button>

      <div className={styles.spacer} />

      <div className={styles.powered}>
        Powered by <strong>Momentum</strong>
      </div>
    </aside>
  );
}
