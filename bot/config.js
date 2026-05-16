/**
 * Bot 配置加载器
 * 从 ../config.json 读取配置
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 读取项目根目录的 config.json
const configPath = path.join(__dirname, '..', 'config.json');

let config;

try {
  const content = fs.readFileSync(configPath, 'utf-8');
  config = JSON.parse(content);
} catch (error) {
  console.error('❌ 找不到配置文件 config.json');
  console.error('   请在项目根目录创建 config.json，参考 config.json.example');
  process.exit(1);
}

// 飞书配置
export const FEISHU = {
  APP_ID: config.feishu?.app_id,
  APP_SECRET: config.feishu?.app_secret,
  API_BASE: config.feishu?.api_base || 'https://open.feishu.cn/open-apis'
};

// Claude API 配置
export const CLAUDE = {
  API_KEY: config.claude?.api_key,
  BASE_URL: config.claude?.base_url || 'https://api.anthropic.com',
  MODEL: config.claude?.model || 'claude-3-5-sonnet-20241022'
};

// 项目根目录
export const PROJECTS_ROOT = config.projects_root || '/Users/terry/.claude/projects';

// Bot 配置
export const BOT = {
  MAX_MESSAGE_LENGTH: 2048,  // 消息分段长度
  TIMEOUT_MS: 30000           // Claude API 超时
};
