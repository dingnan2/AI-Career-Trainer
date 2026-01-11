import { useRef, useState } from 'react';
import type { ResumeUploadResponse } from '../api/client';
import styles from './ResumeUpload.module.css';

interface Props {
  resumeInfo: ResumeUploadResponse | null;
  isUploading: boolean;
  onUpload: (file: File) => void;
}

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

const ACCEPTED_EXTENSIONS = '.pdf,.docx,.txt';

export function ResumeUpload({ resumeInfo, isUploading, onUpload }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && ACCEPTED_TYPES.includes(file.type)) {
      onUpload(file);
    }
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        <span className={styles.icon}>📄</span>
        简历上传
      </h2>

      <div
        className={`${styles.dropzone} ${dragOver ? styles.dragOver : ''} ${resumeInfo ? styles.hasFile : ''}`}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleFileChange}
          className={styles.hiddenInput}
        />

        {isUploading ? (
          <div className={styles.uploading}>
            <div className={styles.spinner} />
            <span>上传中...</span>
          </div>
        ) : resumeInfo ? (
          <div className={styles.fileInfo}>
            <span className={styles.fileIcon}>✓</span>
            <div className={styles.fileDetails}>
              <p className={styles.fileName}>{resumeInfo.file_name}</p>
              <p className={styles.fileMeta}>
                {resumeInfo.text_chars > 0 
                  ? `✅ 上传成功！${resumeInfo.text_chars.toLocaleString()} 字符已解析`
                  : '✅ 上传成功！'}
              </p>
            </div>
            <button className={styles.changeBtn} onClick={(e) => { e.stopPropagation(); handleClick(); }}>
              更换
            </button>
          </div>
        ) : (
          <div className={styles.placeholder}>
            <span className={styles.uploadIcon}>⬆</span>
            <p className={styles.mainText}>点击或拖拽上传简历</p>
            <p className={styles.subText}>支持 PDF、DOCX、TXT 格式</p>
          </div>
        )}
      </div>
      <p className={styles.privacyNote}>
        🔒 文件仅临时存储 24 小时，之后自动删除。我们不会永久保存你的简历。
      </p>
    </div>
  );
}

