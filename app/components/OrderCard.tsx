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

export function OrderCard({ orderId, totalCents, currency, status }: OrderCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.title}>
        {'\u2713'} Order #{orderId}
      </div>
      <div className={styles.detail}>
        Total: {formatPrice(totalCents, currency)} &middot; Status: {status}
      </div>
    </div>
  );
}
