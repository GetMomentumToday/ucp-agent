import styles from './CheckoutCard.module.css';

interface TotalLine {
  readonly type: string;
  readonly amount: number;
  readonly display_text?: string;
}

interface LineItem {
  readonly item: { readonly title?: string; readonly image?: string };
  readonly quantity: number;
}

interface CheckoutCardProps {
  readonly currency: string;
  readonly lineItems: readonly LineItem[];
  readonly totals: readonly TotalLine[];
  readonly onConfirm?: () => void;
  readonly onCancel?: () => void;
}

function formatCents(cents: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

export function CheckoutCard({
  currency,
  lineItems,
  totals,
  onConfirm,
  onCancel,
}: CheckoutCardProps) {
  const item = lineItems[0];
  const subtotal = totals.find((t) => t.type === 'subtotal');
  const shipping = totals.find((t) => t.type === 'shipping');
  const tax = totals.find((t) => t.type === 'tax');
  const total = totals.find((t) => t.type === 'total');

  return (
    <div className={styles.card}>
      {item && (
        <div className={styles.item}>
          {item.item.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.item.image} alt={item.item.title ?? ''} className={styles.itemImg} />
          ) : (
            <div className={styles.itemPlaceholder}>
              <svg
                viewBox="0 0 24 24"
                width={20}
                height={20}
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          )}
          <div className={styles.itemInfo}>
            <div className={styles.itemName}>{item.item.title ?? 'Item'}</div>
            <div className={styles.itemQty}>Qty: {item.quantity}</div>
          </div>
          {subtotal && (
            <div className={styles.itemPrice}>{formatCents(subtotal.amount, currency)}</div>
          )}
        </div>
      )}

      <div className={styles.lines}>
        {shipping ? (
          <div className={styles.line}>
            <span>Shipping</span>
            <span>{formatCents(shipping.amount, currency)}</span>
          </div>
        ) : (
          <div className={styles.linePending}>
            <span>Shipping</span>
            <span>Calculated after address</span>
          </div>
        )}
        {tax ? (
          <div className={styles.line}>
            <span>Tax</span>
            <span>{formatCents(tax.amount, currency)}</span>
          </div>
        ) : (
          <div className={styles.linePending}>
            <span>Tax</span>
            <span>Calculated after address</span>
          </div>
        )}
      </div>

      {total && (
        <div className={styles.total}>
          <span>Total</span>
          <span>{formatCents(total.amount, currency)}</span>
        </div>
      )}

      {(onConfirm || onCancel) && (
        <div className={styles.actions}>
          {onConfirm && (
            <button type="button" className={styles.btnConfirm} onClick={onConfirm}>
              Yes, place order
            </button>
          )}
          {onCancel && (
            <button type="button" className={styles.btnCancel} onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}
