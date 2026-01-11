import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../state/AppContext';
import { AnalysisResult } from '../components/AnalysisResult';
import { Toast, useToast } from '../components/Toast';
import styles from './ResultPage.module.css';

export function ResultPage() {
  const navigate = useNavigate();
  const { result, resetAll } = useAppContext();
  const { messages, addToast, removeToast } = useToast();

  // Redirect if no result
  useEffect(() => {
    if (!result) {
      navigate('/input', { replace: true });
    }
  }, [result, navigate]);

  // Handle restart
  const handleRestart = () => {
    resetAll();
    navigate('/input', { replace: true });
  };

  // Handle copy with toast
  const handleCopy = (_text: string, label: string) => {
    addToast(`${label} 已复制到剪贴板`, 'success');
  };

  if (!result) {
    return null;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.logo}>
            <span className={styles.logoIcon}>◈</span>
            <h1>分析结果</h1>
          </div>
          <button className={styles.restartBtn} onClick={handleRestart}>
            🔄 重新开始
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <AnalysisResult result={result} onReset={handleRestart} onCopy={handleCopy} />
      </main>

      <Toast messages={messages} onRemove={removeToast} />
    </div>
  );
}

