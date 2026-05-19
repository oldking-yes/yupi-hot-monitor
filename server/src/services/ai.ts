import OpenAI from 'openai';
import type { AIAnalysis } from '../types.js';

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY ?? '',
  baseURL: 'https://api.deepseek.com/v1'
});

// ========== Query Expansion（查询扩展） ==========

/**
 * 使用 AI 将关键词扩展为多个变体，用于文本预过滤。
 * 返回扩展后的关键词列表（含原始关键词）。
 * 结果会被缓存，同一关键词不会重复调用 AI。
 */
const expansionCache = new Map<string, string[]>();

export async function expandKeyword(keyword: string): Promise<string[]> {
  // 缓存命中
  if (expansionCache.has(keyword)) {
    return expansionCache.get(keyword)!;
  }

  // 不管 AI 是否可用，先提取基础核心词
  const coreTerms = extractCoreTerms(keyword);

  if (!process.env.DEEPSEEK_API_KEY) {
    const result = [keyword, ...coreTerms];
    expansionCache.set(keyword, result);
    return result;
  }

  try {
    const result = await openai.chat.completions.create({
      model: 'deepseek-v4-flash',
      messages: [
        {
          role: 'system',
          content: `你是一个搜索查询扩展专家。给定一个监控关键词，生成该关键词的变体和相关检索词，用于文本匹配。

规则：
1. 包含原始关键词的各种写法（大小写、空格、连字符变体）
2. 包含关键词的核心组成词（拆分后的各个有意义的词）
3. 包含常见别称、缩写、中英文对照
4. 不要加入泛化词（比如关键词是"Claude Sonnet 4.6"，不要加"AI模型"这种泛化词）
5. 总数控制在 5-15 个

输出 JSON 数组，只输出 JSON，不要有其他内容。
示例输入："Claude Sonnet 4.6"
示例输出：["Claude Sonnet 4.6", "Claude Sonnet", "Sonnet 4.6", "claude-sonnet-4.6", "Claude 4.6", "Anthropic Sonnet"]`
        },
        {
          role: 'user',
          content: keyword
        }
      ],
      temperature: 0.2,
      max_tokens: 300
    });

    const rawContent = result.choices[0]?.message?.content || '';
    const responseContent = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);
    // 尝试匹配 JSON 数组（支持 markdown 代码块包裹的情况）
    const jsonMatch = responseContent.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/)  // markdown code block
      || responseContent.match(/\[[\s\S]*\]/);  // bare array
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed: string[] = JSON.parse(jsonStr);
      // 确保原始关键词和核心词都在列表中
      const expanded = [...new Set([keyword, ...coreTerms, ...parsed.map(s => s.trim()).filter(Boolean)])];
      expansionCache.set(keyword, expanded);
      console.log(`  🔍 Query expansion AI for "${keyword}": ${expanded.length} variants (AI contributed ${parsed.length})`);
      return expanded;
    }
    console.warn(`  ⚠️ Query expansion: AI returned non-JSON, falling back. Content: ${responseContent.slice(0, 100)}`);
  } catch (error) {
    console.error('Query expansion failed:', error);
  }

  // Fallback：使用基础核心词
  const fallback = [keyword, ...coreTerms];
  expansionCache.set(keyword, fallback);
  return fallback;
}

// 过于通用的英文单词，不适合作为预匹配关键词
const STOP_WORDS = new Set([
  'code', 'ai', 'api', 'app', 'web', 'data', 'use', 'new', 'open',
  'free', 'best', 'top', 'how', 'why', 'what', 'the', 'and', 'for',
  'pro', 'max', 'plus', 'lite', 'beta', 'test', 'demo', 'tool',
  'guide', 'tips', 'list', 'vs', 'or', 'in', 'on', 'at', 'to',
  'with', 'from', 'your', 'all', 'one', 'get', 'now', '2024', '2025',
  '2026', 'review', 'reviews', 'update', 'version', 'download',
  'python', 'java', 'go', 'rust', 'js', 'ts', 'css', 'html',
]);

