# 安装指南 - 完整依赖清单

本文档列出了项目的所有依赖和安装步骤。

## 📋 依赖清单

### 必需依赖（生产环境）

这些依赖会在 `pnpm install` 时自动安装：

| 依赖 | 版本 | 用途 |
|------|------|------|
| `@modelcontextprotocol/sdk` | 0.6.0 | MCP 协议支持 |
| `@wenyan-md/core` | ^1.0.12 | 文颜核心库（主题渲染） |
| `cos-nodejs-sdk-v5` | ^2.15.4 | 腾讯云 COS SDK（图片上传） |
| `dotenv` | ^17.2.3 | 环境变量管理 |
| `remark` | ^15.0.1 | Markdown 解析 |
| `remark-gfm` | ^4.0.1 | GitHub Flavored Markdown 支持 |
| `roughjs` | ^4.6.6 | 手绘风格生成库 |
| `sharp` | ^0.34.4 | 高性能图片处理（SVG/PNG/JPG） |
| `unified` | ^11.0.5 | Markdown 处理框架 |
| `zod` | ^4.1.12 | 配置验证和类型安全 |

### 开发依赖

这些依赖会在 `pnpm install` 时自动安装：

| 依赖 | 版本 | 用途 |
|------|------|------|
| `@mermaid-js/mermaid-cli` | ^11.12.0 | Mermaid 图表渲染 CLI |
| `@types/jsdom` | ^27.0.0 | TypeScript 类型定义 |
| `@types/node` | ^20.17.57 | Node.js 类型定义 |
| `jsdom` | ^27.1.0 | SVG DOM 操作和解析 |
| `puppeteer` | ^24.27.0 | 浏览器自动化（手绘风格文字渲染） |
| `typescript` | ^5.3.3 | TypeScript 编译器 |
| `vitest` | ^3.2.3 | 单元测试框架 |

### 系统依赖（需要单独安装）

1. **Node.js**: >= 18.0.0
   ```bash
   node --version  # 检查版本
   ```

2. **包管理器**: pnpm >= 10.7.1（推荐）或 npm/yarn
   ```bash
   npm install -g pnpm  # 安装 pnpm
   ```

3. **Puppeteer Chrome 浏览器**（可选但推荐）
   ```bash
   npx puppeteer browsers install chrome
   ```
   - **作用**: 手绘风格功能中正确渲染文字
   - **大小**: 约 200MB
   - **注意**: 不安装时文字可能丢失，但图形仍可正常显示

## 🚀 快速安装

### 一键安装所有依赖

```bash
# 1. 克隆项目
git clone https://github.com/caol64/wenyan-mcp.git
cd wenyan-mcp

# 2. 安装 Node.js 依赖
pnpm install

# 3. 安装 Puppeteer Chrome（推荐，用于手绘风格文字渲染）
npx puppeteer browsers install chrome

# 4. 编译项目
pnpm build

# 5. 验证安装
pnpm test
```

### 验证关键依赖

```bash
# 验证 mermaid-cli
npx mmdc --version

# 验证 Puppeteer（如果已安装 Chrome）
node -e "require('puppeteer').launch().then(b => {b.close(); console.log('✓ Puppeteer OK')}).catch(e => console.log('✗ Puppeteer:', e.message))"

# 验证 Sharp
node -e "require('sharp').versions && console.log('✓ Sharp OK')"

# 验证 Rough.js
node -e "require('roughjs') && console.log('✓ Rough.js OK')"
```

## 🔧 环境变量配置

创建 `.env` 文件（可选，用于配置功能）：

```env
# 微信公众号配置（必需，用于发布功能）
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_app_secret

# 腾讯云 COS 配置（可选，用于图片上传功能）
COS_SECRET_ID=your_cos_secret_id
COS_SECRET_KEY=your_cos_secret_key
COS_REGION=ap-guangzhou
COS_BUCKET=your_bucket_name

# Mermaid 配置（可选）
MERMAID_ENGINE=local          # local 或 kroki
MERMAID_SCALE=1.5             # 缩放比例
MERMAID_BACKGROUND=#ffffff    # 背景颜色
MERMAID_FORMAT=png            # png 或 jpg
OUTPUT_DIR=.assets            # 输出目录
```

