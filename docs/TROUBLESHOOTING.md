# 故障排查指南

## 常见问题

### 问题 1: Mermaid 代码块没有被替换成图片链接

**症状：**
- ✅ 图片已上传到 COS
- ❌ Markdown 中的 Mermaid 代码块还在，没有被替换

**可能的原因和解决方案：**

#### 原因 1: 只启用了 `uploadImages`，没有启用 `convertMermaid`

**检查：** 确认 `runPipeline` 配置中两个选项都设为 `true`：

```json
{
  "runPipeline": {
    "convertMermaid": true,   // ← 必须为 true
    "uploadImages": true      // ← 必须为 true
  }
}
```

**错误示例：**
```json
{
  "runPipeline": {
    "convertMermaid": false,  // ❌ 错误：设置为 false 不会转换
    "uploadImages": true
  }
}
```

#### 原因 2: Mermaid 转换过程出错，但错误被忽略

**检查方法：**
1. 查看日志输出，寻找以下信息：
   - `"步骤 1: 转换 Mermaid 代码块..."`
   - `"已转换 X 个 Mermaid 图表，文件已更新"`
   - `"准备替换 X 个 Mermaid 代码块"`
   - `"成功替换 X 个 Mermaid 代码块"`

2. 如果没有看到这些日志，说明 `convertMermaid` 没有执行或失败了

**解决方案：**
- 检查是否安装了 `@mermaid-js/mermaid-cli`：
  ```bash
  npm install -g @mermaid-js/mermaid-cli
  # 或
  npx @mermaid-js/mermaid-cli --version
  ```
- 检查 Mermaid 代码语法是否正确
- 查看错误日志，确认具体的错误信息

#### 原因 3: 文件写入权限问题

**检查方法：**
- 确认 Markdown 文件有写入权限
- 查看日志中是否有文件写入错误

#### 原因 4: 正则表达式匹配问题

**检查方法：**
- 确认 Mermaid 代码块格式正确：
  ```markdown
  ```mermaid
  graph TD
      A --> B
  ```
  ```
- 代码块前后不能有多余的空格或特殊字符

### 问题 2: 图片上传到 COS 后，链接没有替换

**症状：**
- ✅ 图片已上传到 COS（可以在 COS 控制台看到）
- ❌ Markdown 中的图片链接还是本地路径

**可能的原因：**

#### 原因 1: 路径匹配问题

`rewriteImageLinksInFile` 通过绝对路径匹配本地图片和 COS URL。如果路径不一致，无法匹配。

**检查方法：**
- 查看日志中的路径信息
- 确认本地图片路径和上传时的路径是否一致

#### 原因 2: 图片已经在 Markdown 中被替换为网络链接

如果图片已经是 `http://` 或 `https://` 开头，`rewriteImageLinks` 会跳过。

**检查方法：**
- 查看 Markdown 文件，确认图片链接格式

### 问题 3: Pipeline 执行顺序混乱

**正确的执行顺序应该是：**
1. ✅ Mermaid 转图片（替换代码块为本地图片链接）
2. ✅ 收集所有图片（包括 Mermaid 生成的）
3. ✅ 上传图片到 COS
4. ✅ 替换本地图片链接为 COS URL

**如果顺序不对，会导致：**
- Mermaid 代码块没有被替换
- 本地图片链接没有被替换

**检查方法：**
查看日志中的步骤顺序，确保：
```
[INFO] 步骤 1: 转换 Mermaid 代码块...
[INFO] 已转换 X 个 Mermaid 图表，文件已更新
[INFO] 步骤 2: 收集本地图片...
[INFO] 步骤 3: 上传图片到 COS...
[INFO] 步骤 4: 回写图片链接...
```

## 调试技巧

### 1. 启用详细日志

查看完整的日志输出，关注：
- 每个步骤的开始和结束
- 错误信息和堆栈
- 文件路径和替换信息

### 2. 检查中间文件

处理后的文件应该：
- Mermaid 代码块被替换为 `![mermaid-X](.assets/file__mmd_X.png)` 格式
- 本地图片链接被替换为 COS URL

### 3. 逐步测试

分别测试各个步骤：
1. 只启用 `convertMermaid: true, uploadImages: false` - 检查 Mermaid 是否被替换
2. 只启用 `convertMermaid: false, uploadImages: true` - 检查图片是否上传
3. 两者都启用 - 检查完整流程

### 4. 查看生成的备份文件

如果 Mermaid 代码块被转换，应该会生成：
- `.assets/.mermaid-backup/article__mmd_0.mmd` - 原始代码备份
- `.assets/article__mmd_0.png` - 生成的图片

如果这些文件存在，说明转换步骤执行了，问题可能在替换逻辑。

## 快速诊断命令

```bash
# 检查 Mermaid CLI 是否安装
mmdc --version

# 检查文件是否有 Mermaid 代码块
grep -r "```mermaid" your-file.md

# 检查文件是否包含图片链接
grep -r "!\[.*\](" your-file.md

# 检查备份文件是否存在
ls -la .assets/.mermaid-backup/
```

