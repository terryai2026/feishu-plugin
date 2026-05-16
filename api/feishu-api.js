import { FEISHU } from './config.js';

let accessToken = null;
let tokenExpireTime = 0;

/**
 * 获取飞书 Access Token
 */
export async function getAccessToken() {
  const now = Date.now();

  if (accessToken && now < tokenExpireTime - 60000) {
    return accessToken;
  }

  const response = await fetch(`${FEISHU.API_BASE}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: FEISHU.APP_ID,
      app_secret: FEISHU.APP_SECRET
    })
  });

  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(`获取飞书Token失败: ${data.msg}`);
  }

  accessToken = data.tenant_access_token;
  tokenExpireTime = now + (data.expire || 7200) * 1000;

  console.log('✓ 飞书 Access Token 获取成功');
  return accessToken;
}

/**
 * 发送消息
 */
export async function sendMessage(receiveId, msgType, content, receiveIdType = 'open_id') {
  const token = await getAccessToken();

  console.log(`📡 发送消息 API 调用:`);
  console.log(`   URL: ${FEISHU.API_BASE}/im/v1/messages?receive_id_type=${receiveIdType}`);
  console.log(`   receive_id: ${receiveId}`);
  console.log(`   msg_type: ${msgType}`);

  const response = await fetch(`${FEISHU.API_BASE}/im/v1/messages?receive_id_type=${receiveIdType}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      receive_id: receiveId,
      msg_type: msgType,
      content: JSON.stringify(content)
    })
  });

  const data = await response.json();
  console.log(`   响应: ${JSON.stringify(data)}`);

  if (data.code !== 0) {
    throw new Error(`发送消息失败: ${data.msg}`);
  }

  return data;
}

/**
 * 发送文本消息
 */
export async function sendTextMessage(receiveId, text, receiveIdType = 'open_id') {
  return sendMessage(receiveId, 'text', { text }, receiveIdType);
}

/**
 * 发送富文本消息（post）
 */
export async function sendPostMessage(receiveId, title, paragraphs, receiveIdType = 'open_id') {
  const content = {
    post: {
      zh_cn: {
        title: title,
        content: paragraphs.map(p => [
          {
            tag: 'text',
            text: p
          }
        ])
      }
    }
  };

  return sendMessage(receiveId, 'post', content, receiveIdType);
}

/**
 * 获取群成员列表
 */
export async function getChatMembers(chatId) {
  const token = await getAccessToken();

  const response = await fetch(`${FEISHU.API_BASE}/im/v1/chats/${chatId}/members?member_id_type=open_id`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await response.json();

  if (data.code !== 0) {
    throw new Error(`获取群成员失败: ${data.msg}`);
  }

  return data.data.items;
}

/**
 * 获取应用信息
 */
export async function getAppInfo() {
  const token = await getAccessToken();

  const response = await fetch(`${FEISHU.API_BASE}/bot/v3/info`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await response.json();
  return data;
}
