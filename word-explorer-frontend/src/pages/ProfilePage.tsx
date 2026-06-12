import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  BookOpen,
  Flame,
  Calendar,
  TrendingUp,
  Award,
  Lock,
  LogOut,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useUserStore } from "../store/useUserStore";
import type { Achievement } from "../types/user";
import { api } from "../utils/api";

/** 后端返回的用户统计响应 */
interface UserStatsResponse {
  user: {
    id: string;
    username: string;
    nickname: string;
    level: number;
    exp: number;
    expToNextLevel: number;
    streak: number;
    totalWords: number;
    totalDays: number;
    createdAt: number;
  };
  stats: {
    wrongCount: number;
    completedUnits: number;
    dueReviews: number;
    totalReviews: number;
    accuracy: number;
    weeklyMinutes: number[];
    topWrongWords: { word: string; wordId: string; count: number }[];
  };
  achievements: Achievement[];
}

export default function ProfilePage() {
  const { user, logout, setUser } = useUserStore();
  const [showAllAchievements, setShowAllAchievements] = useState(false);
  const [statsData, setStatsData] = useState<UserStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载用户统计
  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<UserStatsResponse>("/user/stats");
      setStatsData(data);
      // 同步更新 store 中的用户数据
      if (data.user) {
        setUser({
          id: data.user.id,
          username: data.user.username,
          avatar: "",
          level: data.user.level,
          exp: data.user.exp,
          expToNextLevel: data.user.expToNextLevel,
          streak: data.user.streak,
          totalWords: data.user.totalWords,
          totalDays: data.user.totalDays,
          createdAt: data.user.createdAt,
        });
      }
    } catch (err: any) {
      setError(err.message || "加载失败");
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // 合并 store user 和 stats 数据
  const currentUser = statsData?.user || user;
  const achievements = statsData?.achievements || [];
  const stats = statsData?.stats;
  const weeklyMinutes = stats?.weeklyMinutes || Array(7).fill(0);
  const topWrongWords = stats?.topWrongWords || [];
  const accuracy = stats?.accuracy || 0;

  const expPercent = currentUser
    ? Math.min(100, (currentUser.exp / currentUser.expToNextLevel) * 100)
    : 0;

  const maxWeeklyMin = Math.max(...weeklyMinutes, 1);

  // 加载状态
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center">
        <div className="text-center">
          <Loader2
            size={40}
            className="animate-spin text-[#6C5CE7] mx-auto mb-4"
          />
          <p className="text-[#636E72]">加载个人数据...</p>
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
            onClick={fetchStats}
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
    <div className="min-h-screen bg-[#F8F9FE] pb-20">
      {/* 顶部用户资料卡 */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#6C5CE7] to-[#A78BFA] rounded-b-3xl p-6 text-white"
      >
        <div className="flex items-center gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold border-2 border-white/30"
          >
            {currentUser?.username?.[0]?.toUpperCase() || "?"}
          </motion.div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">
              {currentUser?.username || "同学"}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-white/20 text-xs font-semibold px-2 py-0.5 rounded-full">
                Lv.{currentUser?.level || 1} 单词新秀
              </span>
            </div>
            {/* 经验值条 */}
            <div className="w-full h-2 bg-white/20 rounded-full mt-3 overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${expPercent}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
            <p className="text-xs text-white/70 mt-1">
              EXP {currentUser?.exp || 0} / {currentUser?.expToNextLevel || 100}
            </p>
          </div>
        </div>

        {/* 数据统计 */}
        <div className="grid grid-cols-4 gap-2 mt-5">
          {[
            {
              icon: BookOpen,
              label: "掌握单词",
              value: currentUser?.totalWords || 0,
            },
            {
              icon: Flame,
              label: "连续打卡",
              value: `${currentUser?.streak || 0}天`,
            },
            {
              icon: Calendar,
              label: "学习天数",
              value: currentUser?.totalDays || 0,
            },
            {
              icon: Trophy,
              label: "获得成就",
              value: achievements.filter((a) => a.unlocked).length,
            },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="bg-white/10 rounded-2xl p-3 text-center"
            >
              <stat.icon size={18} className="mx-auto mb-1" />
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-xs text-white/70">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="p-4 max-w-md mx-auto space-y-6">
        {/* 成就墙 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-[#2D3436]">🏆 成就墙</h3>
            <button
              onClick={() => setShowAllAchievements(!showAllAchievements)}
              className="text-xs text-[#6C5CE7] font-semibold"
            >
              {showAllAchievements ? "收起" : "查看全部"}
            </button>
          </div>
          {achievements.length === 0 ? (
            <div className="text-center text-[#636E72] py-6 text-sm">
              暂无成就数据
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {(showAllAchievements
                ? achievements
                : achievements.slice(0, 3)
              ).map((ach, i) => (
                <motion.div
                  key={ach.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.1 }}
                  className={`rounded-2xl p-3 text-center ${
                    ach.unlocked
                      ? "bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200"
                      : "bg-gray-50 border border-gray-200 opacity-50"
                  }`}
                >
                  <div className="text-2xl mb-1">
                    {ach.unlocked ? (
                      ach.icon
                    ) : (
                      <Lock
                        size={20}
                        className="mx-auto text-gray-300"
                      />
                    )}
                  </div>
                  <p
                    className={`text-xs font-semibold ${
                      ach.unlocked ? "text-[#2D3436]" : "text-gray-400"
                    }`}
                  >
                    {ach.name}
                  </p>
                  {ach.unlocked && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {ach.description}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* 学习数据图表 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="font-bold text-[#2D3436] mb-3">📊 本周学习</h3>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            {/* 柱状图 */}
            <div className="flex items-end justify-between h-24 mb-2">
              {weeklyMinutes.map((min, i) => (
                <div
                  key={i}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <motion.div
                    className="w-6 bg-gradient-to-t from-[#6C5CE7] to-[#A78BFA] rounded-t-lg"
                    initial={{ height: 0 }}
                    animate={{
                      height: `${(min / maxWeeklyMin) * 100}%`,
                    }}
                    transition={{ delay: 0.6 + i * 0.1, type: "spring" }}
                  />
                  <span className="text-xs text-gray-400">
                    {["一", "二", "三", "四", "五", "六", "日"][i]}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-[#636E72]">
              <span>
                日均{" "}
                {weeklyMinutes.length > 0
                  ? Math.round(
                      weeklyMinutes.reduce((a, b) => a + b, 0) /
                        weeklyMinutes.length
                    )
                  : 0}{" "}
                分钟
              </span>
              <span className="text-[#00B894]">正确率 {accuracy}%</span>
            </div>
          </div>
        </motion.div>

        {/* 最常错词汇 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3 className="font-bold text-[#2D3436] mb-3">
            ⚠️ 最常错词汇 TOP5
          </h3>
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
            {topWrongWords.length === 0 ? (
              <p className="text-sm text-[#636E72] text-center py-4">
                暂无错题记录
              </p>
            ) : (
              topWrongWords.map((item, i) => (
                <div
                  key={item.wordId || i}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded-full text-xs flex items-center justify-center text-white ${
                        i === 0
                          ? "bg-[#FF7675]"
                          : i === 1
                          ? "bg-[#FDCB6E]"
                          : "bg-gray-300"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="text-sm text-[#2D3436] font-medium">
                      {item.word}
                    </span>
                  </div>
                  <span className="text-xs text-[#FF7675]">
                    错 {item.count} 次
                  </span>
                </div>
              ))
            )}
          </div>
        </motion.div>

        {/* 退出按钮 */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          onClick={logout}
          className="w-full py-3 border-2 border-red-200 text-red-400 rounded-2xl font-semibold hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={16} />
          退出登录
        </motion.button>
      </div>
    </div>
  );
}
