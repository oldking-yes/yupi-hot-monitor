# 部署指南

## 一、部署前端 (Vercel)

```bash
cd client
VERCEL_TOKEN="vca_59QfVynk1VVtNyNRmI2lIRDizjTTfEHXw7Vm9beIReI8V7Kd611XKwC2"

# 1. 链接项目
npx vercel link --token="$VERCEL_TOKEN" --scope="kukik-s-projects" --project="yupi-hot-monitor" --yes

# 2. 部署到生产
npx vercel deploy --token="$VERCEL_TOKEN" --scope="kukik-s-projects" --prod --yes

# 3. (可选) 查看部署列表
npx vercel list --token="$VERCEL_TOKEN"
```

部署成功后 Vercel 会返回一个 URL，记下来用于 DNS 配置。

## 二、部署后端 (Zeabur)

```bash
cd ..
npm exec zeabur deploy --token="sk-milljfshg4ihquelh7emirt77gyqb"
# 或在 Zeabur 控制台链接 GitHub 仓库自动部署
```

项目 ID: `6a0c670d40a883532f331734`

## 三、后端环境变量

在 Zeabur 控制台添加：

| 变量 | 值 |
|------|------|
| `DEEPSEEK_API_KEY` | `sk-5f5306001b5a4dceb0c58bd12b952a4f` |
| `DATABASE_URL` | `file:./data.db` |
| `PORT` | `3001` |
| `CLIENT_URL` | `https://hotspot.refineyourself.asia` |

## 四、配置 DNS

```bash
node scripts/update-dns.mjs
```

这会自动配置：
- `hotspot.refineyourself.asia` → `76.76.21.21` (Vercel)
- `hotspot-api.refineyourself.asia` → `yupi-hot-monitor-2.zeabur.app` (Zeabur)

## 五、前端环境变量

在 Vercel 控制台设置 `client` 项目的环境变量：
- `VITE_API_URL` = `https://hotspot-api.refineyourself.asia`
