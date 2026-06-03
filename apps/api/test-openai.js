const { OpenAI } = require('openai');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function main() {
  console.log('Testing OpenAI key: ', process.env.OPENAI_API_KEY ? 'Present' : 'Missing');
  console.log('Model: ', process.env.OPENAI_MODEL || 'default');

  if (!process.env.OPENAI_API_KEY) {
    console.error('Error: OPENAI_API_KEY is not defined in .env');
    return;
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  });

  try {
    console.log('Sending request to OpenAI...');
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: 'Say hello in 1 word' }],
      max_tokens: 5,
    });
    console.log('Success! OpenAI responded:', completion.choices[0].message.content);
  } catch (err) {
    console.error('OpenAI Connection Failed! Details:');
    console.error(err);
  }
}

main().catch(console.error);
