import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, CheckCircle, RotateCcw, Trash2 } from "lucide-react";
import type { WordEntry } from "../types/word";
import { useUserStore } from "../store/useUserStore";

// 模拟错题数据
const MOCK_WRONG: (WordEntry & { wrongCount: number; lastWrong: number })[] = [
  { id: "2", en: "sound", phonetic: "/saʊnd/", pos: "n.", cn: ["声音"], example: "The sound is nice.", exampleCn: "这声音很好听。", grade: 7, unit: 1, wrongCount: 3, lastWrong: Date.now() - 2 * 24 * 60 * 60 * 1000 },
  { id: "4", en: "country", phonetic: "/ˈkʌntri/", pos: "n.", cn: ["国家"], example: "China is great.", exampleCn: "中国很伟大。", grade: 7, unit: 1, wrongCount: 2, lastWrong: Date.now() - 1 * 24 * 60 * 60 * 1000 },
];

export default function WrongBookPage() {
  const { user } = useUserStore();
  const [wrongWords, setWrongWords] = useState(MOCK_WRONG);
  const [practiceMode, setPracticeMode] = useState<boolean>(false);

  const handleRemove = (id: string) => {
    setWrongWords(prev => prev.filter(w => w.id !== id));
  };

  const handlePractice = () => {
    setPracticeMode(true);
    // 跳转到答题页，传入选中的错题
    // TODO: 实际实现需要传递单词列表
  };

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
              onClick={handlePractice}
              className="flex-1 py-2 bg-[#6C5CE7] text-white rounded-xl text-sm font-semibold hover:bg-[#5B4FCF] transition-colors"
            >
              重新练习
            </button>
            <button
              onClick={() => setWrongWords([])}
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
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-[#2D3436]">{w.en}</h3>
                      <span className="text-xs text-[#636E72]">{w.phonetic}</span>
                    </div>
                    <p className="text-[#6C5CE7] font-semibold text-sm">{w.cn.join("、")}</p>
                    <p className="text-xs text-[#636E72] mt-1 italic">"{w.example}"</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-[#636E72]">
                      <span>错误 {w.wrongCount} 次</span>
                      <span>·</span>
                      <span>{Math.round((Date.now() - w.lastWrong) / (24 * 60 * 60 * 1000))}天前</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRemove(w.id)}
                      className="text-[#00B894] hover:bg-[#00B894]/10 p-1.5 rounded-lg transition-colors"
                      title="标记为已掌握"
                    >
                      <CheckCircle size={18} />
                    </button>
                    <button
                      onClick={() => handleRemove(w.id)}
                      className="text-red-400 hover:bg-red-50 p-1.5 rounded-lg transition-colors"
                      title="删除"
                    >
                      <Trash2 size={16} />
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
