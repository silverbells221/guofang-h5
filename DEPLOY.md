# 戎耀君山 H5 — 最优部署流程

在线地址（自定义域名）：**https://www.junshanguofang.cc.cd/**

备用地址：**https://silverbells221.github.io/guofang-h5/**（使用根路径部署后，此地址可能不可用，请以自定义域名为准）

仓库：**https://github.com/silverbells221/guofang-h5**

---

## 一、一次性配置（只做一次）

### 1. 开启 GitHub Pages 与自定义域名

1. 打开仓库 **Settings → Pages**
2. **Build and deployment → Source** 选择 **GitHub Actions**（不要选 Deploy from a branch）
3. **Custom domain** 填写：`www.junshanguofang.cc.cd`（与仓库根目录 `CNAME` 文件一致）
4. 在域名 DNS 添加 CNAME 记录：`www` → `silverbells221.github.io`
5. 若还要支持裸域 `junshanguofang.cc.cd`，在 DNS 服务商把 apex 301 跳转到 `www`

仓库内必须有 **`CNAME`** 文件（仅一行域名），部署脚本才会使用根路径 `/`。

### 2. 只保留一个部署工作流

仓库里应 **只有** 这一个文件：

`.github/workflows/deploy-pages.yml`

若还存在 GitHub 自动生成的 `static.yml`，请 **删除**（避免重复部署、且不会跑路径修复脚本）：

1. 打开 https://github.com/silverbells221/guofang-h5/tree/main/.github/workflows
2. 点开 `static.yml` → 右上角 **⋯** → **Delete file**
3. Commit message 填：`Remove duplicate static.yml Pages workflow`
4. 选 **Commit directly to the main branch** → **Commit changes**

> 不要在网页上「Create new file」再建 `static.yml`，会提示同名文件已存在。

---

## 二、日常更新流程（推荐）

### 方式 A：在本机用 Git 推送（推荐）

```powershell
cd D:\2026\github\out

# 1. 若有新的 Next 导出，先覆盖到本目录，再执行：
npm run prepare

# 2. 本地检查（务必带子路径）
npm run serve
# 浏览器打开 http://localhost:3000/guofang-h5/

# 3. 提交并推送
git add -A
git status
git commit -m "你的修改说明"
git push origin main
```

推送后：

1. 打开 **Actions** 页，等待 **Deploy GitHub Pages** 变绿
2. 约 1–3 分钟后访问线上地址（建议无痕或 Ctrl+F5）

### 方式 B：在 GitHub 网页改文件

适用于只改文案、图片等少量文件：

1. 进入对应文件 → **Edit（铅笔）**
2. 修改后 Commit message 写清楚，例如：`Update splash background`
3. 选 **Commit directly to the main branch**
4. 同样等 Actions 部署完成

**不要** 在网页新建第二个 `static.yml` / `deploy-pages.yml`。

---

## 三、从 Next.js 源码重新导出（有源码时）

在源码项目 `next.config` 中配置（构建时一次到位，减少事后改路径）：

```js
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
const isUserPage = repo?.endsWith('.github.io');
const basePath = process.env.BASE_PATH ?? (repo && !isUserPage ? `/${repo}` : '');

module.exports = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath || undefined,
};
```

然后：

```bash
npm run build
```

把生成的 `out/` **里的全部内容** 复制到本仓库根目录，再执行：

```powershell
npm run prepare
git add -A
git commit -m "Rebuild static export from Next.js"
git push origin main
```

---

## 四、CI 会自动做什么

`deploy-pages.yml` 在每次推送到 `main` 时自动：

| 步骤 | 作用 |
|------|------|
| `prepare-static-site.mjs` | 路径改为 `/guofang-h5/`，清理构建残留，写 `.nojekyll` |
| `verify-assets.mjs` | 检查启动页/目录页图片是否存在 |
| 上传并部署 | 发布到 GitHub Pages |

因此：**即使忘记本地跑 prepare，线上部署也会再跑一遍**（本地仍建议先 prepare 再预览）。

---

## 五、验证清单

部署完成后逐项检查：

- [ ] https://silverbells221.github.io/guofang-h5/ 启动页正常、背景图可见
- [ ] 约 1.2 秒后进入 https://silverbells221.github.io/guofang-h5/home/
- [ ] 目录四个入口可点开
- [ ] 二级页（如钢铁长城）点 **返回** 回到 `/guofang-h5/home/`，而不是 `/home`（404）
- [ ] Actions 最近一次 **Deploy GitHub Pages** 为成功

---

## 六、常见问题

| 现象 | 原因 | 处理 |
|------|------|------|
| 页面只有红底、无样式 | 资源路径仍是 `/` 而非 `/guofang-h5/` | 删除 `static.yml`，只保留 `deploy-pages.yml`；重新 push |
| 返回主页跳到 `/home` 404 | 客户端 JS 里仍是 `href:"/home/"` | 拉取最新 `main`，确保含 `prepare` 对 `href:"/` 的改写 |
| 网页提交报同名文件 | 已存在 `static.yml` | 用 **编辑** 或 **删除**，不要 Create new file |
| 本地 `localhost:3000` 空白 | 未带子路径 | 访问 `http://localhost:3000/guofang-h5/` |

---

## 七、提交说明怎么写（参考）

| 场景 | Commit message 示例 |
|------|---------------------|
| 更新静态页内容 | `Update content for gangtie-changcheng page` |
| 换图片 | `Replace catalog and splash assets` |
| 删重复 workflow | `Remove duplicate static.yml Pages workflow` |
| 修部署脚本 | `Fix prepare script for client-side href paths` |
| 全量重新导出 | `Rebuild static export from Next.js` |

Extended description 可留空；只有大改时再写一两句说明原因。
