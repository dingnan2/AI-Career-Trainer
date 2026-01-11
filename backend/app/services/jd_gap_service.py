"""JD Gap Analysis service using OpenAI."""

from typing import Optional

from app.infra.openai_client import openai_client
from app.schemas import Gap, JdGapResult, Keyword, Strength


class JdGapService:
    """Analyzes gap between resume and job description using LLM."""

    SYSTEM_PROMPT = """你是一位资深的求职顾问和简历专家。你的任务是分析求职者的简历与目标职位描述(JD)之间的匹配度。

请基于以下维度进行分析：
1. 技能匹配度
2. 经验相关性
3. 教育背景契合度
4. 项目/成就与岗位需求的对应关系

你必须返回一个严格的JSON对象，格式如下：
{
  "match_score": 0-100的整数,
  "summary": "一句话总结匹配情况",
  "strengths": [
    {"point": "匹配优势点", "evidence": "简历中的具体证据"}
  ],
  "gaps": [
    {"point": "差距点", "priority": "high/medium/low", "suggestion": "改进建议"}
  ],
  "keywords": [
    {"jd_keyword": "JD关键词", "evidence": "简历中的对应内容(可为null)", "recommended_phrase": "建议在简历中使用的表述"}
  ],
  "craft_questions": ["帮助求职者补充信息的追问问题"]
}

注意：
- strengths 数量为 3-6 个
- gaps 数量为 3-6 个，按 priority 排序（high在前）
- keywords 数量为 5-10 个最重要的关键词
- craft_questions 数量为 2-4 个，用于帮助求职者补充更多有效信息
- 所有内容使用中文"""

    def _build_user_prompt(
        self,
        resume_text: str,
        jd_text: str,
        target_role: Optional[str] = None,
    ) -> str:
        role_info = f"目标岗位：{target_role}\n\n" if target_role else ""
        return f"""{role_info}## 简历内容
{resume_text[:8000]}

## 职位描述 (JD)
{jd_text[:8000]}

请分析简历与JD的匹配情况，并返回JSON格式的分析结果。"""

    async def analyze(
        self,
        resume_text: str,
        jd_text: str,
        target_role: Optional[str] = None,
        api_key: Optional[str] = None,
    ) -> JdGapResult:
        """Perform JD gap analysis."""
        messages = [
            {"role": "system", "content": self.SYSTEM_PROMPT},
            {"role": "user", "content": self._build_user_prompt(resume_text, jd_text, target_role)},
        ]

        result = await openai_client.chat_json(messages, temperature=0.5, api_key=api_key)

        # Validate and transform to pydantic model
        return JdGapResult(
            match_score=int(result.get("match_score", 50)),
            summary=result.get("summary", "分析完成"),
            strengths=[
                Strength(point=s["point"], evidence=s.get("evidence", ""))
                for s in result.get("strengths", [])
            ],
            gaps=[
                Gap(
                    point=g["point"],
                    priority=g.get("priority", "medium"),
                    suggestion=g.get("suggestion", ""),
                )
                for g in result.get("gaps", [])
            ],
            keywords=[
                Keyword(
                    jd_keyword=k["jd_keyword"],
                    evidence=k.get("evidence"),
                    recommended_phrase=k.get("recommended_phrase", ""),
                )
                for k in result.get("keywords", [])
            ],
            craft_questions=result.get("craft_questions", []),
        )


# Singleton instance
jd_gap_service = JdGapService()

