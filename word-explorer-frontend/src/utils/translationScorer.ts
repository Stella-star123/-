/**
 * 计算两个中文字符串的编辑距离（Levenshtein Distance）
 */
function levenshtein(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;
  const dp: number[][] = Array.from({ length: len1 + 1 }, () =>
    new Array(len2 + 1).fill(0)
  );

  for (let i = 0; i <= len1; i++) dp[i][0] = i;
  for (let j = 0; j <= len2; j++) dp[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] =
          Math.min(dp[i - 1][j], dp[i - 1][j - 1], dp[i][j - 1]) + 1;
      }
    }
  }

  return dp[len1][len2];
}

/**
 * 提取中文关键词（去除标点，按长度排序）
 */
function extractKeywords(text: string): string[] {
  const clean = text.replace(/[，。？！、；：""''（）《》\s]/g, "");
  const words: string[] = [];
  // 简单按2-4字分词（适合中文词汇）
  for (let len = 4; len >= 2; len--) {
    for (let i = 0; i <= clean.length - len; i++) {
      const seg = clean.substring(i, i + len);
      if (!words.includes(seg)) words.push(seg);
    }
  }
  return words;
}

/**
 * 翻译判分
 * @param input 学生输入的中文翻译
 * @param answer 正确答案（支持多个义项，用逗号分隔）
 * @returns 判分结果
 */
export function scoreTranslation(
  input: string,
  answer: string
): { isCorrect: boolean; similarity: number; reference: string } {
  const trimmed = input.trim();
  if (!trimmed) return { isCorrect: false, similarity: 0, reference: answer };

  const answers = answer.split(/[,，、]/).map((s) => s.trim());
  let maxSimilarity = 0;

  for (const ans of answers) {
    // 完全包含核心关键词视为正确
    const keywords = extractKeywords(ans);
    const hasKeyword = keywords.some((kw) => trimmed.includes(kw));
    if (hasKeyword) return { isCorrect: true, similarity: 1, reference: ans };

    // 编辑距离相似度
    const dist = levenshtein(trimmed, ans);
    const sim = 1 - dist / Math.max(trimmed.length, ans.length, 1);
    if (sim > maxSimilarity) maxSimilarity = sim;
  }

  const isCorrect = maxSimilarity >= 0.7;
  return {
    isCorrect,
    similarity: maxSimilarity,
    reference: answers[0],
  };
}
