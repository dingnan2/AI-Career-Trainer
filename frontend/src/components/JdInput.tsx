import { useState } from 'react';
import styles from './JdInput.module.css';

const SAMPLE_JD = `【岗位职责】
1. 负责公司核心产品的前端开发工作，包括 Web 应用和移动端 H5 页面
2. 与产品、设计、后端团队紧密协作，高质量交付产品需求
3. 参与前端基础设施建设，提升团队开发效率
4. 关注前端领域新技术，推动技术升级和架构优化

【任职要求】
1. 本科及以上学历，计算机相关专业优先
2. 3年以上前端开发经验，熟练掌握 React/Vue 等主流框架
3. 熟悉 TypeScript，有大型项目 TS 实践经验者优先
4. 了解前端工程化，熟悉 Webpack/Vite 等构建工具
5. 良好的沟通能力和团队协作精神
6. 有组件库开发、性能优化、SSR 经验者加分

【加分项】
- 有开源项目贡献或技术博客
- 熟悉 Node.js，有全栈开发经验
- 了解 CI/CD 流程和自动化测试`;

interface Props {
  hasResume: boolean;
  isAnalyzing: boolean;
  onAnalyze: (jdText: string, targetRole?: string) => void;
}

export function JdInput({ hasResume, isAnalyzing, onAnalyze }: Props) {
  const [jdText, setJdText] = useState('');
  const [targetRole, setTargetRole] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (jdText.trim() && hasResume) {
      onAnalyze(jdText.trim(), targetRole.trim() || undefined);
    }
  };

  const fillSampleJd = () => {
    setJdText(SAMPLE_JD);
    setTargetRole('前端开发工程师');
  };

  const canSubmit = hasResume && jdText.trim().length > 50 && !isAnalyzing;

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>
        <span className={styles.icon}>📝</span>
        职位描述 (JD)
      </h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="targetRole" className={styles.label}>
            目标岗位名称 <span className={styles.optional}>(可选)</span>
          </label>
          <input
            id="targetRole"
            type="text"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="例如：前端开发工程师"
            className={styles.input}
          />
        </div>

        <div className={styles.field}>
          <div className={styles.labelRow}>
            <label htmlFor="jdText" className={styles.label}>
              JD 内容 <span className={styles.required}>*</span>
            </label>
            {!jdText && (
              <button type="button" className={styles.sampleBtn} onClick={fillSampleJd}>
                填入示例 JD
              </button>
            )}
          </div>
          <textarea
            id="jdText"
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="请粘贴完整的职位描述内容..."
            className={styles.textarea}
            rows={12}
          />
          <div className={styles.charCount}>
            {jdText.length} 字符
            {jdText.length > 0 && jdText.length < 50 && (
              <span className={styles.warning}> (建议至少 50 字符)</span>
            )}
          </div>
        </div>

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={!canSubmit}
        >
          {isAnalyzing ? (
            <>
              <span className={styles.btnSpinner} />
              分析中...
            </>
          ) : (
            <>
              <span className={styles.btnIcon}>🔍</span>
              开始分析
            </>
          )}
        </button>

        {!hasResume && (
          <p className={styles.hint}>请先上传简历后再进行分析</p>
        )}
      </form>
    </div>
  );
}

