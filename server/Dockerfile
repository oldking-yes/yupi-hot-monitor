# yupi-hot-monitor 后端 — Zeabur 部署
FROM node:20-alpine

WORKDIR /app

# 安装依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制源码并编译
COPY . .
RUN npx prisma generate
RUN npm run build

# 运行环境
EXPOSE 3001
CMD ["node", "dist/index.js"]
