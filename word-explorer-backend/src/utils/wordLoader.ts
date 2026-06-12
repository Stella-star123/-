import * as fs from "fs";
import * as path from "path";

// 词库文件缓存
const wordCache: Record<string, any[]> = {};

/** 从 JSON 文件加载词库 */
export function loadWordFile(grade: number, unit: number): any[] {
  const cacheKey = `${grade}-${unit}`;
  if (wordCache[cacheKey]) {
    return wordCache[cacheKey];
  }

  const filePath = path.resolve(
    __dirname,
    "../../../word-explorer-frontend/src/data",
    `grade${grade}-unit${unit}.json`
  );

  try {
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      wordCache[cacheKey] = data;
      return data;
    }
  } catch (err) {
    console.error(`加载词库文件失败: ${filePath}`, err);
  }

  wordCache[cacheKey] = [];
  return [];
}

/** 从所有词库中查找单词详情（遍历 7-8 年级，每个年级 1-8 单元） */
export function findWordById(wordId: string): any | null {
  for (let grade = 7; grade <= 8; grade++) {
    for (let unit = 1; unit <= 8; unit++) {
      const words = loadWordFile(grade, unit);
      const found = words.find((w) => w.id === wordId);
      if (found) return found;
    }
  }
  return null;
}

/** 从 wordId 获取真实英文单词 */
export function getWordEn(wordId: string): string {
  const word = findWordById(wordId);
  return word?.en || wordId;
}