## 📦 依赖说明

### 核心依赖详解

#### 1. Mermaid CLI (`@mermaid-js/mermaid-cli`)
- **用途**: 将 Mermaid 代码渲染为 SVG/PNG
- **必需**: ✅ 是（用于 `convert_mermaid` 功能）
- **安装**: 已包含在 devDependencies，通过 `pnpm install` 自动安装
- **验证**: `npx mmdc --version`

#### 2. Puppeteer
- **用途**: 浏览器自动化，用于手绘风格功能中的文字渲染
- **必需**: ⚠️ 可选但推荐（不安装时文字可能丢失）
- **安装**: 
  ```bash
  # 1. 安装 npm 包（已包含）
  pnpm install
  
  # 2. 安装 Chrome 浏览器（需要单独执行）
  npx puppeteer browsers install chrome
  ```
- **大小**: Chrome 约 200MB
- **验证**: `node -e "require('puppeteer').launch().then(b => b.close())"`

#### 3. Sharp
- **用途**: 高性能图片处理，SVG 转 PNG/JPG
- **必需**: ✅ 是
- **安装**: 自动安装
- **系统要求**: 可能需要系统库支持（libvips）
- **验证**: `node -e "require('sharp')"`

#### 4. Rough.js
- **用途**: 生成手绘风格效果
- **必需**: ✅ 是（用于手绘风格功能）
- **安装**: 自动安装
- **验证**: `node -e "require('roughjs')"`

#### 5. JSDOM
- **用途**: SVG DOM 操作和解析
- **必需**: ✅ 是（用于手绘风格转换）
- **安装**: 自动安装
- **验证**: `node -e "require('jsdom')"`

## 🐛 常见安装问题

### 问题 1: Puppeteer 安装 Chrome 失败

**症状**: 
```
Could not find Chrome (ver. xxx)
```

**解决方案**:
```bash
# 方法 1: 使用国内镜像
export PUPPETEER_DOWNLOAD_HOST=https://npmmirror.com/mirrors
npx puppeteer browsers install chrome

# 方法 2: 手动指定下载路径
export PUPPETEER_CACHE_DIR=/path/to/cache
npx puppeteer browsers install chrome

# 方法 3: 跳过安装（使用 Sharp 回退，文字可能丢失）
# 无需操作，代码会自动回退
```

### 问题 2: Sharp 安装失败

**症状**: 
```
sharp: Installation error
```

**解决方案**:
```bash
# macOS
brew install vips

# Ubuntu/Debian
sudo apt-get install libvips-dev

# 然后重新安装
pnpm install sharp --force
```

### 问题 3: 依赖版本冲突

**解决方案**:
```bash
# 清理并重新安装
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## ✅ 安装检查清单

安装完成后，请检查：

- [ ] Node.js >= 18.0.0
- [ ] `pnpm install` 成功
- [ ] `pnpm build` 成功
- [ ] `npx mmdc --version` 可用
- [ ] Puppeteer Chrome 已安装（可选）
- [ ] `.env` 文件已配置（如需要）
- [ ] `pnpm test` 通过

## 📚 相关文档

- [README.md](README.md) - 项目主文档
- [docs/MERMAID_GUIDE.md](docs/MERMAID_GUIDE.md) - Mermaid 使用指南
- [docs/HAND_DRAWN_IMPLEMENTATION.md](docs/HAND_DRAWN_IMPLEMENTATION.md) - 手绘风格实现文档

## 💡 提示

1. **首次安装**: 建议完整安装所有依赖，包括 Puppeteer Chrome
2. **仅基础功能**: 如果不使用手绘风格，可以跳过 Puppeteer Chrome 安装
3. **网络问题**: 如果下载依赖慢，可以使用国内镜像：
   ```bash
   pnpm config set registry https://registry.npmmirror.com
   ```

