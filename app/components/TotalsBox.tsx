import styles from './TotalsBox.module.css';

interface TotalsLine {
  readonly label: string;
  readonly amount: string;
}

interface TotalsBoxProps {
  readonly lines: readonly TotalsLine[];
  readonly total: TotalsLine;
}

export function TotalsBox({ lines, total }: TotalsBoxProps) {
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
    </div>
  );
}
