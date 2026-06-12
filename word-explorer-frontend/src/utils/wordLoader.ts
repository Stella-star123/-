import type { WordEntry } from "../types/word";

/**
 * 动态加载词库 JSON 文件
 * 使用动态 import 按需加载，避免打包所有词库
 * 
 * 文件命名规则:
 * - 上册 (semester=1): grade{grade}-unit{unit}.json  (如 grade7-unit1.json)
 * - 下册 (semester=2): grade{grade}-s2-unit{unit}.json (如 grade7-s2-unit1.json)
 */
const wordCache: Record<string, WordEntry[]> = {};

export async function loadWords(
  grade: number,
  semester: number,
  unit: number
): Promise<WordEntry[]> {
  const cacheKey = `${grade}-${semester}-${unit}`;
  if (wordCache[cacheKey]) {
    return wordCache[cacheKey];
  }

  // 根据学期选择不同的文件命名
  const filePath = semester === 2
    ? `../data/grade${grade}-s2-unit${unit}.json`
    : `../data/grade${grade}-unit${unit}.json`;

  try {
    const module = await import(filePath);
    wordCache[cacheKey] = module.default;
    return module.default;
  } catch {
    console.warn(`词库文件 ${filePath} 未找到`);
    return [];
  }
}

/**
 * 获取指定单元的词库（同步方式，适用于已有缓存的情况）
 */
export function getCachedWords(
  grade: number,
  semester: number,
  unit: number
): WordEntry[] {
  const cacheKey = `${grade}-${semester}-${unit}`;
  return wordCache[cacheKey] || [];
}

/**
 * 预加载词库
 */
export async function preloadWords(
  grade: number,
  semester: number,
  unit: number
): Promise<void> {
  await loadWords(grade, semester, unit);
}

/**
 * 根据 wordId 加载单个单词（遍历所有年级/学期/单元）
 * wordId 格式如: "g7u1-01", "g8s2u3-05"
 */
export async function loadWordById(wordId: string): Promise<WordEntry | null> {
  // 解析 wordId 获取年级、学期、单元信息
  // 格式: g{grade}{s2?}u{unit}-{index}
  const match = wordId.match(/^g(\d+)(s2)?u(\d+)-/);
  if (match) {
    const grade = parseInt(match[1]);
    const semester = match[2] ? 2 : 1;
    const unit = parseInt(match[3]);
    const words = await loadWords(grade, semester, unit);
    return words.find((w) => w.id === wordId) || null;
  }

  // 如果无法解析 wordId，遍历所有词库查找
  for (let grade = 7; grade <= 8; grade++) {
    for (let semester = 1; semester <= 2; semester++) {
      for (let unit = 1; unit <= 8; unit++) {
        const words = await loadWords(grade, semester, unit);
        const found = words.find((w) => w.id === wordId);
        if (found) return found;
      }
    }
  }
  return null;
}
