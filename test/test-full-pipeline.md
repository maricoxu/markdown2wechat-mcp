---
title: "完整流程测试文档"
summary: "测试 Mermaid 转图片、COS 上传、自动替换的完整流程"
tags: ["test", "pipeline", "mermaid"]
cover: "https://example.com/cover.jpg"
---

# 完整流程测试

这是一篇测试文档，包含 Mermaid 图表和其他内容，用于测试完整的发布流程。

## 普通文本段落

这是一段普通文本，用于测试文档中除了 Mermaid 之外的内容是否正常处理。

## Mermaid 流程图

下面是一个流程图，应该会被转换为图片并上传到 COS：

![mermaid-1](https://yexiaoli-1342931294.cos.ap-shanghai.myqcloud.com/articles/2025/11/test-full-pipeline__mmd_0.png)



## 更多普通内容

这是流程图后面的内容，应该保持原样。

## 时序图示例

![mermaid-2](https://yexiaoli-1342931294.cos.ap-shanghai.myqcloud.com/articles/2025/11/test-full-pipeline__mmd_1.png)



## 图片测试

这里还有一张本地图片：

![测试图片](https://yexiaoli-1342931294.cos.ap-shanghai.myqcloud.com/articles/2025/11/test-direct.png)

## 总结

文档应该包含：
1. ✅ 普通 Markdown 内容
2. ✅ Mermaid 代码块（会被转换为图片）
3. ✅ 本地图片（会被上传到 COS）
4. ✅ 所有图片链接都会被替换为 COS URL

