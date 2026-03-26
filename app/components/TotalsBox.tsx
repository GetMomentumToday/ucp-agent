import styles from './TotalsBox.module.css';

interface TotalsLine {
  readonly label: string;
  readonly amount: string;
}

interface TotalsBoxProps {
  readonly lines: readonly TotalsLine[];
  readonly total: TotalsLine;
  readonly onConfirm?: () => void;
  readonly onCancel?: () => void;
}

export function TotalsBox({ lines, total, onConfirm, onCancel }: TotalsBoxProps) {
  return (
    <div className={styles.box}>
      {lines.map((line) => (
        <div key={line.label} className={styles.row}>
          <span>{line.label}</span>
          <span>{line.amount}</span>
        </div>
      ))}
      <div className={`${styles.row} ${styles.total}`}>
        <span>{total.label}</span>
        <span>{total.amount}</span>
      </div>
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
