/** 用户资料 */
export interface UserProfile {
  id: string;
  username: string;
  avatar: string;
  level: number;
  exp: number;
  expToNextLevel: number;
  streak: number;        // 连续打卡天数
  totalWords: number;    // 掌握单词数
  totalDays: number;     // 总学习天数
  createdAt: number;
}

/** 成就 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

/** 学习统计数据 */
export interface StudyStats {
  totalDays: number;
  totalWords: number;
  totalExp: number;
  streak: number;
  weeklyMinutes: number[];
  accuracyTrend: number[];
  topWrongWords: { word: string; count: number }[];
}

/** 登录请求 */
export interface LoginRequest {
  username: string;
  password: string;
}

/** 注册请求 */
export interface RegisterRequest {
  username: string;
  password: string;
  nickname: string;
}

/** 认证响应 */
export interface AuthResponse {
  token: string;
  user: UserProfile;
}
