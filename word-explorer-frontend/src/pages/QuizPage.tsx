import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  ArrowRight,
  SkipForward,
  Flame,
  Check,
  X,
} from "lucide-react";
import { useQuizStore } from "../store/useQuizStore";
import { useUserStore } from "../store/useUserStore";
import type { QuizType, SentenceQuiz, WordEntry } from "../types/word";
import { generateSentenceQuiz } from "../utils/sentenceGenerator";
import { scoreTranslation } from "../utils/translationScorer";

// 模拟词库（实际应从后端API加载）
const MOCK_WORDS: WordEntry[] = [
  { id: "1", en: "German", phonetic: "/ˈdʒɜːmən/", pos: "adj.", cn: ["德国的", "德国人的"], example: "I like German food.", exampleCn: "我喜欢德国食物。", grade: 7, semester: 1, unit: 1 },
  { id: "2", en: "sound", phonetic: "/saʊnd/", pos: "n.", cn: ["声音", "声响"], example: "The sound is very nice.", exampleCn: "这声音很好听。", grade: 7, semester: 1, unit: 1 },
  { id: "3", en: "hobby", phonetic: "/ˈhɒbi/", pos: "n.", cn: ["爱好", "业余爱好"], example: "My hobby is reading.", exampleCn: "我的爱好是阅读。", grade: 7, semester: 1, unit: 1 },
  { id: "4", en: "country", phonetic: "/ˈkʌntri/", pos: "n.", cn: ["国家", "乡村"], example: "China is a great country.", exampleCn: "中国是一个伟大的国家。", grade: 7, semester: 1, unit: 1 },
  { id: "5", en: "dream", phonetic: "/driːm/", pos: "n.", cn: ["梦想", "梦"], example: "I have a big dream.", exampleCn: "我有一个大梦想。", grade: 7, semester: 1, unit: 1 },
  { id: "6", en: "everyone", phonetic: "/ˈevriwʌn/", pos: "pron.", cn: ["人人", "全部人"], example: "Everyone likes the game.", exampleCn: "每个人都喜欢这个游戏。", grade: 7, semester: 1, unit: 1 },
  { id: "7", en: "Germany", phonetic: "/ˈdʒɜːməni/", pos: "n.", cn: ["德国"], example: "Germany is in Europe.", exampleCn: "德国在欧洲。", grade: 7, semester: 1, unit: 1 },
  { id: "8", en: "mountain", phonetic: "/ˈmaʊntən/", pos: "n.", cn: ["山", "山脉"], example: "The mountain is very high.", exampleCn: "这座山很高。", grade: 7, semester: 1, unit: 1 },
  { id: "9", en: "elder", phonetic: "/ˈeldə(r)/", pos: "adj.", cn: ["年长的", "资深的"], example: "My elder brother is tall.", exampleCn: "我的哥哥很高。", grade: 7, semester: 1, unit: 1 },
  { id: "10", en: "friendly", phonetic: "/ˈfrendli/", pos: "adj.", cn: ["友好的", "友善的"], example: "He is very friendly.", exampleCn: "他非常友好。", grade: 7, semester: 1, unit: 1 },
];

const QUIZ_TYPES: QuizType[] = ["en2cn", "cn2en", "spell", "listen", "match", "flashcard", "sentence"];

/** 生成随机选项（4选1） */
function generateChoices(correct: string, pool: string[]): string[] {
  const others = pool.filter((p) => p !== correct).sort(() => 0.5 - Math.random()).slice(0, 3);
  const result = [correct, ...others].sort(() => 0.5 - Math.random());
  return result;
}

/** 播放单词发音 */
function speak(text: string) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 0.8;
    window.speechSynthesis.speak(utter);
  }
}

