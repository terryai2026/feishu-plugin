/**
 * 飞书工具 API 封装
 *
 * 使用方式:
 * import { sendTextMessage, getAccessToken } from 'feishu-tool/api';
 */

import { sendTextMessage, getAccessToken, sendPostMessage } from './feishu-api.js';

export {
  sendTextMessage,
  sendPostMessage,
  getAccessToken
};
