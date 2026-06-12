# AI Hotspot Monitor

AI 驱动的热点监控系统 — 输入关键词，自动从多个信息源聚合内容，利用 DeepSeek V4 进行语义分析和真假识别，通过 WebSocket 实时推送结果。

## 技术栈

| 层 | 技术 |
|---|------|
| 前端 | React 19 + TypeScript + Vite + Tailwind CSS v4 + Framer Motion |
| 后端 | Express 5 + TypeScript + Prisma + Socket.io |
| AI | DeepSeek V4 Flash (OpenAI SDK 直连) |
| 数据库 | SQLite (Prisma ORM) |
| 实时通信 | WebSocket (Socket.io) |
| 数据源 | Twitter, Bing, HackerNews, 搜狗, B站, 微博 等 8+ 信息源 |

## 核心功能

- **关键词监控** — 配置监控关键词，支持激活/暂停
- **多源聚合** — 自动从 8+ 信息源抓取内容
- **AI 分析** — 查询扩展、真假识别、相关性评分、智能摘要
- **实时推送** — WebSocket 实时推送 + 邮件通知
- **多维筛选** — 按来源、重要性、时间范围筛选；按热度、相关性排序
- **全网搜索** — 输入任意关键词从多源聚合搜索

## 快速开始

### 前置条件

- Node.js >= 18
- [DeepSeek API Key](https://platform.deepseek.com/)（用于 AI 分析）

### 安装运行

```bash
# 克隆仓库
git clone https://github.com/ryan-flow/yupi-hot-monitor.git
cd yupi-hot-monitor

# 后端
cd server
npm install
npx prisma generate
npx prisma db push

# 配置环境变量
cp .env.example .env
# 编辑 .env，填入 DEEPSEEK_API_KEY

# 前端
cd ../client
npm install
```

### 启动服务

```bash
# 终端 1：后端 (端口 3001)
cd server && npm run dev

# 终端 2：前端 (端口 5173)
cd client && npm run dev
```

访问 **http://localhost:5173**

### 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `DEEPSEEK_API_KEY` | 是 | DeepSeek API Key |
| `TWITTER_API_KEY` | 否 | Twitter API Bearer Token |
| `EMAIL_USER` / `EMAIL_PASS` | 否 | 邮件通知账号 |
| `DATABASE_URL` | 否 | 数据库连接（默认 SQLite） |

## 项目结构

```
yupi-hot-monitor/
├── client/                  # React 前端
│   └── src/
│       ├── App.tsx          # 主应用组件
│       ├── components/      # UI 组件
│       │   └── ui/          # 装饰组件 (spotlight, beams, meteors)
│       ├── services/        # API + WebSocket 客户端
│       └── index.css        # 设计令牌 + 全局样式
├── server/                  # Express 后端
│   └── src/
│       ├── services/        # 核心服务
│       │   ├── ai.ts        # DeepSeek V4 AI 分析
│       │   ├── search.ts    # Bing + HackerNews
│       │   ├── chinaSearch.ts  # 搜狗 + B站 + 微博
│       │   ├── twitter.ts   # Twitter 采集
│       │   └── email.ts     # 邮件通知
│       ├── jobs/            # 定时任务
│       ├── routes/          # API 路由
│       └── __tests__/       # 测试
├── skills/                  # Agent Skills 技能包
└── docs/                    # 文档
```

## AI 管线

```
关键词 → Query Expansion → 多源搜索 → 关键词预匹配 → AI 内容分析 → 过滤排序 → 推送
```

1. **查询扩展** — DeepSeek V4 将关键词扩展为 5-15 个变体（大小写、缩写、别称）
2. **关键词预匹配** — 文本快速过滤，减少 AI 调用量
3. **AI 内容分析** — 相关性评分(0-100)、真假识别、重要性分级、智能摘要

## 设计

Endfield 工业风主题 — 暖黑底色 + 警示橙金强调色 + 冷钢蓝辅色 + 地质噪点纹理。

## 致谢

基于 [liyupi/yupi-hot-monitor](https://github.com/liyupi/yupi-hot-monitor) 改造，数据采集管道和核心架构保留自原项目。

## License

MIT
