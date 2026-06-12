import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

/** 根据用户数据计算成就列表 */
function computeAchievements(user: {
  totalWords: number;
  streak: number;
  totalDays: number;
  createdAt: Date;
}): {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}[] {
  const now = Date.now();
  const achievements = [
    {
      id: "1",
      name: "初出茅庐",
      description: "完成第一次答题",
      icon: "🌱",
      unlocked: user.totalWords > 0,
      unlockedAt: user.createdAt.getTime(),
    },
    {
      id: "2",
      name: "连胜达人",
      description: "连续答对20题",
      icon: "🔥",
      unlocked: user.streak >= 20,
      unlockedAt: undefined,
    },
    {
      id: "3",
      name: "词汇大师",
      description: "掌握500个单词",
      icon: "📚",
      unlocked: user.totalWords >= 500,
      unlockedAt: undefined,
    },
    {
      id: "4",
      name: "锲而不舍",
      description: "连续打卡7天",
      icon: "⭐",
      unlocked: user.streak >= 7,
      unlockedAt: undefined,
    },
    {
      id: "5",
      name: "记忆王者",
      description: "完成100次复习",
      icon: "🧠",
      unlocked: user.totalDays >= 100,
      unlockedAt: undefined,
    },
    {
      id: "6",
      name: "闯关高手",
      description: "通关10个单元",
      icon: "🏆",
      unlocked: false, // 需要额外查询单元进度
      unlockedAt: undefined,
    },
  ];

  return achievements;
}

// 获取用户统计数据
router.get("/stats", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        nickname: true,
        level: true,
        exp: true,
        expToNextLevel: true,
        streak: true,
        totalWords: true,
        totalDays: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "用户不存在" });
      return;
    }

    // 获取错题数量
    const wrongCount = await prisma.wrongWord.count({
      where: { userId, mastered: false },
    });

    // 获取已完成的单元数
    const completedUnits = await prisma.unitProgress.count({
      where: { userId, completed: true },
    });

    // 获取待复习数量
    const dueReviews = await prisma.reviewRecord.count({
      where: {
        userId,
        nextReviewAt: { lte: new Date() },
      },
    });

    // 获取复习总数
    const totalReviews = await prisma.reviewRecord.count({
      where: { userId },
    });

    // 获取 TOP5 错题单词
    const topWrongWords = await prisma.wrongWord.findMany({
      where: { userId, mastered: false },
      orderBy: { wrongCount: "desc" },
      take: 5,
      select: {
        wordId: true,
        wordEn: true,
        wrongCount: true,
      },
    });

    // 计算成就
    const achievements = computeAchievements(user);

    // 如果闯关超过 10 个单元，解锁"闯关高手"
    const updatedAchievements = achievements.map((a) => {
      if (a.id === "6" && completedUnits >= 10) {
        return { ...a, unlocked: true };
      }
      return a;
    });

    // 计算正确率（基于复习记录的 lastQuality 平均值估算）
    let accuracy = 0;
    const reviewRecords = await prisma.reviewRecord.findMany({
      where: { userId },
      select: { lastQuality: true },
    });
    if (reviewRecords.length > 0) {
      const totalQuality = reviewRecords.reduce(
        (sum, r) => sum + r.lastQuality,
        0
      );
      accuracy = Math.round((totalQuality / (reviewRecords.length * 5)) * 100);
    }

    // 最近7天学习分钟数（综合复习记录 + 单元进度记录估算）
    const weeklyMinutes = Array(7).fill(0);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // 从复习记录估算（每次复习约 0.5-1 分钟）
    const recentReviews = await prisma.reviewRecord.findMany({
      where: {
        userId,
        updatedAt: { gte: sevenDaysAgo },
      },
      select: { updatedAt: true, lastQuality: true },
    });
    for (const r of recentReviews) {
      const dayIndex = Math.floor(
        (new Date().getTime() - r.updatedAt.getTime()) / (24 * 60 * 60 * 1000)
      );
      if (dayIndex >= 0 && dayIndex < 7) {
        // 根据掌握程度估算：低质量(需要思考更久)算1分钟，高质量算0.5分钟
        const minutes = r.lastQuality >= 4 ? 0.5 : 1;
        weeklyMinutes[6 - dayIndex] += minutes;
      }
    }

    // 从单元进度记录估算（每次完成单元练习约 8-15 分钟）
    const recentUnitProgress = await prisma.unitProgress.findMany({
      where: {
        userId,
        lastReviewAt: { gte: sevenDaysAgo },
      },
      select: { lastReviewAt: true, stars: true },
    });
    for (const p of recentUnitProgress) {
      const dayIndex = Math.floor(
        (new Date().getTime() - p.lastReviewAt.getTime()) / (24 * 60 * 60 * 1000)
      );
      if (dayIndex >= 0 && dayIndex < 7) {
        // 星级越高说明做了越多题，估算时间越长
        const minutes = p.stars >= 3 ? 15 : p.stars >= 2 ? 12 : 8;
        weeklyMinutes[6 - dayIndex] += minutes;
      }
    }

    // 四舍五入到整数分钟
    for (let i = 0; i < 7; i++) {
      weeklyMinutes[i] = Math.round(weeklyMinutes[i]);
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        level: user.level,
        exp: user.exp,
        expToNextLevel: user.expToNextLevel,
        streak: user.streak,
        totalWords: user.totalWords,
        totalDays: user.totalDays,
        createdAt: user.createdAt.getTime(),
      },
      stats: {
        wrongCount,
        completedUnits,
        dueReviews,
        totalReviews,
        accuracy,
        weeklyMinutes,
        topWrongWords: topWrongWords.map((w) => ({
          word: w.wordEn,
          wordId: w.wordId,
          count: w.wrongCount,
        })),
      },
      achievements: updatedAchievements,
    });
  } catch (error) {
    console.error("获取用户统计错误:", error);
    res.status(500).json({ message: "获取用户统计失败" });
  }
});

export default router;
