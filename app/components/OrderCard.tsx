import styles from './OrderCard.module.css';

interface OrderCardProps {
  readonly orderId: string;
  readonly totalCents: number;
  readonly currency: string;
  readonly status: string;
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

const TIMELINE_STEPS = ['Ordered', 'Processing', 'Shipped', 'Delivered'] as const;

function getActiveIndex(status: string): number {
  const map: Record<string, number> = {
    pending: 0,
    processing: 1,
    shipped: 2,
    complete: 3,
    delivered: 3,
  };
  return map[status.toLowerCase()] ?? 0;
}

export function OrderCard({ orderId, totalCents, currency, status }: OrderCardProps) {
  const activeIdx = getActiveIndex(status);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.check}>{'\u2713'}</span>
        <div>
          <div className={styles.title}>Order Confirmed</div>
          <div className={styles.orderId}>#{orderId}</div>
        </div>
      </div>

      <div className={styles.timeline}>
        {TIMELINE_STEPS.map((step, i) => (
          <div key={step} className={styles.timelineItem}>
            {i > 0 && (
              <div
                className={`${styles.timelineLine} ${i <= activeIdx ? styles.lineActive : ''}`}
              />
            )}
            <div className={styles.timelineStep}>
              <span className={`${styles.timelineDot} ${i <= activeIdx ? styles.dotActive : ''}`} />
              <span className={i <= activeIdx ? styles.stepActive : styles.stepInactive}>
                {step}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <span className={styles.total}>
          Total: <strong>{formatPrice(totalCents, currency)}</strong>
        </span>
      </div>
    </div>
  );
}
