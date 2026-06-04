import { create } from "zustand";
import type { QuizType, SentenceQuiz, WordEntry } from "../types/word";

interface QuizState {
  currentGrade: number;
  currentUnit: number;
  questions: (WordEntry | SentenceQuiz)[];
  currentIndex: number;
  quizType: QuizType;
  streak: number;
  isFlameMode: boolean;
  answers: { questionIndex: number; isCorrect: boolean; userAnswer: string }[];
  isFinished: boolean;
  score: number;
  expGained: number;

  setGradeUnit: (grade: number, unit: number) => void;
  setQuestions: (questions: (WordEntry | SentenceQuiz)[]) => void;
  setCurrentIndex: (index: number) => void;
  setQuizType: (type: QuizType) => void;
  recordAnswer: (isCorrect: boolean, userAnswer: string) => void;
  nextQuestion: () => void;
  finishQuiz: () => void;
  resetQuiz: () => void;
}

export const useQuizStore = create<QuizState>((set, get) => ({
  currentGrade: 7,
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

  setGradeUnit: (grade, unit) =>
    set({ currentGrade: grade, currentUnit: unit }),

  setQuestions: (questions) =>
    set({ questions, currentIndex: 0, answers: [], isFinished: false }),

  setCurrentIndex: (index) => set({ currentIndex: index }),

  setQuizType: (type) => set({ quizType: type }),

  recordAnswer: (isCorrect, userAnswer) => {
    const state = get();
    const newStreak = isCorrect ? state.streak + 1 : 0;
    const exp = isCorrect ? (isCorrect ? 10 : 0) + (newStreak >= 5 ? 5 : 0) : 0;

    set((prev) => ({
      streak: newStreak,
      isFlameMode: newStreak >= 5,
      answers: [
        ...prev.answers,
        { questionIndex: prev.currentIndex, isCorrect, userAnswer },
      ],
      score: prev.score + (isCorrect ? 10 : 0),
      expGained: prev.expGained + exp,
    }));
  },

  nextQuestion: () => {
    const state = get();
    if (state.currentIndex < state.questions.length - 1) {
      set((prev) => ({ currentIndex: prev.currentIndex + 1 }));
    } else {
      set({ isFinished: true });
    }
  },

  finishQuiz: () => set({ isFinished: true }),

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
    }),
}));
