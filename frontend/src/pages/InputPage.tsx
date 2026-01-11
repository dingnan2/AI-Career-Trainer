import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import { useAppContext } from '../state/AppContext';
import { ResumeUpload } from '../components/ResumeUpload';
import { JdInput } from '../components/JdInput';
import { ApiKeyInput } from '../components/ApiKeyInput';
import { Stepper } from '../components/Stepper';
import { Toast, useToast } from '../components/Toast';
import styles from './InputPage.module.css';

export function InputPage() {
  const navigate = useNavigate();
  const {
    sessionId,
    apiKey,
    resumeInfo,
    backendOnline,
    setSession,
    setApiKey,
    setResume,
    setJd,
    setError,
    setBackendOnline,
  } = useAppContext();

  const { messages, addToast, removeToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize session on mount
  const initSession = useCallback(async () => {
    setIsInitializing(true);
    console.log('Checking backend health...');
    const isOnline = await apiClient.healthCheck();
    console.log('Backend online:', isOnline);
    setBackendOnline(isOnline);

    if (!isOnline) {
      setIsInitializing(false);
      return;
    }

    // If we already have a session, verify it's still valid
    if (sessionId) {
      try {
        const session = await apiClient.getSession(sessionId);
        if (session.has_resume && !resumeInfo) {
          setResume({ session_id: sessionId, file_name: '已上传', file_type: 'unknown', text_chars: 0 });
        }
        setIsInitializing(false);
        return;
      } catch {
        console.log('Session expired, creating new one');
      }
    }

    // Create new session
    try {
      console.log('Creating new session...');
      const newSession = await apiClient.createSession();
      console.log('New session created:', newSession.session_id);
      setSession(newSession.session_id);
    } catch (e) {
      console.error('Failed to create session:', e);
      setError(e instanceof Error ? e.message : 'Failed to initialize');
    }
    setIsInitializing(false);
  }, [sessionId, resumeInfo, setSession, setResume, setError, setBackendOnline]);

  useEffect(() => {
    initSession();
  }, [initSession]);

  // Handle resume upload
  const handleResumeUpload = async (file: File) => {
    if (!sessionId) {
      addToast('会话未初始化，请刷新页面', 'error');
      return;
    }
    setIsUploading(true);

    try {
      const uploadResult = await apiClient.uploadResume(sessionId, file);
      setResume(uploadResult);
      addToast(`简历上传成功！解析了 ${uploadResult.text_chars.toLocaleString()} 字符`, 'success');
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle analyze - navigate to loading page
  const handleAnalyze = (jdText: string, targetRole?: string) => {
    if (!apiKey) {
      addToast('请先输入 OpenAI API Key', 'error');
      return;
    }
    if (!resumeInfo) {
      addToast('请先上传简历', 'error');
      return;
    }
    if (!jdText || jdText.trim().length < 50) {
      addToast('JD 内容太短，请输入更完整的职位描述', 'error');
      return;
    }

    // Save JD to context and navigate
    setJd(jdText, targetRole || '');
    navigate('/loading');
  };

  // Compute current step
  const getCurrentStep = (): 'upload' | 'jd' | 'analyze' | 'result' => {
    if (resumeInfo) return 'jd';
    return 'upload';
  };

  // Backend offline state
  if (backendOnline === false) {
    return (
      <div className={styles.page}>
        <div className={styles.offlineMessage}>
          <span className={styles.offlineIcon}>⚠️</span>
          <h2>后端服务未启动</h2>
          <p>请确保后端服务器正在运行 (端口 8002)</p>
          <button className={styles.retryBtn} onClick={initSession}>
            重试连接
          </button>
        </div>
        <Toast messages={messages} onRemove={removeToast} />
      </div>
    );
  }

  // Initializing state
  if (isInitializing) {
    return (
      <div className={styles.page}>
        <div className={styles.offlineMessage}>
          <div className={styles.spinner} />
          <h2>正在初始化...</h2>
          <p>连接后端服务中</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <span className={styles.logoIcon}>◈</span>
          <h1>AI Career Trainer</h1>
        </div>
        <p className={styles.subtitle}>JD 匹配与差距分析 - 精准定位你的求职优势与提升空间</p>
      </header>

      <Stepper currentStep={getCurrentStep()} />

      <main className={styles.main}>
        <div className={styles.apiKeySection}>
          <h2 className={styles.sectionTitle}>🔑 OpenAI API Key</h2>
          <ApiKeyInput onKeyChange={setApiKey} />
        </div>

        <div className={styles.uploadSection}>
          <ResumeUpload
            resumeInfo={resumeInfo}
            isUploading={isUploading}
            onUpload={handleResumeUpload}
          />
        </div>

        <div className={styles.jdSection}>
          <JdInput
            hasResume={!!resumeInfo}
            isAnalyzing={false}
            onAnalyze={handleAnalyze}
          />
        </div>

        {!apiKey && (
          <p className={styles.keyReminder}>💡 请先输入你的 OpenAI API Key 才能进行分析</p>
        )}
      </main>

      <Toast messages={messages} onRemove={removeToast} />
    </div>
  );
}

