import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "word-explorer-secret";

// 注册
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { username, password, nickname } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: "用户名和密码不能为空" });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      res.status(409).json({ message: "用户名已存在" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        nickname: nickname || username,
      },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      token,
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
    });
  } catch (error) {
    console.error("注册错误:", error);
    res.status(500).json({ message: "注册失败，请稍后重试" });
  }
});

// 登录
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ message: "用户名和密码不能为空" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      res.status(401).json({ message: "用户名或密码错误" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: "用户名或密码错误" });
      return;
    }

    // 更新连续登录天数
    const now = new Date();
    const lastLogin = user.lastLoginAt;
    let newStreak = user.streak;
    if (lastLogin) {
      const daysSinceLastLogin = Math.floor(
        (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceLastLogin <= 1) {
        newStreak = user.streak + 1;
      } else {
        newStreak = 1;
      }
    } else {
      newStreak = 1;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: now, streak: newStreak },
    });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        level: user.level,
        exp: user.exp,
        expToNextLevel: user.expToNextLevel,
        streak: newStreak,
        totalWords: user.totalWords,
        totalDays: user.totalDays,
        createdAt: user.createdAt.getTime(),
      },
    });
  } catch (error) {
    console.error("登录错误:", error);
    res.status(500).json({ message: "登录失败，请稍后重试" });
  }
});

export default router;
