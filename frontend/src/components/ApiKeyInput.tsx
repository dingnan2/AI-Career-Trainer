import { useState, useEffect } from 'react';
import styles from './ApiKeyInput.module.css';

const STORAGE_KEY = 'career_trainer_openai_key';

interface Props {
  onKeyChange: (key: string | null) => void;
}

export function ApiKeyInput({ onKeyChange }: Props) {
  const [key, setKey] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [hasStoredKey, setHasStoredKey] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setKey(stored);
      setHasStoredKey(true);
      onKeyChange(stored);
    }
  }, [onKeyChange]);

  const handleSave = () => {
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEY, key.trim());
      setHasStoredKey(true);
      setIsEditing(false);
      onKeyChange(key.trim());
    }
  };

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setKey('');
    setHasStoredKey(false);
    setIsEditing(false);
    onKeyChange(null);
  };

  if (hasStoredKey && !isEditing) {
    return (
      <div className={styles.container}>
        <div className={styles.savedState}>
          <span className={styles.keyIcon}>🔑</span>
          <span className={styles.maskedKey}>sk-...{key.slice(-4)}</span>
          <button className={styles.editBtn} onClick={() => setIsEditing(true)}>
            修改
          </button>
          <button className={styles.clearBtn} onClick={handleClear}>
            清除
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.inputGroup}>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="输入你的 OpenAI API Key (sk-...)"
          className={styles.input}
        />
        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={!key.trim()}
        >
          保存
        </button>
        {hasStoredKey && (
          <button className={styles.cancelBtn} onClick={() => setIsEditing(false)}>
            取消
          </button>
        )}
      </div>
      <p className={styles.hint}>
        🔒 Key 仅保存在你的浏览器本地，不会上传到服务器存储
      </p>
    </div>
  );
}

export function getStoredApiKey(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

