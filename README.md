# 戎耀君山 · 国防教育宣传（静态站点）

这是 Next.js `output: 'export'` 导出的纯静态站点，可直接部署到 **GitHub Pages**，也可本地用静态服务器预览。

## 页面结构

| 路径 | 说明 |
|------|------|
| `/` | 启动页（约 1.2 秒后跳转目录） |
| `/home/` | 目录首页 |
| `/gangtie-changcheng/` | 钢铁长城 |
| `/yingxiong-lizan/` | 英雄礼赞 |
| `/guofang-guangjiao/` | 国防广角 |
| `/zhengce-zhichuang/` | 政策之窗 |

## 在线地址

**https://www.junshanguofang.cc.cd/**（自定义域名，根路径 `/`）

仓库含 `CNAME` 时，`npm run prepare` 会自动使用根路径；无 `CNAME` 时使用 `/guofang-h5/` 子路径。

## 部署说明

完整步骤见 **[DEPLOY.md](DEPLOY.md)**（一次性配置 + 日常更新 + 排错）。

要点：仓库只保留 **一个** 工作流 [deploy-pages.yml](.github/workflows/deploy-pages.yml)，删除 GitHub 自带的 `static.yml`，避免重复部署且缺少路径修复。

## 部署到 GitHub Pages

1. 推送到 [silverbells221/guofang-h5](https://github.com/silverbells221/guofang-h5)。
2. 在仓库 **Settings → Pages** 中，将 **Source** 设为 **GitHub Actions**。
3. 推送 `main` 分支后，工作流 [deploy-pages.yml](.github/workflows/deploy-pages.yml) 会自动：
   - 写入 `.nojekyll`（避免 Jekyll 忽略 `_next` 目录）
   - 清理构建中间文件
   - 按仓库名自动设置子路径（项目页：`https://<user>.github.io/<repo>/`）
   - 部署到 Pages

### 用户/组织主页（根路径）

若仓库名为 `<username>.github.io`，脚本会自动使用根路径 `/`，无需额外配置。

### 项目页（子路径）

若仓库名为其他名称（例如 `out`），部署地址为：

`https://<username>.github.io/out/`

工作流会根据 `GITHUB_REPOSITORY` 自动改写资源路径。

手动本地预览子路径时：

```bash
set BASE_PATH=/out
npm run prepare
npm run serve
```

## 本地预览

```bash
npm run prepare
npm run serve
```

浏览器打开 **http://localhost:3000/**（已配置 `CNAME` 时用根路径预览）

## 重要：补全静态图片资源

以下文件应来自原 Next.js 项目的 `public/` 目录，**当前导出包中可能缺失**，部署前请复制到仓库根目录：

- `splash-bg.jpg` — 启动页背景
- `catalog-bg.png` — 目录页背景
- `icon-gangtie.png`、`icon-yingxiong.png`、`icon-guofang.png`、`icon-zhengce.png` — 目录图标
- `favicon.ico` — 站点图标

检查资源是否就绪：

```bash
npm run verify
```

若文件小于约 200 字节，说明仍是占位图，请用设计稿替换。`npm run prepare` 在缺失时会生成红色占位图，仅用于避免 404，不适合正式上线。

## 从源码重新导出（可选）

若你仍保留 Next.js 源码项目，建议在 `next.config` 中配置后再构建：

```js
/** @type {import('next').NextConfig} */
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1];
const isUserPage = repo?.endsWith('.github.io');
const basePath = process.env.BASE_PATH ?? (repo && !isUserPage ? `/${repo}` : '');

const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath,
  assetPrefix: basePath || undefined,
};

module.exports = nextConfig;
```

然后执行 `npm run build`，将生成的 `out/` 目录内容同步到本仓库。

## 内容页图片说明

「钢铁长城」等正文中的装备图使用外部 CDN（`aka.doubaocdn.com`），需联网才能显示；本地 `public/` 资源为启动页与目录页专用。
