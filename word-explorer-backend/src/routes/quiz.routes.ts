import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { PrismaClient } from "@prisma/client";
import { getWordEn } from "../utils/wordLoader";

const router = Router();
const prisma = new PrismaClient();

interface QuizSubmitRequest {
  grade: number;
  semester: number;
  unit: number;
  answers: {
    wordId: string;
    isCorrect: boolean;
    timeSpent: number;
  }[];
  score: number;
  expGained: number;
}

// 提交答题结果
router.post("/submit", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const body = req.body as QuizSubmitRequest;
    const { grade, semester, unit, answers, score, expGained } = body;

    if (!grade || !semester || !unit || !answers) {
      res.status(400).json({ message: "参数不完整" });
      return;
    }

    // 计算星级
    const total = answers.length;
    const correct = answers.filter(a => a.isCorrect).length;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;
    let stars = 0;
    if (accuracy >= 95) stars = 3;
    else if (accuracy >= 85) stars = 2;
    else if (accuracy >= 70) stars = 1;

    // 更新或创建单元进度
    const existing = await prisma.unitProgress.findUnique({
      where: {
        userId_grade_semester_unit: {
          userId,
          grade,
          semester,
          unit,
        },
      },
    });

    if (existing) {
      await prisma.unitProgress.update({
        where: { id: existing.id },
        data: {
          stars: Math.max(existing.stars, stars),
          bestScore: Math.max(existing.bestScore, score),
          completed: stars > 0,
          lastReviewAt: new Date(),
        },
      });
    } else {
      await prisma.unitProgress.create({
        data: {
          userId,
          grade,
          semester,
          unit,
          stars,
          bestScore: score,
          completed: stars > 0,
          lastReviewAt: new Date(),
        },
      });
    }

    // 更新错题本
    for (const ans of answers) {
      if (!ans.isCorrect) {
        const existingWrong = await prisma.wrongWord.findUnique({
          where: {
            userId_wordId: {
              userId,
              wordId: ans.wordId,
            },
          },
        });
        if (existingWrong) {
          await prisma.wrongWord.update({
            where: { id: existingWrong.id },
            data: {
              wrongCount: { increment: 1 },
              lastWrongAt: new Date(),
            },
          });
        } else {
          await prisma.wrongWord.create({
            data: {
              userId,
              wordId: ans.wordId,
              wordEn: getWordEn(ans.wordId),
              wrongCount: 1,
            },
          });
        }
      } else {
        // 答对了，如果错题本里有则删除或标记已掌握
        await prisma.wrongWord.deleteMany({
          where: {
            userId,
            wordId: ans.wordId,
          },
        });
      }
    }

    // 更新用户经验值
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      const newExp = user.exp + expGained;
      const newLevel = Math.floor(newExp / 100) + 1;
      const newExpToNext = 100 - (newExp % 100);
      await prisma.user.update({
        where: { id: userId },
        data: {
          exp: newExp,
          level: newLevel,
          expToNextLevel: newExpToNext,
          totalWords: user.totalWords + correct,
        },
      });
    }

    res.json({
      message: "提交成功",
      stars,
      newExp: user?.exp + expGained,
    });
  } catch (error) {
    console.error("提交答题结果错误:", error);
    res.status(500).json({ message: "提交失败，请稍后重试" });
  }
});

export default router;
