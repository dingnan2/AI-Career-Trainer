import { useState } from 'react';
import type { JdGapResult } from '../api/client';
import styles from './AnalysisResult.module.css';

interface Props {
  result: JdGapResult;
  onReset: () => void;
  onCopy?: (text: string, label: string) => void;
}

export function AnalysisResult({ result, onReset, onCopy }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string, label?: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
    if (onCopy && label) {
      onCopy(text, label);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--primary)';
    if (score >= 40) return 'var(--warning)';
    return 'var(--error)';
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return { text: '高', color: 'var(--error)' };
      case 'medium': return { text: '中', color: 'var(--warning)' };
      default: return { text: '低', color: 'var(--text-muted)' };
    }
  };

  // Generate copyable action list
  const generateActionList = () => {
    const lines = ['📋 差距行动清单\n'];
    result.gaps.forEach((gap, i) => {
      lines.push(`${i + 1}. [${getPriorityLabel(gap.priority).text}优先级] ${gap.point}`);
      lines.push(`   建议: ${gap.suggestion}\n`);
    });
    return lines.join('\n');
  };

  // Generate copyable resume bullets
  const generateResumeBullets = () => {
    const lines = ['📝 简历要点建议\n'];
    result.keywords.forEach((kw) => {
      lines.push(`• ${kw.recommended_phrase}`);
    });
    return lines.join('\n');
  };

  return (
    <div className={styles.container}>
      {/* Score Card */}
      <div className={styles.scoreCard}>
        <div className={styles.scoreRing} style={{ '--score-color': getScoreColor(result.match_score) } as React.CSSProperties}>
          <svg viewBox="0 0 100 100" className={styles.scoreSvg}>
            <circle cx="50" cy="50" r="45" className={styles.scoreTrack} />
            <circle
              cx="50"
              cy="50"
              r="45"
              className={styles.scoreProgress}
              style={{ strokeDashoffset: 283 - (283 * result.match_score) / 100 }}
            />
          </svg>
          <div className={styles.scoreValue}>
            <span className={styles.scoreNumber}>{result.match_score}</span>
            <span className={styles.scoreLabel}>匹配度</span>
          </div>
        </div>
        <p className={styles.summary}>{result.summary}</p>
      </div>

      {/* Strengths */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3><span className={styles.sectionIcon}>✓</span> 匹配优势</h3>
        </div>
        <div className={styles.list}>
          {result.strengths.map((s, i) => (
            <div key={i} className={styles.strengthItem}>
              <span className={styles.strengthBullet}>●</span>
              <div>
                <p className={styles.strengthPoint}>{s.point}</p>
                {s.evidence && <p className={styles.strengthEvidence}>{s.evidence}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gaps */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3><span className={styles.sectionIcon}>△</span> 差距分析</h3>
          <button
            className={styles.copyBtn}
            onClick={() => copyToClipboard(generateActionList(), 'gaps', '行动清单')}
          >
            {copied === 'gaps' ? '已复制 ✓' : '复制清单'}
          </button>
        </div>
        <div className={styles.list}>
          {result.gaps.map((g, i) => {
            const priority = getPriorityLabel(g.priority);
            return (
              <div key={i} className={styles.gapItem}>
                <span className={styles.priorityBadge} style={{ background: priority.color }}>
                  {priority.text}
                </span>
                <div className={styles.gapContent}>
                  <p className={styles.gapPoint}>{g.point}</p>
                  <p className={styles.gapSuggestion}>💡 {g.suggestion}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Keywords */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3><span className={styles.sectionIcon}>🏷</span> 关键词匹配</h3>
          <button
            className={styles.copyBtn}
            onClick={() => copyToClipboard(generateResumeBullets(), 'keywords', '简历要点')}
          >
            {copied === 'keywords' ? '已复制 ✓' : '复制要点'}
          </button>
        </div>
        <div className={styles.keywordsGrid}>
          {result.keywords.map((kw, i) => (
            <div key={i} className={styles.keywordCard}>
              <span className={styles.keywordTag}>{kw.jd_keyword}</span>
              {kw.evidence && <p className={styles.keywordEvidence}>你的: {kw.evidence}</p>}
              <p className={styles.keywordRecommend}>建议: {kw.recommended_phrase}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CRAFT Questions */}
      {result.craft_questions.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3><span className={styles.sectionIcon}>❓</span> CRAFT 追问建议</h3>
          </div>
          <p className={styles.craftIntro}>以下问题可帮助你补充更多有效信息，提升下一轮分析质量：</p>
          <ul className={styles.craftList}>
            {result.craft_questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className={styles.actions}>
        <button className={styles.resetBtn} onClick={onReset}>
          重新分析
        </button>
      </div>
    </div>
  );
}

