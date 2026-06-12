import { create } from "zustand";
import type { QuizType, SentenceQuiz, WordEntry } from "../types/word";

interface QuizAnswer {
  questionIndex: number;
  wordId: string;
  isCorrect: boolean;
  userAnswer: string;
  timeSpent: number;
}

interface QuizState {
  currentGrade: number;
  currentSemester: number;
  currentUnit: number;
  questions: (WordEntry | SentenceQuiz)[];
  currentIndex: number;
  quizType: QuizType;
  streak: number;
  isFlameMode: boolean;
  answers: QuizAnswer[];
  isFinished: boolean;
  score: number;
  expGained: number;
  /** 每道题开始答题的时间戳 */
  questionStartTime: number;
  /** 后端提交状态 */
  submitStatus: "idle" | "submitting" | "success" | "error";
  submitError: string | null;

  setGradeSemesterUnit: (grade: number, semester: number, unit: number) => void;
  setQuestions: (questions: (WordEntry | SentenceQuiz)[]) => void;
  setCurrentIndex: (index: number) => void;
  setQuizType: (type: QuizType) => void;
  recordAnswer: (isCorrect: boolean, userAnswer: string, wordId: string) => void;
  nextQuestion: () => void;
  finishQuiz: () => void;
  setSubmitStatus: (status: "idle" | "submitting" | "success" | "error", error?: string) => void;
  resetQuiz: () => void;
}

/** 从题目中提取 wordId */
function extractWordId(q: WordEntry | SentenceQuiz): string {
  if ("sentence" in q) {
    return (q as SentenceQuiz).wordEntry?.id || "";
  }
  return (q as WordEntry).id || "";
}

export const useQuizStore = create<QuizState>((set, get) => ({
  currentGrade: 7,
  currentSemester: 1,
  currentUnit: 1,
  questions: [],
  currentIndex: 0,
  quizType: "en2cn",
  streak: 0,
  isFlameMode: false,
  answers: [],
  isFinished: false,
  score: 0,
  expGained: 0,
  questionStartTime: 0,
  submitStatus: "idle",
  submitError: null,

  setGradeSemesterUnit: (grade, semester, unit) =>
    set({ currentGrade: grade, currentSemester: semester, currentUnit: unit }),

  setQuestions: (questions) =>
    set({ questions, currentIndex: 0, answers: [], isFinished: false, questionStartTime: Date.now() }),

  setCurrentIndex: (index) => {
    set({ currentIndex: index, questionStartTime: Date.now() });
  },

  setQuizType: (type) => set({ quizType: type }),

  recordAnswer: (isCorrect, userAnswer, wordId) => {
    const state = get();
    const newStreak = isCorrect ? state.streak + 1 : 0;
    const exp = isCorrect ? 10 + (newStreak >= 5 ? 5 : 0) : 0;
    const timeSpent = Date.now() - state.questionStartTime;

    set((prev) => ({
      streak: newStreak,
      isFlameMode: newStreak >= 5,
      answers: [
        ...prev.answers,
        {
          questionIndex: prev.currentIndex,
          wordId,
          isCorrect,
          userAnswer,
          timeSpent,
        },
      ],
      score: prev.score + (isCorrect ? 10 : 0),
      expGained: prev.expGained + exp,
    }));
  },

  nextQuestion: () => {
    const state = get();
    if (state.currentIndex < state.questions.length - 1) {
      set({ currentIndex: state.currentIndex + 1, questionStartTime: Date.now() });
    } else {
      set({ isFinished: true });
    }
  },

  finishQuiz: () => set({ isFinished: true }),

  setSubmitStatus: (status, error) =>
    set({ submitStatus: status, submitError: error || null }),

  resetQuiz: () =>
    set({
      questions: [],
      currentIndex: 0,
      streak: 0,
      isFlameMode: false,
      answers: [],
      isFinished: false,
      score: 0,
      expGained: 0,
      questionStartTime: 0,
      submitStatus: "idle",
      submitError: null,
    }),
}));
