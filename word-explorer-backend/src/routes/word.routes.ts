import { Router, Request, Response } from "express";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// 获取单元单词列表
router.get("/:grade/:unit", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { grade, unit } = req.params;
    const gradeNum = parseInt(grade);
    const unitNum = parseInt(unit);

    if (isNaN(gradeNum) || isNaN(unitNum)) {
      res.status(400).json({ message: "年级和单元必须是数字" });
      return;
    }

    // TODO: 从数据库或词库文件获取单词
    // 目前返回空数组，前端使用模拟数据
    res.json({
      grade: gradeNum,
      unit: unitNum,
      words: [],
      total: 0,
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

    // TODO: 从数据库获取进度
    res.json({
      grade,
      progress: [],
    });
  } catch (error) {
    console.error("获取进度错误:", error);
    res.status(500).json({ message: "获取进度失败" });
  }
});

export default router;
