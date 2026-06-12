import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, CheckCircle, RotateCcw, BookOpen, Zap } from "lucide-react";
import type { WordEntry } from "../types/word";
import { useUserStore } from "../store/useUserStore";
import { calculateMastery } from "../utils/reviewAlgorithm";

// 模拟待复习数据（实际应从后端API获取）
const MOCK_REVIEW_WORDS: (WordEntry & { lastReview: number; repetitions: number; interval: number })[] = [
  {
    id: "1", en: "German", phonetic: "/ˈdʒɜːmən/", pos: "adj.", cn: ["德国的"],
    example: "I like German food.", exampleCn: "我喜欢德国食物。", grade: 7, unit: 1,
    lastReview: Date.now() - 2 * 24 * 60 * 60 * 1000, repetitions: 2, interval: 3,
  },
  {
    id: "2", en: "sound", phonetic: "/saʊnd/", pos: "n.", cn: ["声音"],
    example: "The sound is nice.", exampleCn: "这声音很好听。", grade: 7, unit: 1,
    lastReview: Date.now() - 5 * 24 * 60 * 60 * 1000, repetitions: 1, interval: 1,
  },
  {
    id: "5", en: "dream", phonetic: "/driːm/", pos: "n.", cn: ["梦想"],
    example: "I have a dream.", exampleCn: "我有一个梦想。", grade: 7, unit: 1,
    lastReview: Date.now() - 1 * 24 * 60 * 60 * 1000, repetitions: 3, interval: 7,
  },
];

type ReviewTab = "due" | "mastered" | "learning";

export default function ReviewPage() {
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<ReviewTab>("due");
  const [reviewWords, setReviewWords] = useState(MOCK_REVIEW_WORDS);
  const [mode, setMode] = useState<"none" | "quick" | "full" | "test">("none");

  const dueWords = reviewWords.filter(
    (w) => Date.now() - w.lastReview >= w.interval * 24 * 60 * 60 * 1000
  );
  const masteredWords = reviewWords.filter((w) => calculateMastery(w.repetitions, w.interval) >= 80);
  const learningWords = reviewWords.filter((w) => calculateMastery(w.repetitions, w.interval) < 80);

  const getList = () => {
    if (activeTab === "due") return dueWords;
    if (activeTab === "mastered") return masteredWords;
    return learningWords;
  };

  const handleReviewComplete = (wordId: string, quality: number) => {
    setReviewWords((prev) =>
      prev.map((w) => {
        if (w.id !== wordId) return w;
        const newRep = quality >= 3 ? w.repetitions + 1 : 0;
        const newInterval = quality >= 3 ? Math.round(w.interval * (quality >= 4 ? 2 : 1.5)) : 1;
        return {
          ...w,
          lastReview: Date.now(),
          repetitions: newRep,
          interval: newInterval,
        };
      })
    );
  };

  const renderMasteryRing = (repetitions: number, interval: number) => {
    const pct = calculateMastery(repetitions, interval);
    const color = pct >= 80 ? "#00B894" : pct >= 50 ? "#FDCB6E" : "#FF7675";
    const r = 14;
    const circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    return (
      <svg width="36" height="36" className="flex-shrink-0">
        <circle cx="18" cy="18" r={r} fill="none" stroke="#E2E8F0" strokeWidth="3" />
        <motion.circle
          cx="18" cy="18" r={r} fill="none"
          stroke={color} strokeWidth="3"
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${dash} ${circ - dash}` }}
          transition={{ duration: 0.8 }}
          transform="rotate(-90 18 18)"
        />
        <text x="18" y="22" textAnchor="middle" fontSize="9" fontWeight="bold" fill={color}>
          {pct}%
        </text>
      </svg>
    );
  };

  if (mode !== "none") {
    // 复习模式界面（简化版）
    const list = getList();
    return (
      <div className="min-h-screen bg-[#F8F9FE] p-4 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setMode("none")} className="text-[#6C5CE7]">
            ← 返回
          </button>
          <h2 className="text-lg font-bold text-[#2D3436]">
            {mode === "quick" ? "快速复习" : mode === "full" ? "全面复习" : "测试模式"}
          </h2>
        </div>
        {list.length === 0 ? (
          <div className="text-center text-[#636E72] mt-20">暂无需要复习的单词 🎉</div>
        ) : (
          <div className="space-y-3">
            {list.map((w, idx) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-[#2D3436]">{w.en}</h3>
                    <p className="text-sm text-[#6C5CE7] mt-1">{w.cn.join("、")}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReviewComplete(w.id, 5)}
                      className="px-3 py-1 bg-[#00B894] text-white text-xs rounded-lg"
                    >
                      认识
                    </button>
                    <button
                      onClick={() => handleReviewComplete(w.id, 2)}
                      className="px-3 py-1 bg-[#FF7675] text-white text-xs rounded-lg"
                    >
                      不认识
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FE] p-4 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-[#2D3436] mb-6">复习中心</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-2xl p-1 mb-6">
        {([
          { key: "due" as const, label: "待复习", count: dueWords.length },
          { key: "learning" as const, label: "学习中", count: learningWords.length },
          { key: "mastered" as const, label: "已掌握", count: masteredWords.length },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.key
                ? "bg-white text-[#6C5CE7] shadow-sm"
                : "text-gray-400"
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                activeTab === tab.key ? "bg-[#6C5CE7]/10 text-[#6C5CE7]" : "bg-gray-200 text-gray-500"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 复习列表 */}
      <div className="space-y-3 mb-6">
        {getList().map((w, idx) => (
          <motion.div
            key={w.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm"
          >
            {renderMasteryRing(w.repetitions, w.interval)}
            <div className="flex-1">
              <h3 className="font-bold text-[#2D3436]">{w.en}</h3>
              <p className="text-xs text-[#636E72]">
                上次复习：{Math.round((Date.now() - w.lastReview) / (24 * 60 * 60 * 1000))}天前
              </p>
            </div>
            <button
              onClick={() => {
                handleReviewComplete(w.id, 5);
              }}
              className="text-[#00B894] hover:bg-[#00B894]/10 p-2 rounded-lg transition-colors"
            >
              <CheckCircle size={20} />
            </button>
          </motion.div>
        ))}
        {getList().length === 0 && (
          <div className="text-center text-[#636E72] py-10">
            {activeTab === "due" ? "🎉 今日复习全部完成！" : "暂无单词"}
          </div>
        )}
      </div>

      {/* 复习模式选择 */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-[#636E72]">选择复习模式</h3>
        {[
          { mode: "quick" as const, icon: Zap, label: "快速复习", desc: "仅复习错题，快速巩固", color: "from-orange-400 to-red-500" },
          { mode: "full" as const, icon: BookOpen, label: "全面复习", desc: "全部待复习单词", color: "from-[#6C5CE7] to-[#A78BFA]" },
          { mode: "test" as const, icon: RotateCcw, label: "测试模式", desc: "模拟测验，无提示", color: "from-blue-400 to-indigo-500" },
        ].map((btn) => (
          <button
            key={btn.mode}
            onClick={() => setMode(btn.mode)}
            disabled={dueWords.length === 0}
            className={`w-full flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all text-left disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${btn.color} flex items-center justify-center text-white`}>
              <btn.icon size={20} />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-[#2D3436]">{btn.label}</h4>
              <p className="text-xs text-[#636E72]">{btn.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
