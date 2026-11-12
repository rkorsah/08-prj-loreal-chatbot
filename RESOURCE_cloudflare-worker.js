export default {
  async fetch(request, env) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Use POST for chat requests.' }), {
        status: 405,
        headers: corsHeaders
      });
    }

    if (!env.OPENAI_API_KEY) {
      return new Response(JSON.stringify({ error: 'The Worker API key is not configured.' }), {
        status: 500,
        headers: corsHeaders
      });
    }

    let userInput;
    try {
      userInput = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Request body must be valid JSON.' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    if (!Array.isArray(userInput.messages) || userInput.messages.length === 0) {
      return new Response(JSON.stringify({ error: 'A non-empty messages array is required.' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const requestBody = {
      model: 'gpt-4.1',
      messages: userInput.messages,
      max_completion_tokens: 300,
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    return new Response(await response.text(), {
      status: response.status,
      headers: corsHeaders
    });
  }
};
