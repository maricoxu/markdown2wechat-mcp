# 腾讯云 COS 配置步骤说明

## 📍 第一步：登录腾讯云

1. **访问腾讯云官网**
   - 网址：https://cloud.tencent.com/
   - 如果没有账号，点击右上角 **"免费注册"** 注册账号
   - 如果已有账号，点击 **"登录"**

2. **完成实名认证**（必须）
   - 登录后，如果未实名认证，需要先完成实名认证
   - 实名认证需要身份证或企业信息

---

## 📍 第二步：开通 COS 服务

1. **进入 COS 控制台**
   - 登录后，在顶部搜索框输入 **"对象存储"** 或 **"COS"**
   - 点击进入 **"对象存储 COS"** 服务

2. **开通服务**（首次使用）
   - 如果是首次使用，会看到 **"立即开通"** 按钮
   - 点击开通（**免费**，无费用）
   - 阅读并同意服务协议
   - 开通成功后，自动跳转到 COS 控制台

---

## 📍 第三步：创建存储桶（Bucket）

1. **创建存储桶**
   - 在 COS 控制台，点击左侧 **"存储桶列表"**
   - 点击 **"创建存储桶"** 按钮

2. **填写配置信息**
   
   **基础配置**：
   - **名称**：填写一个唯一的存储桶名称
     - 例如：`my-blog-images-2024` 或 `wenyan-images-20241118`
     - ⚠️ 规则：只能包含小写字母、数字、中划线和下划线，长度 3-63 个字符
   
   - **所属地域**：选择离你最近的地域
     - 推荐：`ap-guangzhou`（广州）
     - 其他选项：`ap-beijing`（北京）、`ap-shanghai`（上海）等
   
   **访问权限**（重要）：
   - ✅ 选择 **"公有读私有写"**（推荐）
     - 图片可以被外部访问（公众号需要）
     - 只有你（通过密钥）可以上传
   
   **其他配置**：
   - **存储类型**：`标准存储`（默认）
   - **服务端加密**：`不加密`（默认）
   - **日志记录**：可选

3. **完成创建**
   - 点击 **"创建"** 按钮
   - 等待创建完成（通常几秒钟）

4. **记录存储桶信息**
   - 创建成功后，在存储桶列表中可以看到你的存储桶
   - **记录以下信息**：
     - ✅ **存储桶名称**（Bucket）：例如 `my-blog-images-2024`
     - ✅ **所属地域**（Region）：例如 `ap-guangzhou`

---

## 📍 第四步：获取存储桶访问地址（Base URL）

1. **进入存储桶详情**
   - 在存储桶列表中，点击你刚创建的存储桶名称

2. **查看访问域名**
   - 在存储桶详情页，找到 **"基础配置"** 或 **"概览"** 标签
   - 找到 **"访问域名"** 或 **"默认 CDN 加速域名"**
   - 你会看到类似这样的地址：
     ```
     https://my-blog-images-2024-1234567890.cos.ap-guangzhou.myqcloud.com
     ```
   - **记录这个地址**，这就是 `COS_BASE_URL`

---

## 📍 第五步：获取访问密钥（SecretId 和 SecretKey）

1. **进入 API 密钥管理**
   - 点击控制台右上角 **头像/用户名**
   - 在下拉菜单中选择 **"访问管理"** 或 **"API密钥管理"**
   - 或者直接访问：https://console.cloud.tencent.com/cam/capi

2. **创建密钥**
   - 在 **"API密钥管理"** 页面，点击 **"新建密钥"** 或 **"创建密钥"**
   - 输入密钥名称（如：`wenyan-mcp` 或 `公众号图片上传`）
   - 点击 **"确定"** 或 **"创建"**

3. **保存密钥信息** ⚠️ **重要：只显示一次！**
   
   创建成功后，会显示两个关键信息：
   - ✅ **SecretId**：类似 `AKIDxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - ✅ **SecretKey**：类似 `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   
   **立即复制并保存这两个值**，关闭页面后就看不到了！

---

## 📍 第六步：整理配置信息

现在你应该有以下 5 个配置值：

| 配置项 | 示例值 | 说明 |
|--------|--------|------|
| `COS_SECRET_ID` | `AKIDxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | 从 API 密钥管理获取 |
| `COS_SECRET_KEY` | `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` | 从 API 密钥管理获取 |
| `COS_REGION` | `ap-guangzhou` | 存储桶所属地域 |
| `COS_BUCKET` | `my-blog-images-2024` | 存储桶名称 |
| `COS_BASE_URL` | `https://my-blog-images-2024-1234567890.cos.ap-guangzhou.myqcloud.com` | 存储桶访问地址 |

---

## 📍 第七步：配置到项目

### 方式一：在项目目录创建 `.env` 文件（推荐）

在项目根目录创建 `.env` 文件：

```env
# 腾讯云 COS 配置
COS_SECRET_ID=你的SecretId
COS_SECRET_KEY=你的SecretKey
COS_REGION=ap-guangzhou
COS_BUCKET=你的存储桶名称
COS_BASE_URL=https://your-bucket-1234567890.cos.ap-guangzhou.myqcloud.com
```

### 方式二：在 mcp.json 中添加环境变量

在 `~/.cursor/mcp.json` 文件的 `wenyan-mcp` 配置中添加：

```json
"env": {
  "WECHAT_APP_ID": "wxc187df0b64807694",
  "WECHAT_APP_SECRET": "1fddc1bf37301f5153f96060d66195f5",
  "COS_SECRET_ID": "你的SecretId",
  "COS_SECRET_KEY": "你的SecretKey",
  "COS_REGION": "ap-guangzhou",
  "COS_BUCKET": "你的存储桶名称",
  "COS_BASE_URL": "https://your-bucket-1234567890.cos.ap-guangzhou.myqcloud.com"
}
```

---

## 📍 第八步：验证配置

配置完成后，运行测试：

```bash
# 进入项目目录
cd "/Users/xuyehua/Library/Mobile Documents/iCloud~md~obsidian/Documents/yehua的笔记/2-Resources资料参考/markdown2wechat-mcp"

# 检查配置是否完整
node test/check-cos-config.js

# 如果配置正确，会显示：
# ✅ COS 配置完整
# 📊 配置信息：...
```

---

## 💡 常见问题

### Q1: 找不到访问域名？
- 在存储桶详情页的 **"基础配置"** → **"访问域名"** 中查找
- 或者查看 **"概览"** 页面的 **"默认 CDN 加速域名"**

### Q2: 存储桶名称被占用？
- 尝试添加数字或日期后缀
- 例如：`my-images-2024-11-18` 或 `blog-images-abc123`

### Q3: 密钥忘记了？
- 登录 [API密钥管理](https://console.cloud.tencent.com/cam/capi)
- 找到对应的密钥，点击 **"禁用"** 后重新创建新密钥
- ⚠️ 注意：禁用旧密钥后，使用旧密钥的程序将无法工作

### Q4: 如何确认配置是否正确？
- 运行 `node test/check-cos-config.js` 检查配置
- 运行 `node test/test-cos-upload.js` 测试上传功能

---

## 📚 相关链接

- 腾讯云官网：https://cloud.tencent.com/
- COS 控制台：https://console.cloud.tencent.com/cos
- API 密钥管理：https://console.cloud.tencent.com/cam/capi
- COS 官方文档：https://cloud.tencent.com/document/product/436

---

配置完成后，就可以使用 COS 上传功能了！🎉

