# GitHub 推送指南

## 当前状态

✅ Git 仓库已初始化  
✅ 代码已提交 (commit de3a2a0)  
✅ 远程仓库地址已配置  
❌ 需要创建 GitHub 仓库并推送

---

## 方法一：手动创建仓库（推荐）

### 步骤 1: 创建 GitHub 仓库

1. 访问 https://github.com/new
2. 仓库名：`imf-weo-analyzer`
3. 描述：IMF World Economic Outlook Database Analyzer
4. 选择 **Private** 或 **Public**
5. **不要** 勾选 "Add a README file"
6. 点击 "Create repository"

### 步骤 2: 推送到 GitHub

仓库创建后，在终端执行：

```bash
cd /home/admin/openclaw/workspace/skills/imf-weo-analyzer

# 如果使用 HTTPS
git remote set-url origin https://github.com/davidchizhang/imf-weo-analyzer.git
git push -u origin main

# 如果使用 SSH（需要先配置 SSH key）
git remote set-url origin git@github.com:davidchizhang/imf-weo-analyzer.git
git push -u origin main
```

---

## 方法二：使用 GitHub CLI

### 安装 GitHub CLI

```bash
# Ubuntu/Debian
sudo apt update && sudo apt install gh

# 或使用 npm
npm install -g gh
```

### 登录 GitHub

```bash
gh auth login
# 按提示选择 GitHub.com → HTTPS → 登录浏览器
```

### 创建并推送仓库

```bash
cd /home/admin/openclaw/workspace/skills/imf-weo-analyzer

# 创建私有仓库
gh repo create imf-weo-analyzer --private --source=. --remote=origin --push

# 或创建公开仓库
gh repo create imf-weo-analyzer --public --source=. --remote=origin --push
```

---

## 方法三：使用 GitHub Token

### 生成 Token

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 勾选 `repo` 权限
4. 生成并复制 token

### 使用 Token 推送

```bash
cd /home/admin/openclaw/workspace/skills/imf-weo-analyzer

# 使用 token 推送（替换 YOUR_TOKEN）
git remote set-url origin https://YOUR_TOKEN@github.com/davidchizhang/imf-weo-analyzer.git
git push -u origin main
```

---

## 验证推送

推送成功后，访问：
https://github.com/davidchizhang/imf-weo-analyzer

应该能看到所有文件。

---

## 常见问题

### Q: SSH 连接失败
**A**: 使用 HTTPS 方式，或重新配置 SSH key：
```bash
# 生成 SSH key
ssh-keygen -t ed25519 -C "davidzhang6868@hotmail.com"

# 添加公钥到 GitHub
cat ~/.ssh/id_ed25519.pub
# 复制输出内容到 https://github.com/settings/keys
```

### Q: 权限错误
**A**: 确保使用正确的用户名和密码（或 token）

### Q: 仓库已存在
**A**: 删除已有仓库或使用不同的仓库名

---

## 当前 Git 状态

```bash
cd /home/admin/openclaw/workspace/skills/imf-weo-analyzer
git log --oneline
# 输出：de3a2a0 feat: IMF WEO Analyzer v1.1.1
```

---

## 推送后的操作

推送成功后，可以在 README.md 中添加徽章：

```markdown
![Version](https://img.shields.io/badge/version-1.1.1-blue)
![License](https://img.shields.io/badge/license-MIT-green)
```

---

**选择方法一（手动创建）最简单快捷！**
