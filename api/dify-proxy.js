module.exports = async (req, res) => {
  // 允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // 从环境变量获取配置（安全！）
    const DIFY_API_URL = process.env.DIFY_API_URL || 'https://difyapi.fn.takin.cc/v1/workflows';
    const WORKFLOW_ID = process.env.DIFY_WORKFLOW_ID || 'Rl4c4ZHbs5kaIduG';
    const APP_KEY = process.env.DIFY_APP_KEY || 'app-lB0tgVA1ioxIKcvzPVT6jKDF';

    const response = await fetch(`${DIFY_API_URL}/${WORKFLOW_ID}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APP_KEY}`
      },
      body: JSON.stringify({
        inputs: {
          question: question
        },
        response_mode: 'streaming',
        user: 'web-user'
      })
    });

    if (!response.ok) {
      throw new Error(`Dify API error: ${response.status}`);
    }

    // 转发流式响应
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value, { stream: true });
      res.write(chunk);
    }

    res.end();

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};
