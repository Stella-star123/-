import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Star, ChevronDown, ChevronUp } from "lucide-react";
import { useUserStore } from "../store/useUserStore";
import type { UnitProgress } from "../types/word";

const GRADE_CONFIG = [
  { grade: 7, label: "七年级", color: "from-green-400 to-emerald-500", units: 8 },
  { grade: 8, label: "八年级", color: "from-blue-400 to-indigo-500", units: 8 },
  { grade: 9, label: "九年级", color: "from-purple-400 to-pink-500", units: 8 },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [expandedGrade, setExpendedGrade] = useState<number>(7);
  const [progressMap, setProgressMap] = useState<Record<string, UnitProgress>>({});

  useEffect(() => {
    // 模拟加载进度数据（实际应从后端API获取）
    // TODO: 替换为真实 API 调用
    const mockProgress: Record<string, UnitProgress> = {};
    GRADE_CONFIG.forEach((g) => {
      for (let u = 1; u <= g.units; u++) {
        const key = `${g.grade}-${u}`;
        mockProgress[key] = {
          userId: user?.id || "",
          grade: g.grade,
          unit: u,
          stars: u <= 2 ? Math.floor(Math.random() * 4) : 0,
          bestScore: 0,
          completed: u <= 2,
          lastReviewAt: 0,
        };
      }
    });
    setProgressMap(mockProgress);
  }, [user]);

  const getKey = (grade: number, unit: number) => `${grade}-${unit}`;

  const isUnitUnlocked = (grade: number, unit: number): boolean => {
    if (grade === 7 && unit === 1) return true; // 第一关默认解锁
    const prevKey = unit > 1 ? getKey(grade, unit - 1) : getKey(grade - 1, GRADE_CONFIG.find(g => g.grade === grade - 1)?.units || 8);
    return progressMap[prevKey]?.stars > 0;
  };

  const handleUnitClick = (grade: number, unit: number) => {
    if (!isUnitUnlocked(grade, unit)) return;
    navigate(`/quiz/${grade}/${unit}`);
  };

  const renderStars = (count: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3].map((s) => (
        <Star
          key={s}
          size={14}
          className={s <= count ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
        />
      ))}
    </div>
  );

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* 用户信息卡片 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#6C5CE7] to-[#A78BFA] rounded-2xl p-5 text-white mb-6 shadow-lg"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
            {user?.username?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{user?.username || "同学"}</h2>
            <p className="text-sm text-white/80">
              已掌握 {user?.totalWords || 0} 个单词 · 连续打卡 {user?.streak || 0} 天
            </p>
          </div>
        </div>
      </motion.div>

      {/* 年级标签切换 */}
      <div className="flex gap-2 mb-4">
        {GRADE_CONFIG.map((g) => (
          <button
            key={g.grade}
            onClick={() => setExpendedGrade(expandedGrade === g.grade ? 0 : g.grade)}
            className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-all ${
              expandedGrade === g.grade
                ? "bg-[#6C5CE7] text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-50"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* 单元关卡列表 */}
      {GRADE_CONFIG.map((g) => {
        if (expandedGrade !== g.grade) return null;
        return (
          <motion.div
            key={g.grade}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {Array.from({ length: g.units }, (_, i) => i + 1).map((unit) => {
              const key = getKey(g.grade, unit);
              const prog = progressMap[key];
              const unlocked = isUnitUnlocked(g.grade, unit);
              const stars = prog?.stars || 0;

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: unit * 0.05 }}
                  onClick={() => handleUnitClick(g.grade, unit)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                    unlocked
                      ? "bg-white border-gray-100 hover:border-[#6C5CE7] cursor-pointer shadow-sm hover:shadow-md"
                      : "bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed"
                  }`}
                >
                  {/* 单元图标 */}
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg bg-gradient-to-r ${g.color}`}
                  >
                    {unlocked ? unit : <Lock size={20} />}
                  </div>

                  {/* 单元信息 */}
                  <div className="flex-1">
                    <h3 className="font-bold text-[#2D3436]">
                      八年级 {g.grade === 7 ? "上册" : g.grade === 8 ? "下册" : ""} Unit {unit}
                    </h3>
                    <p className="text-xs text-[#636E72]">
                      {unlocked ? `最佳成绩：${prog?.bestScore || 0}分` : "未解锁"}
                    </p>
                  </div>

                  {/* 星级 */}
                  {unlocked && renderStars(stars)}
                </motion.div>
              );
            })}
          </motion.div>
        );
      })}

      {/* 每日挑战入口 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={() => navigate("/quiz/7/1")} // 临时：跳转第一关
        className="mt-6 bg-gradient-to-r from-[#FF6B35] to-[#FFB347] rounded-2xl p-5 text-white cursor-pointer hover:shadow-lg transition-shadow"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">⚡ 快速练习</h3>
            <p className="text-sm text-white/80 mt-1">随机20词 · 混合题型</p>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
            ▶
          </div>
        </div>
      </motion.div>
    </div>
  );
}