/**
 * 从关键词中提取核心词（纯文本方式，不依赖 AI）
 */
function extractCoreTerms(keyword: string): string[] {
  const terms: string[] = [];
  const parts = keyword.split(/[\s\-_\/\\·]+/).filter(p => p.length >= 2);

  // 单字词：如果关键词本身够独特（≥4字符且非停用词），无需拆分
  if (parts.length === 1) {
    const word = parts[0].toLowerCase();
    if (word.length >= 4 && !STOP_WORDS.has(word)) {
      return [];
    }
    return [];
  }

  // 多字词：只保留有区分度的词（≥4字符 且 不在停用词表中）
  const significantParts = parts.filter(p =>
    p.length >= 4 && !STOP_WORDS.has(p.toLowerCase())
  );

  if (significantParts.length >= 1) {
    terms.push(...significantParts);
    // 两两组合
    for (let i = 0; i < significantParts.length - 1; i++) {
      terms.push(significantParts[i] + ' ' + significantParts[i + 1]);
    }
  }

  // 去重，排除原始关键词本身
  const lowerKeyword = keyword.toLowerCase();
  return [...new Set(terms)].filter(t => t.toLowerCase() !== lowerKeyword);
}

// ========== 关键词预匹配 ==========

export interface PreMatchResult {
  matched: boolean;
  matchedTerms: string[];
  /** 匹配强度 0-100: 完整关键词=100, 多词部分=60-80, 单词=30-50 */
  strength: number;
}

/**
 * 检查文本中是否包含扩展关键词（不区分大小写）。
 * 匹配强度：完整关键词 > 多词组合 > 单词匹配
 */
export function preMatchKeyword(text: string, expandedKeywords: string[], originalKeyword?: string): PreMatchResult {
  const lowerText = text.toLowerCase();
  const matchedTerms: string[] = [];
  let maxStrength = 0;

  // 优先级最高：检查原始完整关键词
  if (originalKeyword && lowerText.includes(originalKeyword.toLowerCase())) {
    matchedTerms.push(originalKeyword);
    maxStrength = 100;
  }

  for (const kw of expandedKeywords) {
    if (lowerText.includes(kw.toLowerCase())) {
      matchedTerms.push(kw);
      // 评估匹配强度：多词 > 单词
      const wordCount = kw.split(/\s+/).length;
      const charLength = kw.length;
      let strength = 0;
      if (wordCount >= 3 && charLength >= 10) strength = 85;
      else if (wordCount >= 2 && charLength >= 8) strength = 70;
      else if (wordCount >= 2 || charLength >= 6) strength = 55;
      else strength = 35;
      maxStrength = Math.max(maxStrength, strength);
    }
  }

  return {
    matched: matchedTerms.length > 0,
    matchedTerms,
    strength: maxStrength
  };
}

// ========== AI 内容分析（关键词感知） ==========

function buildAnalysisPrompt(keyword: string, preMatchResult: PreMatchResult): string {
  let matchHint: string;
  if (preMatchResult.strength >= 80) {
    matchHint = `\n注意：文本预匹配发现内容中明确提到了关键词"${keyword}"或其等价表述（匹配强度: ${preMatchResult.strength}）。`;
  } else if (preMatchResult.matched) {
    matchHint = `\n注意：文本预匹配发现内容中部分匹配到关键词"${keyword}"的相关词：${preMatchResult.matchedTerms.join('、')}（匹配强度: ${preMatchResult.strength}，较弱）。请更严格地审核内容是否真正与"${keyword}"直接相关。`;
  } else {
    matchHint = `\n注意：文本预匹配未发现内容中提及关键词"${keyword}"的任何变体，请特别严格审核相关性。`;
  }

  return `你是一个热点内容精准匹配专家。你的任务是判断一段内容是否与指定的监控关键词【${keyword}】直接相关。

${matchHint}

分析要点：
1. 判断是否为真实有价值的信息（排除标题党、假新闻、营销软文）
2. 判断内容是否【直接】涉及关键词"${keyword}"。注意：
   - 仅仅属于同一领域但未提及关键词的内容，相关性应低于 40 分
   - 内容必须直接讨论、提及或与"${keyword}"有实质关联才能获得 60 分以上
   - 只是间接沾边（如同类产品、同领域但不同主题）应给 30-50 分
3. 判断内容中是否直接提及了"${keyword}"或其等价表述（keywordMentioned）
4. 评估热点的重要程度（对关注"${keyword}"的人来说有多重要）
5. 用一句话说明此内容与"${keyword}"的关系（不是介绍内容本身，而是说"此内容与关键词的关联是什么"）
6. 用一句话解释你的相关性打分理由

请以 JSON 格式输出：
{
  "isReal": true/false,
  "relevance": 0-100,
  "relevanceReason": "相关性打分理由...",
  "keywordMentioned": true/false,
  "importance": "low/medium/high/urgent",
  "summary": "此内容与【${keyword}】的关联：..."
}

只输出 JSON，不要有其他内容。`;
}

