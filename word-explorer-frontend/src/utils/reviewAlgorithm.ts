/**
 * SM-2 改进版间隔重复算法
 * 用于计算单词的复习间隔
 */

export interface ReviewRecord {
  wordId: string;
  repetitions: number;   // 已复习次数
  efactor: number;        // 容易度因子（初始2.5）
  interval: number;       // 当前间隔天数
  nextReviewAt: number;   // 下次复习时间戳
  lastQuality: number;    // 上次答题质量 0-5
}

/**
 * 计算下次复习间隔
 * @param quality 答题质量 0-5（0=完全不会，5=完美答对）
 * @param repetitions 已复习次数
 * @param efactor 容易度因子（初始2.5）
 * @param interval 当前间隔天数
 * @returns 下次复习间隔（天）、更新后的efactor、更新后的repetitions
 */
export function calculateNextReview(
  quality: number,
  repetitions: number,
  efactor: number,
  interval: number
): { nextInterval: number; newEfactor: number; newRepetitions: number } {
  // 答题质量 < 3（不正确），重置复习次数
  if (quality < 3) {
    return {
      nextInterval: 1,
      newEfactor: Math.max(1.3, efactor - 0.2),
      newRepetitions: 0,
    };
  }

  // 更新容易度因子
  const newEfactor =
    efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  const clampedEfactor = Math.max(1.3, newEfactor);

  let nextInterval: number;
  const newRepetitions = repetitions + 1;

  if (newRepetitions === 1) {
    nextInterval = 1;
  } else if (newRepetitions === 2) {
    nextInterval = 3;
  } else {
    nextInterval = Math.round(interval * clampedEfactor);
  }

  return { nextInterval, newEfactor: clampedEfactor, newRepetitions };
}

/**
 * 获取今日待复习单词的查询条件
 */
export function getDueReviewCutoff(): number {
  return Date.now();
}

/**
 * 计算掌握度（0-100）
 * 基于复习次数和间隔天数
 */
export function calculateMastery(repetitions: number, interval: number): number {
  // 最高掌握度100
  const repetitionScore = Math.min(repetitions, 5) * 15; // 最多75分
  const intervalScore = Math.min(interval, 30) * 0.83; // 最多25分
  return Math.min(100, Math.round(repetitionScore + intervalScore));
}
