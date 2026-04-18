# 🚀 医疗问答系统公网部署完整方案

## 📋 方案概述

本方案提供 **3种主流部署方式**，让你的精美前端通过公网 URL 访问，同时保护 API 密钥安全。

---

## 🎯 核心架构

```
用户访问公网链接
    ↓
你的前端页面（index.html）
    ↓
API代理层（保护密钥）
    ↓
Dify Workflow API
    ↓
返回AI回答，前端渲染
```

---

## ✅ 方案一：Vercel 部署（⭐ 强烈推荐）

### 优势
- ✅ **免费**，支持 Serverless API 代理
- ✅ 自动 HTTPS，全球 CDN 加速
- ✅ 密钥存储在环境变量，**绝对安全**
- ✅ 一键部署，支持 GitHub 自动同步

### 部署步骤

#### 1. 准备项目文件

确保你的项目包含以下文件：
```
QASystemOnMedicalKG-master/
├── index.html              # 前端页面
├── api/
│   └── dify-proxy.js       # API代理（保护密钥）
└── vercel.json             # Vercel配置文件
```

#### 2. 注册 Vercel 账号

1. 访问 [https://vercel.com](https://vercel.com)
2. 使用 GitHub 账号登录（推荐）
3. 完成注册

#### 3. 部署方式A：通过 GitHub（推荐）

```bash
# 1. 初始化 Git 仓库（如果没有）
cd d:\DownLoad\DownloadFile\QASystemOnMedicalKG-master\QASystemOnMedicalKG-master
git init
git add .
git commit -m "Initial commit: Medical QA System"

# 2. 创建 GitHub 仓库并推送
# 在 GitHub 上创建新仓库，然后：
git remote add origin https://github.com/YOUR_USERNAME/medical-qa.git
git branch -M main
git push -u origin main
```

然后在 Vercel 中：
1. 点击 **"New Project"**
2. 选择你刚推送的 GitHub 仓库
3. 点击 **"Import"**

#### 4. 部署方式B：通过 Vercel CLI

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 登录
vercel login

# 3. 部署
cd d:\DownLoad\DownloadFile\QASystemOnMedicalKG-master\QASystemOnMedicalKG-master
vercel

# 4. 生产环境部署
vercel --prod
```

#### 5. 配置环境变量（重要！）

在 Vercel 项目设置中：

1. 进入 **Settings → Environment Variables**
2. 添加以下变量：

| 变量名 | 值 | 说明 |
|--------|-----|------|
| `DIFY_API_URL` | `https://difyapi.fn.takin.cc/v1/workflows` | Dify API 地址 |
| `DIFY_WORKFLOW_ID` | `Rl4c4ZHbs5kaIduG` | 你的工作流ID |
| `DIFY_APP_KEY` | `app-lB0tgVA1ioxIKcvzPVT6jKDF` | 你的App Key |

3. 重新部署：`vercel --prod`

#### 6. 访问你的网站

部署成功后，你会获得一个公网 URL：
```
https://your-project.vercel.app
```

---

## ✅ 方案二：Netlify 部署

### 优势
- ✅ 免费，支持 Functions（类似 Vercel）
- ✅ 拖拽即可部署，超简单
- ✅ 自动 HTTPS

### 部署步骤

#### 1. 创建 Netlify Functions

创建 `netlify/functions/dify-proxy.js`：

```javascript
const fetch = require('node-fetch');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const { question } = JSON.parse(event.body);

  const response = await fetch(
    `${process.env.DIFY_API_URL}/${process.env.DIFY_WORKFLOW_ID}/run`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DIFY_APP_KEY}`
      },
      body: JSON.stringify({
        inputs: { question },
        response_mode: 'blocking',
        user: 'web-user'
      })
    }
  );

  const data = await response.json();

  return {
    statusCode: 200,
    body: JSON.stringify(data)
  };
};
```

#### 2. 创建 `netlify.toml`

```toml
[build]
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

#### 3. 部署

