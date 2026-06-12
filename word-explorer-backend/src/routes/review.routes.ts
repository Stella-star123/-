import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { PrismaClient } from "@prisma/client";
import { findWordById, getWordEn } from "../utils/wordLoader";

const router = Router();
const prisma = new PrismaClient();

// 获取待复习列表（基于记忆曲线）
router.get("/due", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const now = new Date();

    const dueReviews = await prisma.reviewRecord.findMany({
      where: {
        userId,
        nextReviewAt: { lte: now },
      },
      orderBy: {
        nextReviewAt: "asc",
      },
    });

    // 丰富返回数据：为每个 review 记录附加完整单词信息
    const enrichedReviews = dueReviews.map((review) => {
      const word = findWordById(review.wordId);
      return {
        id: review.id,
        wordId: review.wordId,
        wordEn: review.wordEn,
        repetitions: review.repetitions,
        efactor: review.efactor,
        interval: review.interval,
        nextReviewAt: review.nextReviewAt,
        lastQuality: review.lastQuality,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt,
        // 附加完整单词信息
        word: word
          ? {
              id: word.id,
              en: word.en,
              phonetic: word.phonetic || "",
              pos: word.pos || "",
              cn: word.cn || [],
              example: word.example || "",
              exampleCn: word.exampleCn || "",
              grade: word.grade,
              semester: word.semester,
              unit: word.unit,
            }
          : null,
      };
    });

    res.json({
      total: enrichedReviews.length,
      reviews: enrichedReviews,
    });
  } catch (error) {
    console.error("获取待复习列表错误:", error);
    res.status(500).json({ message: "获取待复习列表失败" });
  }
});

// 提交复习结果（更新记忆曲线）
router.post("/submit", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { wordId, quality } = req.body;

    if (!wordId || quality === undefined) {
      res.status(400).json({ message: "参数不完整" });
      return;
    }

    const qualityNum = parseInt(quality);
    if (isNaN(qualityNum) || qualityNum < 0 || qualityNum > 5) {
      res.status(400).json({ message: "quality 必须是 0-5 之间的整数" });
      return;
    }

    // 查找现有复习记录
    let review = await prisma.reviewRecord.findUnique({
      where: {
        userId_wordId: {
          userId,
          wordId,
        },
      },
    });

    let repetitions = 0;
    let efactor = 2.5;
    let interval = 0;
    let nextReviewAt = new Date();

    if (review) {
      repetitions = review.repetitions;
      efactor = review.efactor;
      interval = review.interval;
    }

    // SM-2 算法
    if (qualityNum < 3) {
      // 答错，重置
      repetitions = 0;
      interval = 1;
    } else {
      repetitions += 1;
      efactor = efactor + (0.1 - (5 - qualityNum) * (0.08 + (5 - qualityNum) * 0.02));
      efactor = Math.max(1.3, efactor);

      if (repetitions === 1) {
        interval = 1;
      } else if (repetitions === 2) {
        interval = 3;
      } else {
        interval = Math.round(interval * efactor);
      }
    }

    nextReviewAt = new Date();
    nextReviewAt.setDate(nextReviewAt.getDate() + interval);

    if (review) {
      await prisma.reviewRecord.update({
        where: { id: review.id },
        data: {
          repetitions,
          efactor,
          interval,
          nextReviewAt,
          lastQuality: qualityNum,
        },
      });
    } else {
      await prisma.reviewRecord.create({
        data: {
          userId,
          wordId,
          wordEn: getWordEn(wordId),
          repetitions,
          efactor,
          interval,
          nextReviewAt,
          lastQuality: qualityNum,
        },
      });
    }

    res.json({
      message: "复习记录已更新",
      nextReviewAt,
      interval,
    });
  } catch (error) {
    console.error("提交复习结果错误:", error);
    res.status(500).json({ message: "提交复习结果失败" });
  }
});

// 获取错题本
router.get("/wrong-books", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const wrongWords = await prisma.wrongWord.findMany({
      where: {
        userId,
        mastered: false,
      },
      orderBy: {
        wrongCount: "desc",
      },
    });

    // 丰富返回数据：为每个错题记录附加完整单词信息
    const enrichedWrongWords = wrongWords.map((w) => {
      const word = findWordById(w.wordId);
      return {
        id: w.id,
        wordId: w.wordId,
        wordEn: w.wordEn,
        wrongCount: w.wrongCount,
        lastWrongAt: w.lastWrongAt,
        mastered: w.mastered,
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
        // 附加完整单词信息
        word: word
          ? {
              id: word.id,
              en: word.en,
              phonetic: word.phonetic || "",
              pos: word.pos || "",
              cn: word.cn || [],
              example: word.example || "",
              exampleCn: word.exampleCn || "",
              grade: word.grade,
              semester: word.semester,
              unit: word.unit,
            }
          : null,
      };
    });

    res.json({
      total: enrichedWrongWords.length,
      wrongWords: enrichedWrongWords,
    });
  } catch (error) {
    console.error("获取错题本错误:", error);
    res.status(500).json({ message: "获取错题本失败" });
  }
});

// 标记错题为已掌握
router.put("/wrong-books/:wordId/mastered", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { wordId } = req.params;

    await prisma.wrongWord.updateMany({
      where: {
        userId,
        wordId,
      },
      data: {
        mastered: true,
      },
    });

    res.json({ message: "已标记为掌握" });
  } catch (error) {
    console.error("标记掌握错误:", error);
    res.status(500).json({ message: "标记失败" });
  }
});

export default router;
