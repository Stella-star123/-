import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Clock, CheckCircle, RotateCcw, BookOpen, Zap, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import type { WordEntry } from "../types/word";
import { useUserStore } from "../store/useUserStore";
import { calculateMastery } from "../utils/reviewAlgorithm";
import { api } from "../utils/api";

/** 后端返回的复习记录（含完整单词信息） */
interface ReviewItem {
  id: string;
  wordId: string;
  wordEn: string;
  repetitions: number;
  efactor: number;
  interval: number;
  nextReviewAt: string;
  lastQuality: number;
  createdAt: string;
  updatedAt: string;
  word: WordEntry | null;
}

type ReviewTab = "due" | "mastered" | "learning";

export default function ReviewPage() {
  const { user } = useUserStore();
  const [activeTab, setActiveTab] = useState<ReviewTab>("due");
  const [mode, setMode] = useState<"none" | "quick" | "full" | "test">("none");
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载待复习列表
  const fetchDueReviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ total: number; reviews: ReviewItem[] }>("/review/due");
      setReviews(data.reviews || []);
    } catch (err: any) {
      setError(err.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDueReviews();
  }, [fetchDueReviews]);

  // 提交复习结果到后端
  const handleReviewComplete = useCallback(
    async (wordId: string, quality: number) => {
      // 乐观更新本地状态
      setReviews((prev) =>
        prev.map((r) => {
          if (r.wordId !== wordId) return r;
          const newRep = quality >= 3 ? r.repetitions + 1 : 0;
          const newInterval =
            quality >= 3
              ? Math.round(r.interval * (quality >= 4 ? 2 : 1.5))
              : 1;
          return {
            ...r,
            repetitions: newRep,
            interval: newInterval,
            nextReviewAt: new Date(
              Date.now() + newInterval * 24 * 60 * 60 * 1000
            ).toISOString(),
            lastQuality: quality,
          };
        })
      );

      // 异步提交到后端
      try {
        await api.post("/review/submit", { wordId, quality });
      } catch (err: any) {
        console.error("提交复习结果失败:", err);
        // 提交失败时刷新列表以保持数据一致
        fetchDueReviews();
      }
    },
    [fetchDueReviews]
  );

  // 基于后端返回数据计算各分类
  const dueWords = reviews.filter(
    (r) => new Date(r.nextReviewAt).getTime() <= Date.now()
  );
  const masteredWords = reviews.filter(
    (r) => calculateMastery(r.repetitions, r.interval) >= 80
  );
  const learningWords = reviews.filter(
    (r) => calculateMastery(r.repetitions, r.interval) < 80
  );

  const getList = () => {
    if (activeTab === "due") return dueWords;
    if (activeTab === "mastered") return masteredWords;
    return learningWords;
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

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-[#6C5CE7] mx-auto mb-4" />
          <p className="text-[#636E72]">加载复习数据中...</p>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle size={48} className="text-[#FF7675] mx-auto mb-4" />
          <p className="text-[#636E72] mb-4">{error}</p>
          <button
            onClick={fetchDueReviews}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#6C5CE7] text-white rounded-xl hover:bg-[#5A4BD1] transition-colors"
          >
            <RefreshCw size={16} />
            重新加载
          </button>
        </div>
      </div>
    );
  }

  // 复习模式界面
  if (mode !== "none") {
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
          <div className="text-center text-[#636E72] mt-20">
            <BookOpen size={48} className="mx-auto mb-4 text-[#B2BEC3]" />
            <p className="text-lg">暂无需要复习的单词</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((r, idx) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-[#2D3436]">
                      {r.word?.en || r.wordEn}
                    </h3>
                    <p className="text-sm text-[#6C5CE7] mt-1">
                      {r.word?.cn?.join("、") || ""}
                    </p>
                    {r.word?.phonetic && (
                      <p className="text-xs text-[#B2BEC3] mt-0.5">{r.word.phonetic}</p>
                    )}
                    {r.word?.pos && (
                      <p className="text-xs text-[#636E72] mt-0.5">{r.word.pos}</p>
                    )}
                    {r.word?.example && (
                      <p className="text-xs text-[#636E72] mt-1 italic">
                        "{r.word.example}" — {r.word.exampleCn}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReviewComplete(r.wordId, 5)}
                      className="px-3 py-1 bg-[#00B894] text-white text-xs rounded-lg hover:bg-[#00A884] transition-colors"
                    >
                      认识
                    </button>
                    <button
                      onClick={() => handleReviewComplete(r.wordId, 2)}
                      className="px-3 py-1 bg-[#FF7675] text-white text-xs rounded-lg hover:bg-[#E06060] transition-colors"
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

  // 主页面
  return (
    <div className="min-h-screen bg-[#F8F9FE] p-4 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#2D3436]">复习中心</h1>
        <button
          onClick={fetchDueReviews}
          className="p-2 text-[#636E72] hover:text-[#6C5CE7] transition-colors rounded-lg hover:bg-white"
          title="刷新"
        >
          <RefreshCw size={18} />
        </button>
      </div>

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
        {getList().map((r, idx) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm"
          >
            {renderMasteryRing(r.repetitions, r.interval)}
            <div className="flex-1">
              <h3 className="font-bold text-[#2D3436]">
                {r.word?.en || r.wordEn}
              </h3>
              <p className="text-sm text-[#6C5CE7]">
                {r.word?.cn?.join("、") || ""}
              </p>
              <p className="text-xs text-[#636E72]">
                上次复习：{Math.round((Date.now() - new Date(r.nextReviewAt).getTime() + r.interval * 24 * 60 * 60 * 1000) / (24 * 60 * 60 * 1000))}天前
              </p>
            </div>
            <button
              onClick={() => handleReviewComplete(r.wordId, 5)}
              className="text-[#00B894] hover:bg-[#00B894]/10 p-2 rounded-lg transition-colors"
            >
              <CheckCircle size={20} />
            </button>
          </motion.div>
        ))}
        {getList().length === 0 && reviews.length === 0 && (
          <div className="text-center text-[#636E72] py-10">
            <BookOpen size={48} className="mx-auto mb-4 text-[#B2BEC3]" />
            <p className="text-lg mb-2">暂无需要复习的单词</p>
            <p className="text-sm">完成测验后，系统会自动记录需要复习的单词</p>
          </div>
        )}
        {getList().length === 0 && reviews.length > 0 && (
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