export default function QuizPage() {
  const { grade, semester, unit } = useParams<{ grade: string; semester: string; unit: string }>();
  const navigate = useNavigate();
  const { user, setUser } = useUserStore();
  const {
    questions,
    currentIndex,
    streak,
    isFlameMode,
    answers,
    isFinished,
    score,
    expGained,
    setQuestions,
    setCurrentIndex,
    recordAnswer,
    nextQuestion,
    finishQuiz,
    resetQuiz,
  } = useQuizStore();

  const [currentType, setCurrentType] = useState<QuizType>("en2cn");
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [inputAnswer, setInputAnswer] = useState<string>("");
  const [showResult, setShowResult] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean>(false);
  const [sentenceQuiz, setSentenceQuiz] = useState<SentenceQuiz | null>(null);

  // 初始化题目
  useEffect(() => {
    resetQuiz();
    // 生成题目（混合7种题型）
    const quizWords = MOCK_WORDS.slice(0, 10);
    const quizQuestions: (WordEntry | SentenceQuiz)[] = quizWords.map((w) => {
      const type = QUIZ_TYPES[Math.floor(Math.random() * QUIZ_TYPES.length)];
      if (type === "sentence") {
        return generateSentenceQuiz(w);
      }
      return w;
    });
    setQuestions(quizQuestions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grade, unit]);

  // 当前题目
  const currentQ = questions[currentIndex];
  const total = questions.length;

  // 当题目变化时，确定题型
  useEffect(() => {
    if (!currentQ) return;
    if ("sentence" in currentQ) {
      setCurrentType("sentence");
      setSentenceQuiz(currentQ as SentenceQuiz);
    } else {
      setCurrentType(QUIZ_TYPES[Math.floor(Math.random() * (QUIZ_TYPES.length - 1))]);
      setSentenceQuiz(null);
    }
    setSelectedAnswer("");
    setInputAnswer("");
    setShowResult(false);
    // 自动播放发音
    if ("en" in currentQ) {
      setTimeout(() => speak((currentQ as WordEntry).en), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, questions]);

  const handleSubmit = useCallback(() => {
    if (showResult) {
      // 下一题
      if (currentIndex < total - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        finishQuiz();
        navigate("/result");
      }
      return;
    }

    let correct = false;
    let userAnswer = "";

    if (currentType === "sentence" && sentenceQuiz) {
      if (sentenceQuiz.questionType === "fill") {
        const result = scoreTranslation(inputAnswer, sentenceQuiz.correctAnswer);
        correct = result.isCorrect;
        userAnswer = inputAnswer;
      } else {
        const correct = selectedAnswer === sentenceQuiz.correctAnswer;
        userAnswer = selectedAnswer;
      }
    } else if (currentType === "spell") {
      const word = currentQ as WordEntry;
      correct = inputAnswer.trim().toLowerCase() === word.en.toLowerCase();
      userAnswer = inputAnswer;
    } else if (currentType === "en2cn" || currentType === "cn2en") {
      const word = currentQ as WordEntry;
      const correctCn = (word.cn[0] || "").split(/[,，、]/)[0].trim();
      correct = selectedAnswer === correctCn;
      userAnswer = selectedAnswer;
    } else {
      // 其他题型默认正确（模拟）
      correct = Math.random() > 0.3;
      userAnswer = selectedAnswer || "模拟答案";
    }

    recordAnswer(correct, userAnswer);
    setIsCorrect(correct);
    setShowResult(true);

    // 播放发音反馈
    if (correct) {
      // 正确音效（用 Web Speech 模拟）
    } else {
      // 错误反馈
    }

    // 自动下一题（延迟1.5秒）
    if (currentIndex < total - 1) {
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
      }, 1500);
    } else {
      setTimeout(() => {
        finishQuiz();
        navigate("/result");
      }, 1500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResult, currentType, selectedAnswer, inputAnswer, sentenceQuiz, currentQ, currentIndex, total]);

  if (isFinished) {
    return null; // 会跳转到结果页
  }

  if (!currentQ) {
    return <div className="flex items-center justify-center h-screen">加载中...</div>;
  }

  const word = !( "sentence" in currentQ) ? (currentQ as WordEntry) : null;
  const totalQuestions = questions.length;
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const progressPercent = total > 0 ? ((currentIndex) / total) * 100 : 0;

  return (
    <div className="min-h-screen bg-[#F8F9FE] p-4 max-w-md mx-auto">
      {/* 顶部状态栏 */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate("/home")} className="text-gray-400 hover:text-gray-600">
          ✕
        </button>
        <div className="text-sm font-semibold text-[#636E72]">
          {currentIndex + 1} / {total}
        </div>
        <div className="flex items-center gap-1">
          {isFlameMode && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.6 }}
              className="flex items-center gap-1 text-[#FF6B35] font-bold text-sm"
            >
              <Flame size={16} fill="#FF6B35" />
              x{(streak * 2)}
            </motion.div>
          )}
          {!isFlameMode && streak > 0 && (
            <span className="text-[#FF6B35] font-semibold text-sm">🔥 {streak}</span>
          )}
        </div>
      </div>

      {/* 进度条 */}
      <div className="w-full h-2 bg-gray-200 rounded-full mb-6 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${correctCount / Math.max(currentIndex, 1) > 0.8 ? "bg-green-400" : correctCount / Math.max(currentIndex, 1) > 0.5 ? "bg-yellow-400" : "bg-red-400"}`}
          style={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* 题目卡片 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-3xl p-6 shadow-md mb-6"
        >
          {/* 句子翻译题 */}
          {currentType === "sentence" && sentenceQuiz && (
            <div>
              <div className="text-center mb-4">
                <span className="inline-block bg-[#6C5CE7]/10 text-[#6C5CE7] text-xs font-semibold px-3 py-1 rounded-full">
                  句子翻译
                </span>
              </div>

              {/* 英文句子 */}
              <div className="bg-[#F8F9FE] rounded-2xl p-5 mb-5">
                <p className="text-lg leading-relaxed text-[#2D3436]">
                  {sentenceQuiz.sentence.split(" ").map((w, i) => {
                    const isTarget = sentenceQuiz.targetWords.some(
                      (tw) => tw.toLowerCase() === w.replace(/[.,!?;]/, "").toLowerCase()
                    );
                    return (
                      <span
                        key={i}
                        className={isTarget ? "bg-[#6C5CE7]/20 text-[#6C5CE7] font-bold px-1 rounded" : ""}
                      >
                        {w}{" "}
                      </span>
                    );
                  })}
                </p>
              </div>

              {/* 发音按钮 */}
              <button
                onClick={() => speak(sentenceQuiz.sentence)}
                className="flex items-center gap-2 mx-auto mb-4 text-[#6C5CE7] hover:text-[#5B4FCF] transition-colors"
              >
                <Volume2 size={20} />
                <span className="text-sm">播放发音</span>
              </button>

              {/* 填空模式 */}
              {sentenceQuiz.questionType === "fill" ? (
                <div>
                  <p className="text-sm text-[#636E72] mb-2">请输入中文翻译：</p>
                  <input
                    type="text"
                    value={inputAnswer}
                    onChange={(e) => setInputAnswer(e.target.value)}
                    placeholder="输入中文翻译..."
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-[#6C5CE7] focus:outline-none text-[#2D3436]"
                    disabled={showResult}
                  />
                  {showResult && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`mt-3 p-3 rounded-xl text-sm ${isCorrect ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {isCorrect ? <Check size={16} /> : <X size={16} />}
                        <span className="font-semibold">{isCorrect ? "正确！" : "答错了"}</span>
                      </div>
                      <p>参考答案：{sentenceQuiz.correctAnswer}</p>
                    </motion.div>
                  )}
                </div>
              ) : (
                /* 选择模式 */
                <div>
                  <p className="text-sm text-[#636E72] mb-3">选择正确的中文翻译：</p>
                  <div className="space-y-2">
                    {sentenceQuiz.choices?.map((choice, i) => {
                      const isSelected = selectedAnswer === choice;
                      const isCorrectChoice = choice === sentenceQuiz.correctAnswer;
                      let btnClass = "w-full p-3 rounded-xl border-2 text-left transition-all ";
                      if (showResult) {
                        if (isCorrectChoice) btnClass += "border-green-400 bg-green-50 text-green-700";
                        else if (isSelected) btnClass += "border-red-400 bg-red-50 text-red-700";
                        else btnClass += "border-gray-200 bg-gray-50 text-gray-400";
                      } else {
                        btnClass += isSelected
                          ? "border-[#6C5CE7] bg-[#6C5CE7]/5 text-[#2D3436]"
                          : "border-gray-200 hover:border-[#6C5CE7]/50 text-[#2D3436]";
                      }
                      return (
                        <button
                          key={i}
                          onClick={() => !showResult && setSelectedAnswer(choice)}
                          disabled={showResult}
                          className={btnClass}
                        >
                          {String.fromCharCode(65 + i)}. {choice}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 看英选中题型 */}
          {currentType === "en2cn" && word && (
            <div>
              <div className="text-center mb-4">
                <span className="inline-block bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full">
                  选择释义
                </span>
              </div>
              <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-[#2D3436] mb-1">{word.en}</h2>
                <p className="text-[#636E72] text-sm">{word.phonetic}</p>
                <button
                  onClick={() => speak(word.en)}
                  className="mt-2 text-[#6C5CE7] hover:text-[#5B4FCF] transition-colors"
                >
                  <Volume2 size={20} className="inline mr-1" />
                  发音
                </button>
              </div>
              <div className="space-y-2">
                {generateChoices(word.cn[0] || "", MOCK_WORDS.map((w) => w.cn[0] || "")).map((choice, i) => {
                  const isSelected = selectedAnswer === choice;
                  const isCorrectChoice = choice === (word.cn[0] || "").split(/[,，、]/)[0].trim();
                  let btnClass = "w-full p-3 rounded-xl border-2 text-left transition-all ";
                  if (showResult) {
                    if (isCorrectChoice) btnClass += "border-green-400 bg-green-50 text-green-700";
                    else if (isSelected) btnClass += "border-red-400 bg-red-50 text-red-700";
                    else btnClass += "border-gray-200 bg-gray-50 text-gray-400";
                  } else {
                    btnClass += isSelected
                      ? "border-[#6C5CE7] bg-[#6C5CE7]/5"
                      : "border-gray-200 hover:border-[#6C5CE7]/50";
                  }
                  return (
                    <button
                      key={i}
                      onClick={() => !showResult && setSelectedAnswer(choice)}
                      disabled={showResult}
                      className={btnClass}
                    >
                      {String.fromCharCode(65 + i)}. {choice}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 拼写填空题 */}
          {currentType === "spell" && word && (
            <div>
              <div className="text-center mb-4">
                <span className="inline-block bg-orange-50 text-[#FF6B35] text-xs font-semibold px-3 py-1 rounded-full">
                  拼写填空
                </span>
              </div>
              <div className="text-center mb-6">
                <p className="text-[#636E72] mb-2">请根据发音拼写单词：</p>
                <button
                  onClick={() => speak(word.en)}
                  className="w-16 h-16 rounded-full bg-[#6C5CE7]/10 text-[#6C5CE7] mx-auto flex items-center justify-center hover:bg-[#6C5CE7]/20 transition-colors"
                >
                  <Volume2 size={28} />
                </button>
                <p className="mt-2 text-sm text-[#636E72]">{word.phonetic} · {word.pos}</p>
                <p className="mt-1 text-sm text-gray-400">释义：{word.cn.join("、")}</p>
              </div>
              <input
                type="text"
                value={inputAnswer}
                onChange={(e) => setInputAnswer(e.target.value)}
                placeholder="输入英文单词..."
                className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-[#6C5CE7] focus:outline-none text-center text-lg text-[#2D3436]"
                disabled={showResult}
              />
              {showResult && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={`mt-3 p-3 rounded-xl text-sm ${isCorrect ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}
                >
                  <div className="flex items-center gap-2">
                    {isCorrect ? <Check size={16} /> : <X size={16} />}
                    <span className="font-semibold">{isCorrect ? "正确！" : `正确答案是：${word.en}`}</span>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* 闪卡模式 */}
          {currentType === "flashcard" && word && (
            <div className="text-center">
              <div className="text-center mb-4">
                <span className="inline-block bg-purple-50 text-purple-600 text-xs font-semibold px-3 py-1 rounded-full">
                  闪卡记忆
                </span>
              </div>
              <motion.div
                className="bg-[#F8F9FE] rounded-2xl p-8 mb-6 cursor-pointer"
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  if (!showResult) {
                    setSelectedAnswer("known");
                    setIsCorrect(true);
                    setShowResult(true);
                    setTimeout(() => {
                      if (currentIndex < total - 1) setCurrentIndex(currentIndex + 1);
                      else {
                        finishQuiz();
                        navigate("/result");
                      }
                    }, 800);
                  }
                }}
              >
                <h2 className="text-3xl font-bold text-[#2D3436] mb-2">{word.en}</h2>
                <p className="text-[#636E72]">{word.phonetic}</p>
                {showResult && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4">
                    <p className="text-lg text-[#6C5CE7] font-semibold">{word.cn.join("、")}</p>
                    <p className="text-sm text-[#636E72] mt-2 italic">"{word.example}"</p>
                  </motion.div>
                )}
                {!showResult && (
                  <p className="text-sm text-gray-400 mt-4">点击卡片翻面查看释义</p>
                )}
              </motion.div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    recordAnswer(false, "");
                    if (currentIndex < total - 1) setCurrentIndex(currentIndex + 1);
                    else {
                      finishQuiz();
                      navigate("/result");
                    }
                  }}
                  className="flex-1 py-3 border-2 border-red-200 text-red-500 rounded-xl font-semibold hover:bg-red-50 transition-colors"
                >
                  不认识
                </button>
                <button
                  onClick={() => {
                    recordAnswer(true, "");
                    if (currentIndex < total - 1) setCurrentIndex(currentIndex + 1);
                    else {
                      finishQuiz();
                      navigate("/result");
                    }
                  }}
                  className="flex-1 py-3 bg-[#00B894] text-white rounded-xl font-semibold hover:bg-[#00B894]/80 transition-colors"
                >
                  认识！
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* 底部操作按钮 */}
      {currentType !== "flashcard" && (
        <div className="flex gap-3">
          <button
            onClick={() => {
              // 跳过
              recordAnswer(false, "跳过");
              if (currentIndex < total - 1) setCurrentIndex(currentIndex + 1);
              else {
                finishQuiz();
                navigate("/result");
              }
            }}
            className="px-5 py-3 border-2 border-gray-200 text-gray-400 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
          >
            <SkipForward size={18} className="inline mr-1" />
            跳过
          </button>
          <button
            onClick={handleSubmit}
            disabled={!showResult && !selectedAnswer && !inputAnswer}
            className="flex-1 py-3 bg-[#FF6B35] text-white rounded-xl font-semibold hover:bg-[#F54D1C] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {showResult ? "继续" : "确认"}
            {!showResult && <ArrowRight size={18} className="inline ml-1" />}
          </button>
        </div>
      )}

      {/* 连胜火焰动画 */}
      {isFlameMode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#FF6B35] text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg"
        >
          🔥 火焰模式 · 得分翻倍！
        </motion.div>
      )}
    </div>
  );
}
