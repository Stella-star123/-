import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle, Trash2, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import type { WordEntry } from "../types/word";
import { useUserStore } from "../store/useUserStore";
import { api } from "../utils/api";

/** 后端返回的错题记录（含完整单词信息） */
interface WrongItem {
  id: string;
  wordId: string;
  wordEn: string;
  wrongCount: number;
  lastWrongAt: string;
  mastered: boolean;
  createdAt: string;
  updatedAt: string;
  word: WordEntry | null;
}

export default function WrongBookPage() {
  const navigate = useNavigate();
  const { user } = useUserStore();
  const [wrongWords, setWrongWords] = useState<WrongItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  // 加载错题本
  const fetchWrongBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ total: number; wrongWords: WrongItem[] }>(
        "/review/wrong-books"
      );
      setWrongWords(data.wrongWords || []);
    } catch (err: any) {
      setError(err.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWrongBooks();
  }, [fetchWrongBooks]);

  // 标记为已掌握（调用后端接口）
  const handleMarkMastered = useCallback(async (wordId: string) => {
    setRemovingIds((prev) => new Set(prev).add(wordId));
    try {
      await api.put(`/review/wrong-books/${wordId}/mastered`, {});
      // 从列表中移除
      setWrongWords((prev) => prev.filter((w) => w.wordId !== wordId));
    } catch (err: any) {
      console.error("标记掌握失败:", err);
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(wordId);
        return next;
      });
    }
  }, []);

  // 清空全部（逐个标记为已掌握）
  const handleClearAll = useCallback(async () => {
    const wordIds = wrongWords.map((w) => w.wordId);
    // 批量标记
    const promises = wordIds.map((id) =>
      api.put(`/review/wrong-books/${id}/mastered`, {}).catch(() => {})
    );
    await Promise.all(promises);
    setWrongWords([]);
  }, [wrongWords]);

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-[#6C5CE7] mx-auto mb-4" />
          <p className="text-[#636E72]">加载错题本...</p>
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
            onClick={fetchWrongBooks}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#6C5CE7] text-white rounded-xl hover:bg-[#5A4BD1] transition-colors"
          >
            <RefreshCw size={16} />
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FE] p-4 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#2D3436]">错题本</h1>
        <span className="text-sm text-[#636E72]">共 {wrongWords.length} 题</span>
      </div>

      {wrongWords.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-20 text-[#636E72]"
        >
          <BookOpen size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg">暂无错题</p>
          <p className="text-sm mt-1">继续加油，保持全对！</p>
        </motion.div>
      ) : (
        <>
          {/* 批量操作按钮 */}
          <div className="flex gap-3 mb-4">
            <button
              onClick={() => {
                const wordIds = wrongWords.map((w) => w.wordId);
                sessionStorage.setItem("wrongBookWordIds", JSON.stringify(wordIds));
                navigate("/quiz/review");
              }}
              disabled={wrongWords.length === 0}
              className="flex-1 py-2 bg-[#6C5CE7] text-white rounded-xl text-sm font-semibold hover:bg-[#5B4FCF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              重新练习
            </button>
            <button
              onClick={handleClearAll}
              className="py-2 px-4 border border-red-200 text-red-400 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors"
            >
              清空全部
            </button>
          </div>

          {/* 错题列表 */}
          <div className="space-y-3">
            {wrongWords.map((w, idx) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-bold text-[#2D3436] mb-1">
                      {w.word?.en || w.wordEn}
                    </h3>
                    <p className="text-[#6C5CE7] font-semibold text-sm">
                      {w.word?.cn?.join("、") || ""}
                    </p>
                    {w.word?.phonetic && (
                      <p className="text-xs text-[#B2BEC3] mt-0.5">{w.word.phonetic}</p>
                    )}
                    {w.word?.pos && (
                      <p className="text-xs text-[#636E72] mt-0.5">{w.word.pos}</p>
                    )}
                    {w.word?.example && (
                      <p className="text-xs text-[#636E72] mt-1 italic">
                        &ldquo;{w.word.example}&rdquo; — {w.word.exampleCn}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-[#636E72]">
                      <span>错误 {w.wrongCount} 次</span>
                      <span>·</span>
                      <span>
                        {Math.round(
                          (Date.now() - new Date(w.lastWrongAt).getTime()) /
                            (24 * 60 * 60 * 1000)
                        )}天前
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleMarkMastered(w.wordId)}
                      disabled={removingIds.has(w.wordId)}
                      className="text-[#00B894] hover:bg-[#00B894]/10 p-1.5 rounded-lg transition-colors disabled:opacity-40"
                      title="标记为已掌握"
                    >
                      {removingIds.has(w.wordId) ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <CheckCircle size={18} />
                      )}
                    </button>
                    <button
                      onClick={() => handleMarkMastered(w.wordId)}
                      disabled={removingIds.has(w.wordId)}
                      className="text-red-400 hover:bg-red-50 p-1.5 rounded-lg transition-colors disabled:opacity-40"
                      title="删除"
                    >
                      {removingIds.has(w.wordId) ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
