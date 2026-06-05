import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Star, ChevronDown, ChevronUp, BookOpen } from "lucide-react";
import { useUserStore } from "../store/useUserStore";
import type { UnitProgress, Semester, GradeSemesterConfig } from "../types/word";

const GRADE_CONFIG: GradeSemesterConfig[] = [
  {
    grade: 7,
    label: "七年级",
    semesters: [
      { semester: 1, label: "上册", color: "from-green-400 to-emerald-500", units: 8 },
      { semester: 2, label: "下册", color: "from-teal-400 to-cyan-500", units: 8 },
    ],
  },
  {
    grade: 8,
    label: "八年级",
    semesters: [
      { semester: 1, label: "上册", color: "from-blue-400 to-indigo-500", units: 8 },
      { semester: 2, label: "下册", color: "from-violet-400 to-purple-500", units: 8 },
    ],
  },
  {
    grade: 9,
    label: "九年级",
    semesters: [
      { semester: 1, label: "上册", color: "from-purple-400 to-pink-500", units: 8 },
      { semester: 2, label: "下册", color: "from-pink-400 to-rose-500", units: 8 },
    ],
  },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [expandedGrade, setExpandedGrade] = useState<number>(7);
  const [progressMap, setProgressMap] = useState<Record<string, UnitProgress>>({});

  useEffect(() => {
    // 模拟加载进度数据（实际应从后端API获取）
    const mockProgress: Record<string, UnitProgress> = {};
    GRADE_CONFIG.forEach((g) => {
      g.semesters.forEach((s) => {
        for (let u = 1; u <= s.units; u++) {
          const key = `${g.grade}-${s.semester}-${u}`;
          mockProgress[key] = {
            userId: user?.id || "",
            grade: g.grade,
            semester: s.semester as Semester,
            unit: u,
            stars: (g.grade === 7 && s.semester === 1 && u <= 2) ? Math.floor(Math.random() * 4) : 0,
            bestScore: 0,
            completed: g.grade === 7 && s.semester === 1 && u <= 2,
            lastReviewAt: 0,
          };
        }
      });
    });
    setProgressMap(mockProgress);
  }, [user]);

  const getKey = (grade: number, semester: Semester, unit: number) =>
    `${grade}-${semester}-${unit}`;

  const isUnitUnlocked = (grade: number, semester: Semester, unit: number): boolean => {
    // 七年级上册第一单元默认解锁
    if (grade === 7 && semester === 1 && unit === 1) return true;

    // 同一学期内前一单元解锁
    if (unit > 1) {
      const prevKey = getKey(grade, semester, unit - 1);
      return (progressMap[prevKey]?.stars ?? 0) > 0;
    }

    // 上学期最后一单元 → 下学期第一单元
    if (semester === 2) {
      const prevSemesterConfig = GRADE_CONFIG
        .find((g) => g.grade === grade)
        ?.semesters.find((s) => s.semester === 1);
      if (prevSemesterConfig) {
        const prevKey = getKey(grade, 1, prevSemesterConfig.units);
        return (progressMap[prevKey]?.stars ?? 0) > 0;
      }
    }

    // 跨年级：上一级下学期最后一单元 → 下一级上学期第一单元
    const prevGradeConfig = GRADE_CONFIG.find((g) => g.grade === grade - 1);
    if (prevGradeConfig) {
      const lastSemester = prevGradeConfig.semesters[prevGradeConfig.semesters.length - 1];
      const prevKey = getKey(grade - 1, lastSemester.semester as Semester, lastSemester.units);
      return (progressMap[prevKey]?.stars ?? 0) > 0;
    }

    return false;
  };

  const handleUnitClick = (grade: number, semester: Semester, unit: number) => {
    if (!isUnitUnlocked(grade, semester, unit)) return;
    navigate(`/quiz/${grade}/${semester}/${unit}`);
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

  // 获取当前选中年级的学期列表
  const currentGradeConfig = GRADE_CONFIG.find((g) => g.grade === expandedGrade);

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
            onClick={() => setExpandedGrade(expandedGrade === g.grade ? 0 : g.grade)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all ${
              expandedGrade === g.grade
                ? "bg-[#6C5CE7] text-white shadow-md"
                : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-100"
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {/* 学期 → 单元 双层列表 */}
      <AnimatePresence mode="wait">
        {currentGradeConfig && (
          <motion.div
            key={expandedGrade}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {currentGradeConfig.semesters.map((semesterConfig) => (
              <div key={semesterConfig.semester} className="space-y-3">
                {/* 学期标题 */}
                <div className="flex items-center gap-2 px-1">
                  <BookOpen size={16} className="text-[#6C5CE7]" />
                  <h3 className="text-sm font-bold text-[#636E72] uppercase tracking-wide">
                    {currentGradeConfig.label} · {semesterConfig.label}
                  </h3>
                  <div className="flex-1 h-px bg-gray-100 ml-2" />
                </div>

                {/* 单元关卡网格 */}
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: semesterConfig.units }, (_, i) => i + 1).map((unit) => {
                    const key = getKey(
                      expandedGrade,
                      semesterConfig.semester as Semester,
                      unit
                    );
                    const prog = progressMap[key];
                    const unlocked = isUnitUnlocked(
                      expandedGrade,
                      semesterConfig.semester as Semester,
                      unit
                    );
                    const stars = prog?.stars || 0;

                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: unit * 0.04 }}
                        onClick={() =>
                          handleUnitClick(
                            expandedGrade,
                            semesterConfig.semester as Semester,
                            unit
                          )
                        }
                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                          unlocked
                            ? "bg-white border-gray-100 hover:border-[#6C5CE7] cursor-pointer shadow-sm hover:shadow-md active:scale-95"
                            : "bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed"
                        }`}
                      >
                        {/* 单元图标 */}
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-base bg-gradient-to-r ${semesterConfig.color} ${
                            !unlocked ? "grayscale" : ""
                          }`}
                        >
                          {unlocked ? unit : <Lock size={18} />}
                        </div>

                        {/* 单元名称 */}
                        <div className="text-center">
                          <p className="font-bold text-sm text-[#2D3436]">
                            Unit {unit}
                          </p>
                          {/* 星级 */}
                          <div className="mt-1 flex justify-center">
                            {unlocked ? (
                              renderStars(stars)
                            ) : (
                              <span className="text-xs text-gray-400">未解锁</span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 快速练习入口 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        onClick={() => navigate("/quiz/7/1/1")}
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
