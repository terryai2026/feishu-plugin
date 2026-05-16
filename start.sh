#!/bin/bash
#
# 飞书机器人启动脚本
#

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=========================================="
echo "🤖 飞书机器人启动"
echo "=========================================="

# 检查 config.json 是否存在
if [ ! -f "config.json" ]; then
    echo "❌ 找不到 config.json"
    echo ""
    echo "请先创建 config.json，参考 config.json.example："
    echo ""
    echo "cp config.json.example config.json"
    echo ""
    echo "然后编辑 config.json，填入您的飞书应用凭证："
    echo "  - app_id"
    echo "  - app_secret"
    echo ""
    exit 1
fi

# 检查依赖
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，安装依赖..."
    npm install
fi

# 启动机器人
echo ""
node bot/index.js
