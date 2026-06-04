import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useUserStore } from "../store/useUserStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  BookOpen,
  Clock,
  User,
  LogOut,
  Flame,
} from "lucide-react";

const navItems = [
  { path: "/home", icon: Home, label: "首页" },
  { path: "/review", icon: Clock, label: "复习" },
  { path: "/wrongbook", icon: BookOpen, label: "错题" },
  { path: "/profile", icon: User, label: "我的" },
];

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useUserStore();

  const expPercent = user
    ? Math.min(100, (user.exp / user.expToNextLevel) * 100)
    : 0;

  return (
    <div className="flex flex-col h-screen bg-[#F8F9FE]">
      {/* 顶部导航栏 */}
      <header className="flex items-center justify-between px-4 py-3 bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#6C5CE7] to-[#A78BFA] flex items-center justify-center text-white font-bold text-lg">
            W
          </div>
          <div>
            <h1 className="text-lg font-bold text-[#2D3436]">单词探险家</h1>
            {user && (
              <div className="flex items-center gap-2 text-xs text-[#636E72]">
                <span>Lv.{user.level}</span>
                <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#6C5CE7] to-[#A78BFA] transition-all"
                    style={{ width: `${expPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {user && (
            <div className="flex items-center gap-1 text-[#FF6B35]">
              <Flame size={18} fill="#FF6B35" />
              <span className="text-sm font-semibold">{user.streak}</span>
            </div>
          )}
          {user && (
            <button
              onClick={logout}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="退出登录"
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="min-h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 底部导航栏 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 px-4 z-50">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                isActive
                  ? "text-[#6C5CE7]"
                  : "text-gray-400 hover:text-[#6C5CE7]"
              }`}
            >
              <Icon size={22} />
              <span className="text-xs font-medium">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="h-0.5 w-6 bg-[#6C5CE7] rounded-full"
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