**方式A：拖拽部署（最简单）**
1. 访问 [https://app.netlify.com/drop](https://app.netlify.com/drop)
2. 将整个文件夹拖入浏览器
3. 完成！

**方式B：通过 Netlify CLI**
```bash
npm i -g netlify-cli
netlify login
netlify deploy --prod
```

#### 4. 配置环境变量

在 Netlify 项目设置中：
1. **Site settings → Build & deploy → Environment**
2. 添加与 Vercel 相同的环境变量

---

## ✅ 方案三：GitHub Pages + Cloudflare Workers（免费安全方案）

### 优势
- ✅ 完全免费
- ✅ 密钥通过 Cloudflare Workers 保护
- ✅ 全球 CDN 加速

### 部署步骤

#### 1. 部署前端到 GitHub Pages

```bash
# 1. 创建 gh-pages 分支
git checkout -b gh-pages

# 2. 只保留前端文件
# 删除不必要的文件，只保留 index.html 和静态资源

# 3. 推送
git add .
git commit -m "Deploy to GitHub Pages"
git push origin gh-pages
```

在 GitHub 仓库设置中：
1. **Settings → Pages**
2. Source 选择 `gh-pages` 分支
3. 保存后获得 URL：`https://YOUR_USERNAME.github.io/REPO_NAME/`

#### 2. 创建 Cloudflare Worker（API代理）

1. 访问 [https://dash.cloudflare.com](https://dash.cloudflare.com)
2. 进入 **Workers & Pages**
3. 创建 Worker，粘贴以下代码：

```javascript
export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const { question } = await request.json();

    const response = await fetch(
      `${env.DIFY_API_URL}/${env.DIFY_WORKFLOW_ID}/run`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.DIFY_APP_KEY}`
        },
        body: JSON.stringify({
          inputs: { question },
          response_mode: 'blocking',
          user: 'web-user'
        })
      }
    );

    const data = await response.json();
    
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};
```

4. 在 Worker 设置中添加环境变量：
   - `DIFY_API_URL`
   - `DIFY_WORKFLOW_ID`
   - `DIFY_APP_KEY`

5. 修改前端 `index.html` 中的 API_URL：
```javascript
const API_URL = 'https://your-worker.YOUR_SUBDOMAIN.workers.dev';
```

---

## 🔒 安全最佳实践

### ⚠️ 绝对不要做的事

❌ **不要**在前端代码中硬编码 API Key  
❌ **不要**将 `.env` 文件提交到 Git  
❌ **不要**在客户端直接调用 Dify API（会暴露密钥）

### ✅ 必须做的事

✅ **使用 API 代理**（如 `api/dify-proxy.js`）  
✅ **环境变量存储密钥**  
✅ **添加 `.gitignore`**：

```gitignore
# 敏感文件
.env
.env.local
*.key
*.pem

# 依赖
node_modules/

# 编辑器
.vscode/
.idea/
```

---

## 🎨 自定义域名（可选）

### Vercel
1. **Settings → Domains**
2. 添加你的域名（如 `medical-qa.yourdomain.com`）
3. 按提示配置 DNS

### Netlify
1. **Domain settings → Add custom domain**
2. 配置 DNS CNAME 记录

---

## 📊 部署对比表

| 特性 | Vercel | Netlify | GitHub Pages + CF |
|------|--------|---------|-------------------|
| 价格 | 免费 | 免费 | 免费 |
| API代理 | ✅ Serverless | ✅ Functions | ✅ Workers |
| 自定义域名 | ✅ | ✅ | ✅ |
| HTTPS | ✅ 自动 | ✅ 自动 | ✅ 自动 |
| 部署难度 | ⭐ 简单 | ⭐⭐ 中等 | ⭐⭐⭐ 较复杂 |
| 全球CDN | ✅ | ✅ | ✅ |
| 环境变量 | ✅ | ✅ | ✅ |

---

## 🚀 快速开始（3分钟部署）

```bash
# 1. 安装 Vercel CLI
npm i -g vercel

# 2. 进入项目目录
cd d:\DownLoad\DownloadFile\QASystemOnMedicalKG-master\QASystemOnMedicalKG-master

# 3. 一键部署
vercel

# 4. 配置环境变量（在 Vercel 控制台）
# DIFY_API_URL=https://difyapi.fn.takin.cc/v1/workflows
# DIFY_WORKFLOW_ID=Rl4c4ZHbs5kaIduG
# DIFY_APP_KEY=app-lB0tgVA1ioxIKcvzPVT6jKDF

# 5. 重新部署
vercel --prod

# 完成！访问你的公网链接 🎉
```

---

## 🆘 常见问题

### Q1: 部署后访问出现 CORS 错误？
**A:** 确保使用 API 代理（`/api/dify-proxy`），不要直接调用 Dify API。

### Q2: 如何更新代码？
**A:** 
- Vercel/Netlify：推送代码到 GitHub 自动部署
- 或手动运行 `vercel --prod` / `netlify deploy --prod`

### Q3: 如何查看部署日志？
**A:** 
- Vercel：项目控制台 → Deployments
- Netlify：Deploys 标签页

### Q4: 免费版有限制吗？
**A:** 
- Vercel：100GB 带宽/月，足够个人项目
- Netlify：100GB 带宽/月，125,000 函数调用/月
- Cloudflare Workers：100,000 请求/天

---

## 📞 技术支持

如遇到问题，请检查：
1. ✅ 环境变量是否正确配置
2. ✅ API 代理路径是否正确
3. ✅ Dify API 是否可访问
4. ✅ 浏览器控制台是否有错误

---

**🎉 现在，你的精美前端已经可以通过公网链接访问了！**
