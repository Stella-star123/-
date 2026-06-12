import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

const router = Router();

// 词库文件缓存
const wordCache: Record<string, any[]> = {};

/**
 * 从 JSON 文件加载词库
 * 词库文件位于前端 src/data/ 目录
 */
function loadWordFile(grade: number, unit: number): any[] {
  const cacheKey = `${grade}-${unit}`;
  if (wordCache[cacheKey]) {
    return wordCache[cacheKey];
  }

  // 后端从项目根目录查找前端 data 目录
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

// 获取单元单词列表
router.get("/:grade/:semester/:unit", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { grade, semester, unit } = req.params;
    const gradeNum = parseInt(grade);
    const semesterNum = parseInt(semester);
    const unitNum = parseInt(unit);

    if (isNaN(gradeNum) || isNaN(semesterNum) || isNaN(unitNum)) {
      res.status(400).json({ message: "年级、学期和单元必须是数字" });
      return;
    }

    // 从 JSON 词库文件加载
    const words = loadWordFile(gradeNum, unitNum);
    // 按 semester 过滤（JSON 文件中包含 semester 字段）
    const filteredWords = words.filter((w) => w.semester === semesterNum);

    res.json({
      grade: gradeNum,
      semester: semesterNum,
      unit: unitNum,
      words: filteredWords,
      total: filteredWords.length,
    });
  } catch (error) {
    console.error("获取单词错误:", error);
    res.status(500).json({ message: "获取单词失败" });
  }
});

// 获取年级所有单元进度
router.get("/progress/:grade", authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const grade = parseInt(req.params.grade);

    if (isNaN(grade)) {
      res.status(400).json({ message: "年级必须是数字" });
      return;
    }

    // 从数据库查询该年级下所有学期、所有单元的进度
    const records = await prisma.unitProgress.findMany({
      where: { userId, grade },
      select: {
        grade: true,
        semester: true,
        unit: true,
        stars: true,
        bestScore: true,
        completed: true,
        lastReviewAt: true,
      },
    });

    // 构建进度映射：key = "grade-semester-unit"
    const progressMap: Record<string, any> = {};
    for (const r of records) {
      const key = `${r.grade}-${r.semester}-${r.unit}`;
      progressMap[key] = {
        grade: r.grade,
        semester: r.semester,
        unit: r.unit,
        stars: r.stars,
        bestScore: r.bestScore,
        completed: r.completed,
        lastReviewAt: r.lastReviewAt ? new Date(r.lastReviewAt).getTime() : 0,
      };
    }

    res.json({
      grade,
      progress: progressMap,
    });
  } catch (error) {
    console.error("获取进度错误:", error);
    res.status(500).json({ message: "获取进度失败" });
  }
});

export default router;
