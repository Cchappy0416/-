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

    // 正确的 Dify Workflow API 地址
    // POST /v1/workflows/run (不需要 workflow_id)
    // 注意：使用 HTTP 而不是 HTTPS（ZeroNews 配置问题）
    const DIFY_BASE_URL = process.env.DIFY_API_URL || 'http://difyapp.fn.takin.cc/v1';
    const APP_KEY = process.env.DIFY_APP_KEY || 'app-lB0tgVA1ioxIKcvzPVT6jKDF';

    const response = await fetch(`${DIFY_BASE_URL}/workflows/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${APP_KEY}`
      },
      body: JSON.stringify({
        inputs: {
          question: question
        },
        response_mode: 'blocking',
        user: 'web-user'
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Dify API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};
