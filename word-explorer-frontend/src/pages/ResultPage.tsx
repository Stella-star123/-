import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Star, RotateCcw, ArrowRight, Trophy, AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { useQuizStore } from "../store/useQuizStore";
import { useUserStore } from "../store/useUserStore";
import { api } from "../utils/api";
import type { WordEntry } from "../types/word";

export default function ResultPage() {
  const navigate = useNavigate();
  const { user, setUser } = useUserStore();
  const {
    answers,
    score,
    expGained,
    resetQuiz,
    questions,
    currentGrade,
    currentSemester,
    currentUnit,
    submitStatus,
    submitError,
    setSubmitStatus,
  } = useQuizStore();

  const [stars, setStars] = useState<number>(0);
  const [starAnimation, setStarAnimation] = useState<number>(0);

  const total = answers.length;
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  // 计算星级
  useEffect(() => {
    if (accuracy >= 95) setStars(3);
    else if (accuracy >= 85) setStars(2);
    else if (accuracy >= 70) setStars(1);
    else setStars(0);
  }, [accuracy]);

  // 星级动画
  useEffect(() => {
    if (stars > 0) {
      let count = 0;
      const timer = setInterval(() => {
        count++;
        setStarAnimation(count);
        if (count >= stars) clearInterval(timer);
      }, 500);
      return () => clearInterval(timer);
    }
  }, [stars]);

  // 重试提交
  const retrySubmit = useCallback(async () => {
    setSubmitStatus("submitting");
    try {
      const payload = {
        grade: currentGrade,
        semester: currentSemester,
        unit: currentUnit,
        answers: answers.map((a) => ({
          wordId: a.wordId,
          isCorrect: a.isCorrect,
          timeSpent: a.timeSpent,
        })),
        score,
        expGained,
      };

      const result = await api.post<{ message: string; stars: number; newExp: number }>(
        "/quiz/submit",
        payload
      );

      setSubmitStatus("success");

      if (user && result) {
        const newExp = result.newExp || user.exp + expGained;
        const newLevel = Math.floor(newExp / 100) + 1;
        const newExpToNext = 100 - (newExp % 100);
        setUser({
          ...user,
          exp: newExp,
          level: newLevel,
          expToNextLevel: newExpToNext,
          totalWords: user.totalWords + correctCount,
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "提交失败";
      setSubmitStatus("error", message);
    }
  }, [currentGrade, currentSemester, currentUnit, answers, score, expGained, user, setUser, setSubmitStatus, correctCount]);

  const handleRetry = () => {
    resetQuiz();
    navigate(-1); // 返回答题页重新开始
  };

  const handleNext = () => {
    resetQuiz();
    navigate("/home");
  };

  return (
    <div className="min-h-screen bg-[#F8F9FE] p-4 max-w-md mx-auto flex flex-col">
      {/* 星级评价 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center pt-8 pb-6"
      >
        <div className="flex justify-center gap-3 mb-4">
          {[1, 2, 3].map((s) => (
            <motion.div
              key={s}
              initial={{ opacity: 0, scale: 0 }}
              animate={
                s <= starAnimation
                  ? { opacity: 1, scale: 1, rotate: [0, 15, -15, 0] }
                  : { opacity: 0.3, scale: 1 }
              }
              transition={{ duration: 0.5, type: "spring" }}
            >
              <Star
                size={48}
                className={s <= stars ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
              />
            </motion.div>
          ))}
        </div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          className="text-2xl font-bold text-[#2D3436]"
        >
          {stars === 0
            ? "继续加油！"
            : stars === 1
            ? "不错，继续加油！"
            : stars === 2
            ? "很好！再接再厉！"
            : "太棒了！完美通关！"}
        </motion.h2>
      </motion.div>

      {/* 成绩卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white rounded-3xl p-6 shadow-md mb-6"
      >
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-[#6C5CE7]">{score}</p>
            <p className="text-xs text-[#636E72] mt-1">得分</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#00B894]">{accuracy}%</p>
            <p className="text-xs text-[#636E72] mt-1">正确率</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-[#FF6B35]">+{expGained}</p>
            <p className="text-xs text-[#636E72] mt-1">经验值</p>
          </div>
        </div>
      </motion.div>

      {/* 单词回顾 */}
      <div className="flex-1 overflow-y-auto mb-4">
        <h3 className="text-sm font-semibold text-[#636E72] mb-3">单词回顾</h3>
        <div className="space-y-2">
          {answers.map((ans, idx) => {
            const q = questions[idx];
            const word = q && "en" in q ? (q as WordEntry) : null;
            const sentQ = q && "sentence" in q ? (q as any) : null;
            const wordEntry = word || (sentQ?.wordEntry as WordEntry | undefined);
            if (!wordEntry) return null;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`flex items-center gap-3 p-3 rounded-2xl border ${ans.isCorrect ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${ans.isCorrect ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"}`}>
                  {ans.isCorrect ? "✓" : "✗"}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#2D3436]">{wordEntry.en}</p>
                  <p className="text-xs text-[#636E72]">{wordEntry.cn.join("、")}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 提交状态提示 */}
      <AnimatePresence>
        {submitStatus === "submitting" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 py-3 text-sm text-[#636E72]"
          >
            <Loader2 size={16} className="animate-spin text-[#6C5CE7]" />
            正在保存学习记录...
          </motion.div>
        )}
        {submitStatus === "error" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-2 py-3"
          >
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle size={16} />
              保存失败：{submitError || "网络异常"}
            </div>
            <button
              onClick={retrySubmit}
              className="flex items-center gap-1 px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm hover:bg-red-100 transition-colors"
            >
              <RefreshCw size={14} />
              重试保存
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 操作按钮 */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        className="space-y-3 pb-20"
      >
        <button
          onClick={handleRetry}
          className="w-full py-3 border-2 border-[#6C5CE7] text-[#6C5CE7] rounded-2xl font-semibold hover:bg-[#6C5CE7]/5 transition-colors flex items-center justify-center gap-2"
        >
          <RotateCcw size={18} />
          再玩一次
        </button>
        <button
          onClick={handleNext}
          className="w-full py-3 bg-[#6C5CE7] text-white rounded-2xl font-semibold hover:bg-[#5B4FCF] transition-colors flex items-center justify-center gap-2"
        >
          <Trophy size={18} />
          返回地图
          <ArrowRight size={16} />
        </button>
      </motion.div>
    </div>
  );
}
