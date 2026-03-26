'use client';

import styles from './Sidebar.module.css';

function handleNewConversation() {
  window.location.reload();
}

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <span className={styles.brandDot} />
        <span className={styles.brandName}>Scout</span>
      </div>

      <div className={styles.label}>Conversations</div>
      <div className={`${styles.item} ${styles.active}`}>
        <span className={styles.itemIcon}>🛍️</span>
        <div>
          <div className={styles.itemTitle}>Shopping chat</div>
          <div className={styles.itemMeta}>Just now</div>
        </div>
      </div>
      <button type="button" className={styles.newBtn} onClick={handleNewConversation}>
        <span className={styles.newBtnIcon}>+</span>
        New conversation
      </button>

      <div className={styles.spacer} />

      <div className={styles.powered}>
        <span className={styles.poweredBadge}>UCP</span>
        Powered by <strong>Momentum</strong>
      </div>
    </aside>
  );
}
