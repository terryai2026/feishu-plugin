/**
 * 飞书机器人 - WebSocket 长连接版
 *
 * 使用 @larksuiteoapi/node-sdk 实现长连接
 * 启动方式: node bot/index.js 或 ./start.sh
 */

import { FEISHU } from './config.js';
import { sendTextMessage, getAccessToken } from './feishu-api.js';
import { chatWithClaude } from './claude-api.js';

const { SDK } = await import('@larksuiteoapi/node-sdk');

// 验证配置
if (!FEISHU.APP_ID || !FEISHU.APP_SECRET) {
  console.error('❌ 配置错误：缺少 feishu.app_id 或 feishu.app_secret');
  console.error('   请在 config.json 中配置飞书应用凭证');
  process.exit(1);
}

// 创建 SDK 实例
const sdk = new SDK({
  appId: FEISHU.APP_ID,
  appSecret: FEISHU.APP_SECRET,
  loggerLevel: 1
});

// 长连接客户端
const client = sdk.ws;

// 启动时间（用于过滤旧消息）
const BOT_START_TIME = Date.now();

// 消息去重
const recentMessages = new Map();

/**
 * 解析消息内容
 */
function parseMessageContent(contentStr) {
  try {
    const content = JSON.parse(contentStr);
    if (content.msg_type === 'text') {
      return content.text?.content?.trim();
    }
    return null;
  } catch {
    return contentStr;
  }
}

/**
 * 检查消息是否重复（3秒窗口）
 */
function isDuplicate(messageId, content, timestamp) {
  const key = `${messageId}:${content}`;
  const now = Date.now();

  // 清理过期消息
  for (const [k, v] of recentMessages) {
    if (now - v > 3000) {
      recentMessages.delete(k);
    }
  }

  if (recentMessages.has(key)) {
    return true;
  }

  recentMessages.set(key, timestamp);
  return false;
}

/**
 * 处理消息事件
 */
async function handleMessage(data) {
  const { message } = data;

  // 只处理私聊消息，且来自用户（非机器人）
  if (message?.chat_type !== 'p2p' || message?.sender?.sender_type !== 'user') {
    return;
  }

  const messageId = message.message_id;
  const userId = message.sender.open_id;
  const content = parseMessageContent(message.content);
  const timestamp = message.create_time;

  if (!content) return;

  // 过滤启动前的消息
  if (timestamp && timestamp < BOT_START_TIME) {
    console.log(`⏭️ 跳过旧消息: ${content.substring(0, 30)}...`);
    return;
  }

  // 去重
  if (isDuplicate(messageId, content, timestamp)) {
    console.log(`⏭️ 跳过重复消息: ${content.substring(0, 30)}...`);
    return;
  }

  console.log(`\n📩 收到用户 ${userId}: ${content}`);

  await processUserMessage(userId, content);
}

/**
 * 处理用户消息
 */
async function processUserMessage(userId, userMessage) {
  try {
    console.log(`[Claude] 正在处理...`);

    const response = await chatWithClaude(userMessage, userId);

    // 长消息分段发送
    await sendLongMessage(userId, response);

    console.log(`[Claude] 回复已发送`);

  } catch (error) {
    console.error('[错误]', error.message);

    try {
      await sendTextMessage(userId, `处理消息时出错: ${error.message}`);
    } catch (e) {
      console.error('[发送失败]', e.message);
    }
  }
}

/**
 * 发送长消息（自动分段）
 */
async function sendLongMessage(receiveId, text, maxLength = 2048) {
  if (text.length <= maxLength) {
    await sendTextMessage(receiveId, text);
    return;
  }

  // 按段落分割
  const paragraphs = text.split('\n\n');
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if ((currentChunk + '\n\n' + paragraph).length <= maxLength) {
      currentChunk = currentChunk ? currentChunk + '\n\n' + paragraph : paragraph;
    } else {
      if (currentChunk) {
        await sendTextMessage(receiveId, currentChunk);
        await sleep(500);
      }
      currentChunk = paragraph;
    }
  }

  if (currentChunk) {
    await sendTextMessage(receiveId, currentChunk);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 主函数
 */
async function main() {
  console.log('='.repeat(50));
  console.log('🤖 飞书机器人启动中...');
  console.log('='.repeat(50));

  try {
    // 验证连接
    console.log('\n📡 验证飞书连接...');
    await getAccessToken();
    console.log('✓ 飞书连接成功');

    console.log('\n🔄 启动长连接监听...');
    console.log('📝 使用说明:');
    console.log('   - 向机器人发送消息即可获得 AI 助手回复');
    console.log('   - 发送"项目列表"查看所有项目');
    console.log('   - 发送"项目进度 [项目名]"查看具体进度');
    console.log('\n' + '='.repeat(50) + '\n');

    // 注册事件处理
    client.createEventHandler({
      'im.message.receive_v1': handleMessage
    }).register().start();

    console.log('[✓] 机器人已启动，等待消息...');

  } catch (error) {
    console.error('❌ 启动失败:', error.message);
    process.exit(1);
  }
}

// 启动
main();
