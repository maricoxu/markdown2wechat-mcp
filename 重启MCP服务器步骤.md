# 重启 MCP 服务器步骤

## ✅ 已完成

1. **更新了 MCP 配置文件路径**
   - 旧路径：`/Users/xuyehua/Code/markdown2wechat-mcp/dist/index.js`
   - 新路径：`/Users/xuyehua/Library/Mobile Documents/iCloud~md~obsidian/Documents/yehua的笔记/2-Resources资料参考/markdown2wechat-mcp/dist/index.js`
   - 配置文件位置：`~/.cursor/mcp.json`

2. **验证文件存在**
   - ✅ 编译后的文件已存在

## 🔄 重启 MCP 服务器

### 方法 1: 在 Cursor 中重新加载 MCP 配置（推荐）

1. 打开 Cursor
2. 按 `Cmd + Shift + P` (Mac) 或 `Ctrl + Shift + P` (Windows/Linux)
3. 输入 "MCP" 或 "Reload"
4. 选择 "MCP: Reload Servers" 或类似选项
5. 等待 MCP 服务器重新加载

### 方法 2: 重启 Cursor（最可靠）

1. 完全退出 Cursor（`Cmd + Q` 或 `Ctrl + Q`）
2. 重新启动 Cursor
3. MCP 服务器会自动使用新配置重新加载

### 方法 3: 检查 MCP 服务器状态

在 Cursor 中：
1. 打开命令面板（`Cmd + Shift + P`）
2. 输入 "MCP" 查看相关命令
3. 可以查看 MCP 服务器状态和日志

## ✅ 验证重启成功

重启后，尝试使用 `publish_wechat` 工具，应该能看到：

1. **详细的上传日志**
   ```
   [上传] ========================================
   [上传] 📁 文件信息: ...
   [上传] ⚙️ COS 配置: ...
   [上传] 📤 开始上传到 COS...
   ```

2. **上传结果统计**
   ```
   [发布] 📊 上传结果统计:
   [发布]   - 需要上传的图片数: X
   [发布]   - 成功上传的图片数: X
   [发布]   - 上传失败的图片数: 0
   ```

3. **URL 验证结果**
   ```
   [发布] 🔍 验证 COS URL 可访问性...
   [发布] 📊 URL 验证结果: ...
   ```

## 📝 注意事项

- 如果重启后仍然看到旧的错误信息，可能需要等待几秒钟让服务器完全加载
- 如果问题持续，检查 Cursor 的 MCP 服务器日志
- 确保 COS 配置环境变量已正确设置

## 🔍 检查配置

重启后，可以检查 MCP 服务器是否使用了新路径：

1. 查看 Cursor 的 MCP 服务器日志
2. 确认服务器启动时使用的是新路径
3. 如果路径错误，检查 `~/.cursor/mcp.json` 文件

