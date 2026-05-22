# 推送到 GitHub（一次性设置）

本地已完成首次提交（分支 `main`）。按下面任选一种方式完成推送。

## 方式 A：GitHub CLI（推荐）

在终端执行：

```powershell
cd D:\2026\github\out
gh auth login
```

按提示在浏览器完成登录后：

```powershell
gh repo create out --public --source=. --remote=origin --push --description "戎耀君山国防教育课堂 - 静态站点"
```

若仓库 `out` 已在 GitHub 上创建，只需：

```powershell
git remote add origin https://github.com/Silverbells/out.git
git push -u origin main
```

## 方式 B：网页创建仓库后推送

1. 打开 https://github.com/new
2. 仓库名填 `out`（或你喜欢的名称），选 **Public**，不要勾选「Add a README」
3. 创建后执行（把 `YOUR_USER` 和 `YOUR_REPO` 换成你的）：

```powershell
cd D:\2026\github\out
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

## 启用 GitHub Pages

推送成功后：

1. 仓库 **Settings → Pages**
2. **Source** 选择 **GitHub Actions**
3. 工作流会自动部署；项目页地址一般为 `https://<用户名>.github.io/<仓库名>/`
