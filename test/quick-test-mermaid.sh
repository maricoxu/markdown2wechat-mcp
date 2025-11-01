#!/bin/bash

# Mermaid 渲染快速测试脚本

echo "🧪 开始 Mermaid 渲染测试..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 检查 mermaid-cli
echo "📦 步骤 1: 检查 mermaid-cli 安装..."
if npx mmdc --version > /dev/null 2>&1; then
    VERSION=$(npx mmdc --version)
    echo -e "${GREEN}✓ mermaid-cli 已安装 (版本: $VERSION)${NC}"
else
    echo -e "${RED}✗ mermaid-cli 未安装${NC}"
    exit 1
fi
echo ""

# 2. 创建简单的测试文件
echo "📝 步骤 2: 创建简单测试..."
TEST_FILE="/tmp/simple-mermaid-test.md"
cat > "$TEST_FILE" << 'EOF'
---
title: 简单测试
---

# 测试文档

```mermaid
graph LR
    A[开始] --> B[结束]
```
EOF

echo -e "${GREEN}✓ 测试文件已创建: $TEST_FILE${NC}"
echo ""

# 3. 手动渲染单个图表
echo "🎨 步骤 3: 手动渲染测试..."
TEST_MMD="/tmp/test.mmd"
TEST_PNG="/tmp/test.png"

cat > "$TEST_MMD" << 'EOF'
graph TD
    A[Markdown文件] --> B[检测mermaid代码块]
    B --> C[调用mermaid-cli]
    C --> D[生成PNG图片]
    D --> E[替换为图片引用]
EOF

if npx mmdc -i "$TEST_MMD" -o "$TEST_PNG" --scale 1.5 --backgroundColor "#ffffff" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ 图片渲染成功: $TEST_PNG${NC}"
    if [ -f "$TEST_PNG" ]; then
        SIZE=$(ls -lh "$TEST_PNG" | awk '{print $5}')
        echo "  文件大小: $SIZE"
        echo -e "${YELLOW}  提示: 可使用 'open $TEST_PNG' 查看图片${NC}"
    fi
else
    echo -e "${RED}✗ 渲染失败${NC}"
    exit 1
fi
echo ""

# 4. 显示测试文件路径
echo "📂 步骤 4: 完整测试文件路径..."
FULL_TEST_FILE="/Users/xuyehua/Code/markdown2wechat-mcp/test/test-mermaid.md"
if [ -f "$FULL_TEST_FILE" ]; then
    echo -e "${GREEN}✓ 完整测试文件存在${NC}"
    echo "  路径: $FULL_TEST_FILE"
    
    # 统计 mermaid 代码块数量
    COUNT=$(grep -c '```mermaid' "$FULL_TEST_FILE" || echo 0)
    echo "  包含 $COUNT 个 mermaid 代码块"
else
    echo -e "${RED}✗ 完整测试文件不存在${NC}"
fi
echo ""

# 5. 显示使用手册
echo "📖 步骤 5: 使用手册位置..."
GUIDE_FILE="/Users/xuyehua/Code/markdown2wechat-mcp/docs/MERMAID_GUIDE.md"
if [ -f "$GUIDE_FILE" ]; then
    echo -e "${GREEN}✓ 使用手册已创建${NC}"
    echo "  路径: $GUIDE_FILE"
    echo -e "${YELLOW}  提示: 可使用 'cat $GUIDE_FILE' 查看完整手册${NC}"
else
    echo -e "${RED}✗ 使用手册不存在${NC}"
fi
echo ""

# 总结
echo "════════════════════════════════════════"
echo "✅ 测试完成！"
echo ""
echo "接下来可以："
echo "1. 查看渲染的测试图片: open $TEST_PNG"
echo "2. 在 Cursor 中使用 convert_mermaid 工具"
echo "3. 测试完整的 test-mermaid.md 文件"
echo "4. 阅读使用手册: cat docs/MERMAID_GUIDE.md"
echo ""
echo "在 Cursor 中测试示例："
echo -e "${YELLOW}"
cat << 'EXAMPLE'
请使用 convert_mermaid 工具转换文件：
/Users/xuyehua/Code/markdown2wechat-mcp/test/test-mermaid.md

参数：
- scale: 1.5
- format: png
EXAMPLE
echo -e "${NC}"
echo "════════════════════════════════════════"

