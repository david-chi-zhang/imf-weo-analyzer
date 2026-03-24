#!/bin/bash

# GitHub 推送脚本
# 使用方法：./push-to-github.sh

echo "🚀 开始推送到 GitHub..."
echo ""

cd /home/admin/openclaw/workspace/skills/imf-weo-analyzer

# 检查远程仓库
echo "📋 当前远程仓库配置:"
git remote -v
echo ""

# 尝试推送
echo "📤 开始推送..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 推送成功！"
    echo ""
    echo "📍 访问仓库："
    echo "   https://github.com/davidchizhang/imf-weo-analyzer"
    echo ""
    echo "📝 下一步："
    echo "   1. 访问上面的 URL 验证文件是否上传成功"
    echo "   2. 可以添加仓库描述和 topic 标签"
    echo "   3. 考虑添加 GitHub Actions 进行 CI/CD"
else
    echo ""
    echo "❌ 推送失败！"
    echo ""
    echo "🔧 可能的解决方案："
    echo ""
    echo "1. 确认仓库已创建："
    echo "   访问 https://github.com/new 创建 'imf-weo-analyzer' 仓库"
    echo ""
    echo "2. 使用 GitHub Token："
    echo "   a. 访问 https://github.com/settings/tokens"
    echo "   b. 生成新 token（勾选 repo 权限）"
    echo "   c. 复制 token"
    echo "   d. 执行："
    echo "      git remote set-url origin https://YOUR_TOKEN@github.com/davidchizhang/imf-weo-analyzer.git"
    echo "      git push -u origin main"
    echo ""
    echo "3. 使用 SSH（如果配置了 SSH key）："
    echo "   git remote set-url origin git@github.com:davidchizhang/imf-weo-analyzer.git"
    echo "   git push -u origin main"
    echo ""
    echo "4. 检查用户名是否正确："
    echo "   当前配置的用户名：davidchizhang"
    echo "   如果不是你的 GitHub 用户名，请执行："
    echo "   git remote set-url origin https://github.com/YOUR_USERNAME/imf-weo-analyzer.git"
fi
