#!/bin/bash
set -e

# ============================================================
# LX-M Doc 一键部署脚本
# 支持：本地构建部署 / GitHub Pages 自动部署 / 服务器部署
# ============================================================

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
REPO_URL="https://github.com/Miao-moe/lx-m-doc.git"
BRANCH="main"
BUILD_DIR="build"
NODE_VERSION="20"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   LX-M Doc 一键部署脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 检查 Node.js
check_node() {
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js 未安装${NC}"
        echo "请安装 Node.js ${NODE_VERSION}+: https://nodejs.org/"
        exit 1
    fi

    NODE_CURRENT=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_CURRENT" -lt "$NODE_VERSION" ]; then
        echo -e "${RED}❌ Node.js 版本过低，需要 ${NODE_VERSION}+，当前 $(node -v)${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Node.js $(node -v)${NC}"
}

# 检查 Git
check_git() {
    if ! command -v git &> /dev/null; then
        echo -e "${RED}❌ Git 未安装${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Git $(git --version | cut -d' ' -f3)${NC}"
}

# 安装依赖
install_deps() {
    echo ""
    echo -e "${YELLOW}📦 安装依赖...${NC}"
    if [ -f "package-lock.json" ]; then
        npm ci
    else
        npm install
    fi
    echo -e "${GREEN}✅ 依赖安装完成${NC}"
}

# 构建
build_site() {
    echo ""
    echo -e "${YELLOW}🔨 构建站点...${NC}"
    npm run build
    echo -e "${GREEN}✅ 构建完成${NC}"
}

# 部署到 GitHub Pages（通过 gh-pages 分支）
deploy_gh_pages() {
    echo ""
    echo -e "${YELLOW}🚀 部署到 GitHub Pages...${NC}"

    # 检查是否有 gh-pages 分支
    if git show-ref --verify --quiet refs/heads/gh-pages; then
        git branch -D gh-pages
    fi

    # 创建孤儿分支
    git checkout --orphan gh-pages

    # 删除所有文件，保留 build
    git rm -rf .
    cp -r ${BUILD_DIR}/* .
    rm -rf ${BUILD_DIR} node_modules .gitignore

    # 创建 .nojekyll 防止 Jekyll 处理
    touch .nojekyll

    # 提交
    git add .
    git commit -m "Deploy to GitHub Pages - $(date '+%Y-%m-%d %H:%M:%S')"

    # 强制推送到 gh-pages
    git push origin gh-pages --force

    # 切回 main
    git checkout main

    echo -e "${GREEN}✅ 已部署到 GitHub Pages${NC}"
    echo -e "${BLUE}🌐 访问地址：https://miao-moe.github.io/lx-m-doc/${NC}"
}

# 部署到服务器（通过 rsync/ssh）
deploy_server() {
    echo ""
    echo -e "${YELLOW}🚀 部署到服务器...${NC}"

    read -p "请输入服务器地址 (user@host): " SERVER
    read -p "请输入部署路径 (如 /var/www/lx-m-doc): " REMOTE_PATH
    read -p "请输入 SSH 端口 [22]: " SSH_PORT
    SSH_PORT=${SSH_PORT:-22}

    if ! command -v rsync &> /dev/null; then
        echo -e "${YELLOW}⚠️ rsync 未安装，使用 scp...${NC}"
        scp -P ${SSH_PORT} -r ${BUILD_DIR}/* ${SERVER}:${REMOTE_PATH}/
    else
        rsync -avz --delete -e "ssh -p ${SSH_PORT}" ${BUILD_DIR}/ ${SERVER}:${REMOTE_PATH}/
    fi

    echo -e "${GREEN}✅ 已部署到服务器${NC}"
}

# 本地预览
serve_local() {
    echo ""
    echo -e "${YELLOW}🌐 启动本地预览...${NC}"
    npm run serve
}

# 主菜单
show_menu() {
    echo ""
    echo "请选择部署方式："
    echo "  1) 构建并部署到 GitHub Pages（gh-pages 分支）"
    echo "  2) 构建并部署到远程服务器"
    echo "  3) 仅构建，不部署"
    echo "  4) 本地预览（serve）"
    echo "  5) 完整流程：安装依赖 → 构建 → 部署到 GitHub Pages"
    echo "  q) 退出"
    echo ""
}

# 主流程
main() {
    check_node
    check_git

    show_menu
    read -p "请输入选项 [1-5/q]: " CHOICE

    case $CHOICE in
        1)
            build_site
            deploy_gh_pages
            ;;
        2)
            build_site
            deploy_server
            ;;
        3)
            build_site
            echo -e "${GREEN}✅ 构建产物位于 ${BUILD_DIR}/ 目录${NC}"
            ;;
        4)
            build_site
            serve_local
            ;;
        5)
            install_deps
            build_site
            deploy_gh_pages
            ;;
        q|Q)
            echo -e "${BLUE}👋 再见！${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ 无效选项${NC}"
            exit 1
            ;;
    esac
}

main "$@"
