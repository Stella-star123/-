import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import wordRoutes from "./routes/word.routes";
import quizRoutes from "./routes/quiz.routes";
import reviewRoutes from "./routes/review.routes";

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use("/api/auth", authRoutes);
app.use("/api/words", wordRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/review", reviewRoutes);

// 健康检查
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// 错误处理
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err.message);
  res.status(500).json({ message: "服务器内部错误", error: err.message });
});

app.listen(PORT, () => {
  console.log(`🚀 Word Explorer Backend running on http://localhost:${PORT}`);
});
