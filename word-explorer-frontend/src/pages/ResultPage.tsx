import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Star, RotateCcw, ArrowRight, Trophy } from "lucide-react";
import { useQuizStore } from "../store/useQuizStore";
import { useUserStore } from "../store/useUserStore";
import type { WordEntry } from "../types/word";

// 模拟词库（实际应从后端获取）
const MOCK_WORDS: Record<string, WordEntry> = {
  "1": { id: "1", en: "German", phonetic: "/ˈdʒɜːmən/", pos: "adj.", cn: ["德国的"], example: "I like German food.", exampleCn: "我喜欢德国食物。", grade: 7, unit: 1 },
  "2": { id: "2", en: "sound", phonetic: "/saʊnd/", pos: "n.", cn: ["声音"], example: "The sound is nice.", exampleCn: "这声音很好听。", grade: 7, unit: 1 },
  "3": { id: "3", en: "hobby", phonetic: "/ˈhɒbi/", pos: "n.", cn: ["爱好"], example: "My hobby is reading.", exampleCn: "我的爱好是阅读。", grade: 7, unit: 1 },
  "4": { id: "4", en: "country", phonetic: "/ˈkʌntri/", pos: "n.", cn: ["国家"], example: "China is great.", exampleCn: "中国很伟大。", grade: 7, unit: 1 },
  "5": { id: "5", en: "dream", phonetic: "/driːm/", pos: "n.", cn: ["梦想"], example: "I have a dream.", exampleCn: "我有一个梦想。", grade: 7, unit: 1 },
};

export default function ResultPage() {
  const navigate = useNavigate();
  const { user, setUser } = useUserStore();
  const { answers, score, expGained, resetQuiz, questions } = useQuizStore();

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

  // 更新用户经验值（模拟）
  useEffect(() => {
    if (user && expGained > 0) {
      const newExp = user.exp + expGained;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
