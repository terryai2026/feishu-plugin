# feishu-tool 飞书工具插件

让 Claude Code 可以发送飞书消息和查询项目状态。

## 功能

- 📤 发送飞书消息
- 📊 查询项目进度状态
- 🔔 任务完成通知

## 安装

```bash
# 克隆或下载此项目到插件目录
cp -r feishu-plugin ~/.claude/plugins/

# 或通过 Claude Code 命令安装
# (未来支持 marketplace 安装)
```

## 配置

创建 `~/.claude/plugins/feishu-plugin/config.json`:

```json
{
  "feishu": {
    "app_id": "your_app_id",
    "app_secret": "your_app_secret"
  },
  "projects_root": "/path/to/projects"
}
```

## 使用方式

### 1. 发送飞书消息

在 Claude Code 对话中：

```
/feishu-send oc_xxxxx 你好，这是测试消息
```

### 2. 查询项目状态

```
/feishu-status AI-CRM
```

### 3. 在代码中调用

```javascript
import { sendTextMessage, getProjectStatus } from 'feishu-tool/api';

// 发送消息
await sendTextMessage('oc_xxxxx', '任务完成！');

// 查询项目
const status = await getProjectStatus('drift-bottle');
```

## 项目结构

```
feishu-plugin/
├── .claude-plugin/
│   ├── plugin.json          # 插件元数据
│   └── marketplace.json      # Marketplace 配置
├── api/
│   ├── feishu-api.js        # 飞书 API 封装
│   ├── claude-api.js        # Claude API 调用
│   └── index.js             # 导出
├── commands/
│   └── feishu-commands.md   # 命令说明
├── skills/
│   └── feishu-skill.md      # 技能说明
├── config.json.example       # 配置示例
└── README.md
```

## 飞书应用配置

1. 在 [飞书开放平台](https://open.feishu.cn/) 创建应用
2. 获取 `App ID` 和 `App Secret`
3. 添加「机器人」能力
4. 配置事件订阅（长连接模式）
5. 添加事件：`im.message.receive_v1`

## 部署自己的飞书机器人

参考 `../feishu-bot/` 完整项目：

```bash
cd ../feishu-bot
npm install
./start.sh
```
