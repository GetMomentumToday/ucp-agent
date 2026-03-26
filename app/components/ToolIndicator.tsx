import styles from './ToolIndicator.module.css';

interface ToolIndicatorProps {
  readonly toolName: string;
  readonly state: string;
}

export function ToolIndicator({ toolName, state }: ToolIndicatorProps) {
  const isComplete = state === 'result';
  return (
    <div className={styles.indicator}>
      <span className={`${styles.dot} ${isComplete ? styles.done : styles.running}`} />
      <span>{isComplete ? 'called' : 'calling'} {toolName}</span>
    </div>
  );
}
