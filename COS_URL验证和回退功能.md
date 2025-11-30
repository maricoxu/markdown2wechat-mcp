# COS URL 验证和回退功能

## 问题描述

在使用 `publish_wechat` 工具发布文章到微信公众号时，如果 COS URL 无法访问（返回 404），`getGzhContent` 函数会尝试下载图片失败，导致整个发布流程失败。

## 解决方案

添加了 COS URL 验证和自动回退功能：

1. **URL 验证工具** (`src/utils/url-validator.ts`)
   - `validateUrl()`: 验证单个 URL 是否可以访问
   - `validateUrls()`: 批量验证多个 URL，支持并发验证

2. **自动回退机制** (`src/index.ts`)
   - 在调用 `getGzhContent` 之前，验证所有 COS URL
   - 如果 COS URL 无法访问，自动回退到本地路径
   - 支持正文图片和 Frontmatter 中的封面图片

## 实现细节

### URL 验证逻辑

```typescript
// 使用 HEAD 请求验证 URL，超时时间 5 秒
const response = await fetch(url, {
  method: "HEAD",
  signal: controller.signal,
  headers: {
    "User-Agent": "Mozilla/5.0 (compatible; markdown2wechat-mcp/1.0)",
  },
});
```

### 回退逻辑

1. 提取所有 COS URL（正文图片和封面图片）
2. 批量验证 URL 可访问性
3. 对于无法访问的 URL：
   - 从上传结果中找到对应的本地路径
   - 将 COS URL 替换回本地路径
4. 使用处理后的内容调用 `getGzhContent`

## 使用效果

### 之前的行为

```
[错误] Failed to download image from URL: https://yexiaoli-1342931294.cos.ap-shanghai.myqcloud.com/2025/11/SCR-20251128-tsxp.png
```

### 现在的行为

```
[发布] 验证 COS URL 可访问性...
[URL验证] 开始验证 6 个 URL...
[URL验证] ❌ https://yexiaoli-1342931294.cos.ap-shanghai.myqcloud.com/2025/11/SCR-20251128-tsxp.png
[发布] COS URL 无法访问，回退到本地路径: https://... -> /Users/.../SCR-20251128-tsxp.png
[发布] 共有 1 个 COS URL 无法访问，已回退到本地路径
```

## 配置说明

### 超时时间

默认超时时间为 5 秒，可以通过修改 `validateUrls()` 的 `timeout` 参数调整。

### 并发数

默认并发验证数为 5，可以通过修改 `validateUrls()` 中的 `concurrency` 变量调整。

## 注意事项

1. **性能影响**：URL 验证会增加发布时间，特别是图片较多时
2. **网络依赖**：验证需要网络连接，如果网络不稳定可能影响验证结果
3. **COS 配置**：如果 COS URL 经常无法访问，建议检查 COS 配置：
   - 存储桶访问权限是否设置为"公有读私有写"
   - COS URL 是否正确
   - 网络连接是否正常

## 后续优化建议

1. **缓存验证结果**：对于已验证的 URL，可以缓存结果避免重复验证
2. **异步验证**：在 Pipeline 执行过程中就开始验证，而不是等到最后
3. **更详细的错误信息**：提供更详细的错误原因（权限问题、网络问题等）
4. **重试机制**：对于网络错误，可以添加重试机制

## 测试建议

1. 测试正常情况：所有 COS URL 都可以访问
2. 测试部分失败：部分 COS URL 无法访问
3. 测试全部失败：所有 COS URL 都无法访问
4. 测试网络超时：模拟网络超时情况

