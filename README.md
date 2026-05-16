# feishu-tool 飞书工具插件

让 Claude Code 可以发送飞书消息、查询项目进度，以及与 AI 助手对话。

## 功能

- 🤖 AI 智能对话 - 通过飞书与 Claude AI 助手交互
- 📤 发送飞书消息 - 从 Claude Code 发送消息到飞书
- 📊 项目进度查询 - 随时了解各项目开发状态
- 🔔 任务完成通知 - 向飞书群组或个人发送通知

## 安装

```bash
# 克隆到插件目录
git clone https://github.com/terryai2026/feishu-plugin.git ~/.claude/plugins/feishu-plugin

cd ~/.claude/plugins/feishu-plugin

# 安装依赖
npm install
```

## 配置

### 1. 创建配置文件

```bash
cp config.json.example config.json
```

### 2. 编辑 config.json

```json
{
  "feishu": {
    "app_id": "cli_xxx",
    "app_secret": "xxx"
  },
  "claude": {
    "api_key": "your_claude_api_key",
    "base_url": "https://api.53hk.cn",
    "model": "MiniMax-M2.7-highspeed"
  },
  "projects_root": "/Users/terry/.claude/projects"
}
```

**配置说明：**

| 配置项 | 说明 |
|--------|------|
| `feishu.app_id` | 飞书应用 App ID |
| `feishu.app_secret` | 飞书应用 App Secret |
| `claude.api_key` | Claude API 密钥 |
| `claude.base_url` | Claude API 地址 |
| `claude.model` | 使用的模型 |
| `projects_root` | 项目根目录 |

### 3. 飞书应用配置

在 [飞书开放平台](https://open.feishu.cn/)：

1. 创建自建应用，获取 `App ID` 和 `App Secret`
2. 添加「机器人」能力
3. 配置事件订阅：
   - 进入「事件与回调」→「订阅方式」
   - 选择「使用长连接接收事件」
4. 添加事件：`im.message.receive_v1`

## 启动 Bot

Bot 需要长期运行，用于接收飞书消息并回复：

```bash
# 方式1：使用启动脚本（推荐）
./start.sh

# 方式2：直接运行
npm start

# 方式3：后台运行
nohup ./start.sh > bot.log 2>&1 &
```

## 使用方式

### 1. 在飞书中与机器人对话

1. 打开飞书，找到您的自建应用机器人
2. 向机器人发送消息即可获得 AI 助手回复

**支持的命令：**
- `项目列表` - 查看所有项目
- `项目进度 [项目名]` - 查看具体项目进度
- 任何其他问题 - AI 助手会尽力回答

### 2. 在代码中调用 API

```javascript
import { sendTextMessage, getAccessToken } from 'feishu-tool/api';

// 发送消息（需要 chat_id）
await sendTextMessage('oc_xxxxx', '任务完成！');

// 获取访问令牌
const token = await getAccessToken();
```

## 项目结构

```
feishu-plugin/
├── api/                    # 插件 API（供 Claude Code 调用）
│   ├── index.js           # 导出入口
│   ├── feishu-api.js      # 飞书 API 封装
│   └── config-loader.js   # 配置加载器
├── bot/                    # Bot 服务（长期运行）
│   ├── index.js           # Bot 入口
│   ├── config.js          # Bot 配置
│   ├── feishu-api.js      # 飞书 API（Bot 用）
│   └── claude-api.js      # Claude API（Bot 用）
├── start.sh               # 启动脚本
├── config.json.example     # 配置示例
└── package.json
```

## 常见问题

### Bot 收不到消息

1. 确认飞书应用已添加「机器人」能力
2. 确认已配置「长连接模式」接收事件
3. 确认已添加 `im.message.receive_v1` 事件
4. 检查 Bot 是否正在运行：`ps aux | grep "node bot"`

### 消息发送失败

1. 确认 `config.json` 中的 `app_id` 和 `app_secret` 正确
2. 确认飞书应用的机器人能力已启用

## 部署到服务器

1. 上传整个项目到服务器
2. 运行 `npm install`
3. 配置 `config.json`
4. 使用 `pm2` 或类似工具保持 Bot 长期运行：

```bash
npm install -g pm2
pm2 start start.sh --name feishu-bot
pm2 save
pm2 startup
```
