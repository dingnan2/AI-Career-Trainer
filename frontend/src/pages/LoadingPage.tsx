import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAppContext } from '../state/AppContext';
import styles from './LoadingPage.module.css';

export function LoadingPage() {
  const navigate = useNavigate();
  const {
    sessionId,
    apiKey,
    resumeInfo,
    jdText,
    targetRole,
    setResult,
    setError,
  } = useAppContext();

  const hasStarted = useRef(false);

  useEffect(() => {
    // Prevent double execution in StrictMode
    if (hasStarted.current) return;

    // Validate required data
    if (!sessionId || !apiKey || !resumeInfo || !jdText) {
      console.error('Missing required data for analysis');
      navigate('/input', { replace: true });
      return;
    }

    hasStarted.current = true;

    const runAnalysis = async () => {
      try {
        console.log('Starting analysis...');
        const result = await apiClient.analyzeJdGap(
          {
            session_id: sessionId,
            jd_text: jdText,
            target_role: targetRole || undefined,
          },
          apiKey
        );
        console.log('Analysis complete:', result);
        setResult(result);
        navigate('/result', { replace: true });
      } catch (e) {
        console.error('Analysis failed:', e);
        setError(e instanceof Error ? e.message : 'Analysis failed');
        navigate('/input', { replace: true });
      }
    };

    runAnalysis();
  }, [sessionId, apiKey, resumeInfo, jdText, targetRole, setResult, setError, navigate]);

  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.loaderContainer}>
          <div className={styles.loader}>
            <div className={styles.ring}></div>
            <div className={styles.ring}></div>
            <div className={styles.ring}></div>
          </div>
        </div>

        <h1 className={styles.title}>正在分析中</h1>
        <p className={styles.subtitle}>AI 正在对比你的简历与 JD...</p>

        <div className={styles.steps}>
          <div className={styles.step}>
            <span className={styles.stepIcon}>📄</span>
            <span>解析简历内容</span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepIcon}>📝</span>
            <span>提取 JD 关键词</span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepIcon}>🔍</span>
            <span>匹配度分析</span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepIcon}>💡</span>
            <span>生成建议</span>
          </div>
        </div>

        <p className={styles.hint}>分析通常需要 10-30 秒，请稍候...</p>
      </div>
    </div>
  );
}

