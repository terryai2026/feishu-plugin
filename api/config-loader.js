/**
 * 配置加载器
 * 从 config.json 读取配置，支持插件和 Bot 共用
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 查找 config.json：优先当前目录，往上找最多3层
function findConfigFile(startDir) {
  let dir = startDir;
  for (let i = 0; i < 3; i++) {
    const configPath = path.join(dir, 'config.json');
    if (fs.existsSync(configPath)) {
      return configPath;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break; // 已经到根目录
    dir = parent;
  }
  return null;
}

function loadConfig() {
  const configPath = findConfigFile(__dirname);

  if (!configPath) {
    throw new Error('找不到 config.json，请先创建并配置');
  }

  const content = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(content);
}

const config = loadConfig();

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

export default config;