export async function analyzeContent(content: string, keyword: string, preMatchResult?: PreMatchResult): Promise<AIAnalysis> {
  // 默认预匹配结果
  const matchResult = preMatchResult ?? { matched: false, matchedTerms: [], strength: 0 };

  if (!process.env.DEEPSEEK_API_KEY) {
    console.warn('DeepSeek API key not configured, using fallback analysis');
    // fallback: 匹配强度映射到基础分数
    const fallbackRelevance = matchResult.strength >= 80 ? 55
      : matchResult.strength >= 55 ? 35
      : matchResult.matched ? 20
      : 10;
    return {
      isReal: true,
      relevance: fallbackRelevance,
      relevanceReason: '未配置 AI 服务，根据匹配强度估算',
      keywordMentioned: matchResult.strength >= 55,
      importance: 'low',
      summary: content.slice(0, 80) + '...'
    };
  }

  try {
    const prompt = buildAnalysisPrompt(keyword, matchResult);

    const result = await openai.chat.completions.create({
      model: 'deepseek-v4-flash',
      messages: [
        {
          role: 'system',
          content: prompt
        },
        {
          role: 'user',
          content: content.slice(0, 2000) // 限制内容长度
        }
      ],
      temperature: 0.2, // 降低温度，提高判断一致性
      max_tokens: 500
    });

    const rawContent = result.choices[0]?.message?.content || '';
    const responseContent = typeof rawContent === 'string' ? rawContent : JSON.stringify(rawContent);
    
    // 尝试解析 JSON
    const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        isReal: Boolean(parsed.isReal),
        relevance: Math.min(100, Math.max(0, Number(parsed.relevance) || 0)),
        relevanceReason: String(parsed.relevanceReason || '').slice(0, 200),
        keywordMentioned: Boolean(parsed.keywordMentioned),
        importance: ['low', 'medium', 'high', 'urgent'].includes(parsed.importance) 
          ? parsed.importance 
          : 'low',
        summary: String(parsed.summary || '').slice(0, 150)
      };
    }

    throw new Error('Failed to parse AI response');
  } catch (error) {
    console.error('AI analysis failed:', error);
    return {
      isReal: true,
      relevance: matchResult.strength >= 55 ? 30 : matchResult.matched ? 15 : 5,
      relevanceReason: 'AI 分析失败，使用默认分数',
      keywordMentioned: matchResult.strength >= 55,
      importance: 'low',
      summary: content.slice(0, 50) + '...'
    };
  }
}

export async function batchAnalyze(contents: string[], keyword: string, expandedKeywords?: string[]): Promise<AIAnalysis[]> {
  // 并行分析，但限制并发数
  const batchSize = 3;
  const results: AIAnalysis[] = [];

  for (let i = 0; i < contents.length; i += batchSize) {
    const batch = contents.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(content => {
        const preMatch = expandedKeywords
          ? preMatchKeyword(content, expandedKeywords, keyword)
          : undefined;
        return analyzeContent(content, keyword, preMatch);
      })
    );
    results.push(...batchResults);
  }

  return results;
}
