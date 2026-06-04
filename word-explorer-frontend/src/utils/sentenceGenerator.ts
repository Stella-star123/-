import type { SentenceQuiz, WordEntry } from "../types/word";

/**
 * 句子模板库（按词性分类）
 * 使用简单基础词汇，适合初中生水平
 */
const SENTENCE_TEMPLATES: Record<string, string[]> = {
  // 名词 n.
  "n.": [
    "I have a {word} at home.",
    "The {word} is very big.",
    "She likes the {word}.",
    "There is a {word} on the table.",
    "My {word} is very nice.",
    "I see a {word} in the picture.",
    "The {word} is my favorite.",
    "We need a {word} for school.",
  ],
  // 动词 v.
  "v.": [
    "I {word} every day.",
    "They {word} after school.",
    "We can {word} together.",
    "She likes to {word}.",
    "Please {word} with me.",
    "Do you want to {word}?",
    "He can {word} very well.",
    "Let's {word} now.",
  ],
  // 形容词 adj.
  "adj.": [
    "The weather is {word} today.",
    "This book is very {word}.",
    "She is a {word} girl.",
    "The food tastes {word}.",
    "It looks very {word}.",
    "I feel {word} today.",
    "The movie was very {word}.",
    "He is very {word} to me.",
  ],
  // 副词 adv.
  "adv.": [
    "She speaks {word}.",
    "Please walk {word}.",
    "He runs very {word}.",
    "They work {word} every day.",
    "I can {word} finish my homework.",
    "The bird flies {word}.",
    "She smiles {word}.",
    "We should study {word}.",
  ],
  // 默认（通用）
  default: [
    "I know the word {word}.",
    "Can you say {word}?",
    "The word {word} is important.",
    "We learn {word} in class.",
    "Please remember {word}.",
    "I can use {word} in a sentence.",
    "The teacher explains {word}.",
    "Let me show you {word}.",
  ],
};

/**
 * 段落模板库（含3-5个目标单词）
 * 每个段落模板用 {word1} {word2} ... 占位
 */
const PARAGRAPH_TEMPLATES: string[][] = [
  [
    "My name is Li Ming. I am a student in Shenzhen. I {word1} English every day. My school is very {word2}. I have many {word3}. We study together.",
    "I have a happy family. My father is a {word1}. My mother is very {word2}. We live in a big {word3}. I love my family very much.",
    "Today is a {word1} day. I go to the park with my {word2}. We see many {word3} there. We have a great time.",
  ],
  [
    "I get up early every morning. I eat {word1} for breakfast. Then I go to {word2} by bus. My classmates are very {word3}. We have fun at school.",
    "Spring is my favorite {word1}. The weather is {word2}. Flowers are {word3}. Birds sing in the trees. I love spring very much.",
    "I have a {word1}. Its name is Lucky. It is very {word2}. I play with it after {word3}. It makes me happy.",
  ],
];

/**
 * 填充句子模板
 */
function fillTemplate(template: string, word: string): string {
  return template.replace("{word}", word);
}

/**
 * 获取单词的词性分类
 */
function getPosCategory(pos: string): string {
  if (pos.startsWith("n")) return "n.";
  if (pos.startsWith("v")) return "v.";
  if (pos.startsWith("adj") || pos.startsWith("a")) return "adj.";
  if (pos.startsWith("adv") || pos.startsWith("ad")) return "adv.";
  return "default";
}

/**
 * 为单个单词生成句子
 */
export function generateSentence(word: WordEntry): string {
  // 优先使用教材原句
  if (word.example && word.example.trim()) {
    return word.example.trim();
  }

  const category = getPosCategory(word.pos);
  const templates = SENTENCE_TEMPLATES[category] || SENTENCE_TEMPLATES["default"];
  const template = templates[Math.floor(Math.random() * templates.length)];
  return fillTemplate(template, word.en);
}

/**
 * 为多个单词生成段落（闯关模式）
 */
export function generateParagraph(words: WordEntry[]): { paragraph: string; wordMap: Record<string, string> } {
  const templates = PARAGRAPH_TEMPLATES[Math.floor(Math.random() * PARAGRAPH_TEMPLATES.length)];
  const template = templates[Math.floor(Math.random() * templates.length)];

  const wordMap: Record<string, string> = {};
  let paragraph = template;
  words.forEach((w, i) => {
    const key = `{word${i + 1}}`;
    wordMap[key] = w.en;
    paragraph = paragraph.replace(key, w.en);
  });

  return { paragraph, wordMap };
}

/**
 * 生成句子翻译题
 */
export function generateSentenceQuiz(word: WordEntry): SentenceQuiz {
  const sentence = generateSentence(word);
  const questionType = Math.random() > 0.5 ? "fill" : "choice";

  // 生成干扰选项
  const allCn = word.cn.flatMap((c) => c.split(/[,，、]/).map((s) => s.trim()));
  const correct = allCn[0] || word.cn[0] || "";

  const quiz: SentenceQuiz = {
    sentence,
    targetWords: [word.en],
    questionType,
    correctAnswer: correct,
    wordEntry: word,
  };

  if (questionType === "choice") {
    // 生成3个干扰选项（使用通用干扰词）
    const distractors = [
      "一个很大的房子",
      "每天跑步锻炼",
      "非常高兴的",
      "快速地奔跑",
      "美丽的花朵",
      "认真学习",
      "好朋友",
      "晴朗的天气",
    ].filter((d) => d !== correct);
    const selected = distractors.sort(() => 0.5 - Math.random()).slice(0, 3);
    quiz.choices = [correct, ...selected].sort(() => 0.5 - Math.random());
  }

  return quiz;
}

/**
 * 生成段落翻译题（含3-5个目标单词）
 */
export function generateParagraphQuiz(words: WordEntry[]): SentenceQuiz {
  const { paragraph, wordMap } = generateParagraph(words);
  const targetWords = words.map((w) => w.en);

  // 取第一个单词的正确答案作为代表
  const firstWord = words[0];
  const correctAnswer = (firstWord.cn[0] || "").split(/[,，、]/)[0].trim();

  return {
    sentence: paragraph,
    targetWords,
    questionType: Math.random() > 0.5 ? "fill" : "choice",
    correctAnswer,
    wordEntry: firstWord,
    hint: `本段含有单词：${targetWords.join("、")}`,
  };
}
