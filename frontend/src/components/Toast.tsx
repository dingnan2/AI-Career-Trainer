import { useEffect, useState } from 'react';
import styles from './Toast.module.css';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface Props {
  messages: ToastMessage[];
  onRemove: (id: string) => void;
}

export function Toast({ messages, onRemove }: Props) {
  return (
    <div className={styles.container}>
      {messages.map((msg) => (
        <ToastItem key={msg.id} message={msg} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ message, onRemove }: { message: ToastMessage; onRemove: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(message.id), 300);
    }, 2500);
    return () => clearTimeout(timer);
  }, [message.id, onRemove]);

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
  };

  return (
    <div className={`${styles.toast} ${styles[message.type]} ${isExiting ? styles.exit : ''}`}>
      <span className={styles.icon}>{icons[message.type]}</span>
      <span>{message.message}</span>
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: ToastMessage['type'] = 'success') => {
    const id = Date.now().toString();
    setMessages((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  };

  return { messages, addToast, removeToast };
}

