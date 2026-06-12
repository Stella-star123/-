# 单词探险家 (Word Explorer)

一款为深圳初中生设计的英语单词记忆网页应用，基于沪教版（广州深圳版）七至九年级教材，通过游戏化闯关和多元互动题型，让单词记忆变得有趣高效。

## 功能特性

### 核心功能
- **教材词库**：内置沪教版七至九年级全部词汇（约1800-2200词），按年级+单元分类
- **7种互动题型**：看英选中、看中选英、拼写填空、听力辨词、单词配对、快速闪卡、**句子翻译**
- **句子生成模式**：系统根据单词自动生成英文句子/段落，学生通过中文翻译判断掌握程度
  - 短句模式（日常练习）：含1个目标单词，支持翻译填空和选择题
  - 段落模式（闯关模式）：含3-5个目标单词的短段落
- **游戏化闯关**：星级评价（1-3星）、连胜火焰（连续答对得分翻倍）、经验值升级
- **记忆曲线复习**：基于SM-2改进版算法，自动推送待复习单词
- **错题本**：自动归集答错单词，支持重练和标记掌握
- **个人中心**：等级成就、学习数据图表、成就墙

## 技术栈

### 前端
- React 18 + TypeScript
- Vite 5（构建工具）
- Tailwind CSS 3.4 + shadcn/ui（UI组件）
- Framer Motion（动画）
- Zustand（状态管理）
- Recharts（数据图表）
- Web Speech API（单词发音）

### 后端
- Node.js + Express + TypeScript
- SQLite + Prisma ORM
- JWT 认证
- bcrypt 密码加密

## 快速开始

### 一键启动（推荐）
```bash
# 首次使用需安装依赖
npm install
npm run install:all

# 初始化数据库（仅首次）
cd word-explorer-backend
npx prisma generate
npx prisma migrate dev --name init
cd ..

# 同时启动前后端
npm run dev
```
启动后访问 **http://localhost:5173** 即可使用。

### 分别启动
```bash
# 终端1 - 后端
cd word-explorer-backend
npm run dev    # 后端 http://localhost:3000

# 终端2 - 前端
cd word-explorer-frontend
npm run dev    # 前端 http://localhost:5173
```

## 目录结构

```
word-explorer/
├── word-explorer-frontend/   # 前端项目
│   ├── src/
│   │   ├── components/       # 可复用UI组件
│   │   ├── pages/           # 页面组件
│   │   ├── hooks/           # 自定义Hooks
│   │   ├── store/           # Zustand状态管理
│   │   ├── data/            # 沪教版词库JSON
│   │   ├── types/           # TypeScript类型定义
│   │   └── utils/           # 工具函数（翻译判分、句子生成、复习算法）
│   └── package.json
│
├── word-explorer-backend/    # 后端项目
│   ├── src/
│   │   ├── routes/          # Express路由
│   │   ├── middleware/       # 中间件（JWT认证、错误处理）
│   │   └── index.ts         # 后端入口
│   ├── prisma/             # 数据库Schema和迁移
│   └── package.json
│
└── README.md
```

## 词库扩展

词库文件位于 `word-explorer-frontend/src/data/`：
- `grade7-unit{N}.json`：七年级上册/下册
- `grade8-unit{N}.json`：八年级上册/下册
- `grade9-unit{N}.json`：九年级全一册

每个单词格式：
```json
{
  "id": "g7u1-01",
  "en": "German",
  "phonetic": "/ˈdʒɜːmən/",
  "pos": "adj.",
  "cn": ["德国的", "德国人的"],
  "example": "I like German food.",
  "exampleCn": "我喜欢德国食物。",
  "grade": 7,
  "unit": 1
}
```

## 设计风格

- **主色调**：`#6C5CE7`（活力紫）
- **辅色调**：`#FF6B35`（活力橙）
- **背景色**：`#F8F9FE`（浅紫灰白）
- **风格**：明亮活泼的卡通冒险风格，圆角卡片，流畅动画
- **字体**：PingFang SC（中文）+ Roboto（英文/数字）

## 作者

为深圳初一学生量身打造 ❤️
