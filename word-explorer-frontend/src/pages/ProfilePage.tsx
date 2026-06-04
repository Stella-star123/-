import { useState } from "react";
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
} from "lucide-react";
import { useUserStore } from "../store/useUserStore";
import type { Achievement } from "../types/user";

// 模拟成就数据
const ACHIEVEMENTS: Achievement[] = [
  { id: "1", name: "初出茅庐", description: "完成第一次答题", icon: "🌱", unlocked: true, unlockedAt: Date.now() - 7 * 24 * 60 * 60 * 1000 },
  { id: "2", name: "连胜达人", description: "连续答对20题", icon: "🔥", unlocked: false },
  { id: "3", name: "词汇大师", description: "掌握500个单词", icon: "📚", unlocked: false },
  { id: "4", name: "锲而不舍", description: "连续打卡7天", icon: "⭐", unlocked: true, unlockedAt: Date.now() - 2 * 24 * 60 * 60 * 1000 },
  { id: "5", name: "记忆王者", description: "完成100次复习", icon: "🧠", unlocked: false },
  { id: "6", name: "闯关高手", description: "通关10个单元", icon: "🏆", unlocked: false },
];

// 模拟学习数据
const WEEKLY_MINUTES = [25, 40, 15, 55, 30, 45, 35];
const ACCURACY_TREND = [65, 72, 78, 80, 85, 82, 88];
const TOP_WRONG = [
  { word: "beautiful", count: 5 },
  { word: "government", count: 4 },
  { word: "temperature", count: 3 },
  { word: "environment", count: 3 },
  { word: "experience", count: 2 },
];

export default function ProfilePage() {
  const { user, logout } = useUserStore();
  const [showAllAchievements, setShowAllAchievements] = useState(false);

  const expPercent = user
    ? Math.min(100, (user.exp / user.expToNextLevel) * 100)
    : 0;

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
            {user?.username?.[0]?.toUpperCase() || "?"}
          </motion.div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{user?.username || "同学"}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-white/20 text-xs font-semibold px-2 py-0.5 rounded-full">
                Lv.{user?.level || 1} 单词新秀
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
              EXP {user?.exp || 0} / {user?.expToNextLevel || 100}
            </p>
          </div>
        </div>

        {/* 数据统计 */}
        <div className="grid grid-cols-4 gap-2 mt-5">
          {[
            { icon: BookOpen, label: "掌握单词", value: user?.totalWords || 0 },
            { icon: Flame, label: "连续打卡", value: `${user?.streak || 0}天` },
            { icon: Calendar, label: "学习天数", value: user?.totalDays || 0 },
            { icon: Trophy, label: "获得成就", value: ACHIEVEMENTS.filter(a => a.unlocked).length },
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
          <div className="grid grid-cols-3 gap-2">
            {(showAllAchievements ? ACHIEVEMENTS : ACHIEVEMENTS.slice(0, 3)).map((ach, i) => (
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
                <div className="text-2xl mb-1">{ach.unlocked ? ach.icon : <Lock size={20} className="mx-auto text-gray-300" />}</div>
                <p className={`text-xs font-semibold ${ach.unlocked ? "text-[#2D3436]" : "text-gray-400"}`}>
                  {ach.name}
                </p>
                {ach.unlocked && (
                  <p className="text-xs text-gray-400 mt-0.5">{ach.description}</p>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* 学习数据图表简化版 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="font-bold text-[#2D3436] mb-3">📊 本周学习</h3>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            {/* 简单柱状图 */}
            <div className="flex items-end justify-between h-24 mb-2">
              {WEEKLY_MINUTES.map((min, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    className="w-6 bg-gradient-to-t from-[#6C5CE7] to-[#A78BFA] rounded-t-lg"
                    initial={{ height: 0 }}
                    animate={{ height: `${(min / 60) * 100}%` }}
                    transition={{ delay: 0.6 + i * 0.1, type: "spring" }}
                  />
                  <span className="text-xs text-gray-400">{["一","二","三","四","五","六","日"][i]}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs text-[#636E72]">
              <span>日均 {Math.round(WEEKLY_MINUTES.reduce((a,b)=>a+b,0)/7} 分钟</span>
              <span className="text-[#00B894]">正确率 {ACCURACY_TREND[ACCURACY_TREND.length-1]}%</span>
            </div>
          </div>
        </motion.div>

        {/* 最常错词汇 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3 className="font-bold text-[#2D3436] mb-3">⚠️ 最常错词汇 TOP5</h3>
          <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
            {TOP_WRONG.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center text-white ${
                    i === 0 ? "bg-[#FF7675]" : i === 1 ? "bg-[#FDCB6E]" : "bg-gray-300"
                  }`}>
                    {i + 1}
                  </span>
                  <span className="text-sm text-[#2D3436] font-medium">{item.word}</span>
                </div>
                <span className="text-xs text-[#FF7675]">错 {item.count} 次</span>
              </div>
            ))}
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
