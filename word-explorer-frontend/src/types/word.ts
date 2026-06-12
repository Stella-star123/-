/** 学期枚举 */
export type Semester = 1 | 2;  // 1=上册, 2=下册

/** 单词条目 - 沪教版七至八年级 */
export interface WordEntry {
  id: string;
  en: string;          // 英文
  phonetic: string;    // 音标
  pos: string;         // 词性
  cn: string[];        // 中文释义（支持多个义项）
  example: string;     // 英文例句
  exampleCn: string;   // 例句中文翻译
  grade: number;       // 所属年级 7/8
  semester: Semester;  // 学期 1=上册 2=下册
  unit: number;        // 所属单元编号
}

/** 年级学期配置 */
export interface GradeSemesterConfig {
  grade: number;
  label: string;
  semesters: SemesterConfig[];
}

export interface SemesterConfig {
  semester: Semester;
  label: string;
  color: string;
  units: number;
}

/** 题型枚举 */
export type QuizType =
  | "en2cn"      // 看英选中
  | "cn2en"      // 看中选英
  | "spell"       // 拼写填空
  | "listen"      // 听力辨词
  | "match"       // 单词配对
  | "flashcard"   // 快速闪卡
  | "sentence";   // 句子翻译

/** 答题记录 */
export interface QuizRecord {
  wordId: string;
  quizType: QuizType;
  isCorrect: boolean;
  timeSpent: number;   // 答题耗时(ms)
  timestamp: number;
}

/** 用户单元进度 */
export interface UnitProgress {
  userId: string;
  grade: number;
  semester: Semester;
  unit: number;
  stars: number;        // 0-3 星
  bestScore: number;
  completed: boolean;
  lastReviewAt: number; // 上次复习时间戳
}

/** 句子翻译题数据类型 */
export interface SentenceQuiz {
  sentence: string;       // 生成的英文句子
  targetWords: string[];  // 句子中的目标单词列表
  questionType: "fill" | "choice";
  correctAnswer: string;
  choices?: string[];
  hint?: string;
  wordEntry: WordEntry;
}

/** 答题结果 */
export interface QuizResult {
  isCorrect: boolean;
  correctAnswer: string;
  stars: number;
  score: number;
  expGained: number;
}
