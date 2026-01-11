import styles from './Stepper.module.css';

interface Step {
  id: string;
  label: string;
  icon: string;
}

const STEPS: Step[] = [
  { id: 'upload', label: '上传简历', icon: '📄' },
  { id: 'jd', label: '粘贴JD', icon: '📝' },
  { id: 'analyze', label: '分析匹配', icon: '🔍' },
  { id: 'result', label: '查看结果', icon: '✅' },
];

interface Props {
  currentStep: 'upload' | 'jd' | 'analyze' | 'result';
}

export function Stepper({ currentStep }: Props) {
  const currentIndex = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className={styles.stepper}>
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isPending = index > currentIndex;

        return (
          <div
            key={step.id}
            className={`${styles.step} ${isCompleted ? styles.completed : ''} ${isCurrent ? styles.current : ''} ${isPending ? styles.pending : ''}`}
          >
            <div className={styles.iconWrapper}>
              <span className={styles.icon}>
                {isCompleted ? '✓' : step.icon}
              </span>
            </div>
            <span className={styles.label}>{step.label}</span>
            {index < STEPS.length - 1 && <div className={styles.connector} />}
          </div>
        );
      })}
    </div>
  );
}

