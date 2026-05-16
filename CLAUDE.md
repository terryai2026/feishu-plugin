# feishu-tool 插件

飞书工具集，让 Claude Code 可以发送飞书消息。

## 配置

创建 `config.json` 并配置您的飞书应用凭证：

```json
{
  "feishu": {
    "app_id": "cli_xxx",
    "app_secret": "xxx"
  }
}
```

## 使用示例

```javascript
import { sendTextMessage } from './api/index.js';

// 发送消息
await sendTextMessage('oc_xxx', '你好！这是一条测试消息', 'chat_id');
```

## 前提条件

1. 飞书应用已添加「机器人」能力
2. 已配置事件订阅（长连接模式）
3. 已添加权限：
   - 获取群组中所有消息
   - 读取用户发给机器人的单聊消息
