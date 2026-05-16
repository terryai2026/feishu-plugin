/**
 * 飞书机器人 - WebSocket 长连接版
 *
 * 使用 @larksuiteoapi/node-sdk 实现长连接
 * 启动方式: node bot/index.js 或 ./start.sh
 */

import * as Lark from '@larksuiteoapi/node-sdk';
import { FEISHU } from './config.js';
import { sendTextMessage, getAccessToken } from './feishu-api.js';
import { chatWithClaude } from './claude-api.js';

// 验证配置
if (!FEISHU.APP_ID || !FEISHU.APP_SECRET) {
  console.error('❌ 配置错误：缺少 feishu.app_id 或 feishu.app_secret');
  console.error('   请在 config.json 中配置飞书应用凭证');
  process.exit(1);
}

// 创建客户端
const wsClient = new Lark.WSClient({
  appId: FEISHU.APP_ID,
  appSecret: FEISHU.APP_SECRET,
  loggerLevel: Lark.LoggerLevel.info
});

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
    if (content.text) {
      return content.text.trim();
    }
    return JSON.stringify(content);
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
  const message = data.message;
  if (!message) return;

  const messageId = message.message_id;
  const chatType = message.chat_type;
  const chatId = message.chat_id;
  const content = parseMessageContent(message.content);
  const messageTime = parseInt(message.create_time) || 0;

  console.log('\n========== 收到事件 ==========');
  console.log(`message_id: ${messageId}`);
  console.log(`chat_type: ${chatType}`);
  console.log(`content: ${content}`);
  console.log(`消息时间: ${new Date(messageTime).toLocaleString()}`);

  // 检查消息是否太旧（机器人启动前的消息跳过）
  if (messageTime > 0 && messageTime < BOT_START_TIME) {
    console.log(`⚠️ 消息早于机器人启动时间，跳过`);
    console.log('========== 跳过 ==========\n');
    return;
  }

  // 去重检查
  if (isDuplicate(messageId, content, messageTime)) {
    console.log('========== 跳过 ==========\n');
    return;
  }

  // 只处理 P2P 私聊
  if (chatType === 'p2p' && content) {
    console.log(`✅ 收到私聊消息: "${content}"`);
    handleMessageAsync(chatId, content, messageId).then(() => {
      console.log('========== 处理结束 ==========\n');
    }).catch(err => {
      console.log('========== 处理异常结束 ==========\n');
    });
  }
}

/**
 * 异步处理消息（不阻塞，快速返回）
 */
async function handleMessageAsync(receiveId, userMessage, messageId) {
  try {
    console.log(`🤖 正在调用 Claude...`);
    const response = await chatWithClaude(userMessage, receiveId);
    console.log(`📤 Claude 回复 (${response.length} 字符)，准备发送...`);
    await sendLongMessage(receiveId, response);
    console.log(`✅ 处理完成`);
  } catch (error) {
    console.error(`❌ 处理错误: ${error.message}`);
    try {
      await sendTextMessage(receiveId, `处理消息时出错: ${error.message}完毕`);
    } catch (e) {
      console.error(`❌ 发送失败: ${e.message}`);
    }
  }
}

/**
 * 发送长消息，自动分多条发送
 */
async function sendLongMessage(receiveId, message) {
  const MAX_LENGTH = 500;

  // 消息已经自带「完毕」，不需要再添加
  if (message.length <= MAX_LENGTH) {
    await sendTextMessage(receiveId, message);
    return;
  }

  const paragraphs = message.split('\n\n');
  let currentChunk = '';
  const chunks = [];

  for (const para of paragraphs) {
    if ((currentChunk + '\n\n' + para).length > MAX_LENGTH && currentChunk) {
      chunks.push(currentChunk);
      currentChunk = para;
    } else if (currentChunk) {
      currentChunk += '\n\n' + para;
    } else {
      currentChunk = para;
    }
  }
  if (currentChunk) chunks.push(currentChunk);

  console.log(`📤 分 ${chunks.length} 条发送`);

  for (let i = 0; i < chunks.length; i++) {
    const isLast = (i === chunks.length - 1);
    const messageToSend = isLast ? chunks[i] : chunks[i];
    console.log(`   第 ${i + 1}/${chunks.length} 条 (${messageToSend.length} 字符)${isLast ? ' [完毕]' : ''}`);
    await sendTextMessage(receiveId, messageToSend);
    if (!isLast) await sleep(500);
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

    // 注册事件处理并启动
    wsClient.start({
      eventDispatcher: new Lark.EventDispatcher({}).register({
        'im.message.receive_v1': handleMessage
      })
    });

    console.log('[✓] 机器人已启动，等待消息...');

  } catch (error) {
    console.error('❌ 启动失败:', error.message);
    process.exit(1);
  }
}

// 启动
main();
