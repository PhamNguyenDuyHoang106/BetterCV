const fs = require('fs');
const path = require('path');

// Read the env file manually or check the env directly
const envPath = path.join(__dirname, '../apps/api/.env');
let apiKey = process.env.OPENAI_API_KEY;
let baseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
let model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*OPENAI_API_KEY\s*=\s*["']?([^"'\s]+)["']?/);
    if (match) apiKey = match[1];
    const baseMatch = line.match(/^\s*OPENAI_BASE_URL\s*=\s*["']?([^"'\s]+)["']?/);
    if (baseMatch) baseUrl = baseMatch[1];
    const modelMatch = line.match(/^\s*OPENAI_MODEL\s*=\s*["']?([^"'\s]+)["']?/);
    if (modelMatch) model = modelMatch[1];
  }
}

console.log('Testing OpenAI key...');
console.log('Base URL:', baseUrl);
console.log('Model:', model);
console.log('API Key:', apiKey ? (apiKey.substring(0, 15) + '...') : 'undefined');

if (!apiKey) {
  console.error('Error: OPENAI_API_KEY is not defined!');
  process.exit(1);
}

fetch(`${baseUrl}/chat/completions`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    model: model,
    messages: [
      { role: 'system', content: 'You are a test assistant.' },
      { role: 'user', content: 'Say hello!' }
    ]
  })
})
.then(res => {
  console.log('Response Status:', res.status, res.statusText);
  return res.json();
})
.then(json => {
  console.log('Response Body:', JSON.stringify(json, null, 2));
})
.catch(err => {
  console.error('Error occurred during fetch:', err);
});
