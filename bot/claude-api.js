import { CLAUDE, PROJECTS_ROOT } from './config.js';
import fs from 'fs';
import path from 'path';

/**
 * 调用 Claude API 处理消息
 */
export async function chatWithClaude(userMessage, userId = 'unknown', chatHistory = '', retryCount = 0) {
  const systemPrompt = buildSystemPrompt();
  const userContent = buildUserMessage(userMessage, userId, chatHistory);

  const requestBody = {
    model: CLAUDE.MODEL,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userContent
      }
    ]
  };

  // 设置超时
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  let response;
  try {
    response = await fetch(`${CLAUDE.BASE_URL}/v1/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CLAUDE.API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal
    });
  } catch (error) {
    clearTimeout(timeoutId);
    if (retryCount < 1 && (error.name === 'AbortError' || error.message.includes('timeout'))) {
      console.log(`⏳ 超时，${retryCount + 1}次重试...`);
      return chatWithClaude(userMessage, userId, chatHistory, retryCount + 1);
    }
    throw new Error(`请求失败: ${error.message}`);
  }

  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorText = await response.text();
    let errorMsg = `Claude API 错误: ${response.status}`;

    if ((response.status === 524 || response.status === 504) && retryCount < 1) {
      console.log(`⏳ API超时，${retryCount + 1}次重试...`);
      return chatWithClaude(userMessage, userId, chatHistory, retryCount + 1);
    }

    if (response.status === 524 || response.status === 504) {
      errorMsg = '请求超时，请稍后重试';
    } else if (errorText) {
      errorMsg += ` - ${errorText}`;
    }
    throw new Error(errorMsg);
  }

  const data = await response.json();

  let reply = null;

  if (data.content && Array.isArray(data.content)) {
    const textBlock = data.content.find(block => block.type === 'text');
    if (textBlock) {
      reply = textBlock.text;
    }
  }

  if (!reply && data.choices && data.choices[0]) {
    reply = data.choices[0].message?.content || data.choices[0].text;
  }

  if (!reply) {
    reply = data.text || data.result || data.output || data.response;
  }

  if (!reply) {
    throw new Error(`Claude 返回格式错误`);
  }

  // 移除 Claude 回复中可能自带的"完毕"，避免重复
  reply = reply.replace(/\n\n完毕$/, '').replace(/\n完毕$/, '').replace(/完毕$/, '');

  // 添加"完毕"标记
  return reply + '\n\n完毕';
}

/**
 * 构建系统提示词
 */
function buildSystemPrompt() {
  const projectList = listProjects();

  return `你是 Terry 的 AI 助手，通过飞书与用户交流。

你的职责：
1. 帮助用户了解各项目进度情况
2. 根据用户需求开启新项目或创建新工作
3. 回答问题、协助决策

项目目录位置：${PROJECTS_ROOT}

${projectList.length > 0 ? '实际项目列表（当用户问有哪些项目时，请直接列出这些）：' : ''}
${projectList.map(p => `- ${p.name}${p.description ? `（${p.description}）` : ''}`).join('\n')}

重要：
- 用户问"有哪些项目"时，直接列出上述列表
- 用户问某个项目的进度时，根据项目名判断
- 项目目录名较长（包含路径编码），但项目名是简短的英文名

请用简洁、专业的中文回复。只在回复最后加"完毕"，不要在回复内容中自行添加"完毕"。`;
}

/**
 * 列出项目目录
 */
function listProjects() {
  try {
    if (!fs.existsSync(PROJECTS_ROOT)) {
      return [];
    }

    return fs.readdirSync(PROJECTS_ROOT)
      .filter(name => {
        const fullPath = path.join(PROJECTS_ROOT, name);
        return fs.statSync(fullPath).isDirectory();
      })
      .filter(name => !name.startsWith('.') && name !== 'feishu-bot')
      .map(name => {
        const claudeMdPath = path.join(PROJECTS_ROOT, name, 'CLAUDE.md');
        let description = '';

        if (fs.existsSync(claudeMdPath)) {
          try {
            const content = fs.readFileSync(claudeMdPath, 'utf-8');
            const match = content.match(/^#\s+(.+)/m);
            if (match) {
              description = match[1];
            }
          } catch (e) {}
        }

        return { name, description };
      });
  } catch (error) {
    return [];
  }
}

/**
 * 构建用户消息
 */
function buildUserMessage(userMessage, userId, chatHistory) {
  let context = '';

  if (chatHistory) {
    context = `\n\n=== 最近对话历史 ===\n${chatHistory}\n=== 历史结束 ===\n\n`;
  }

  return `${context}用户 (${userId}) 说：${userMessage}`;
}
