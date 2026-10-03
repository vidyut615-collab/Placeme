const https = require('https');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GROQ_API_KEY;

const data = JSON.stringify({
    model: "openai/gpt-oss-20b",
    messages: [{ role: "user", content: "Hello" }],
    max_tokens: 10
});

const options = {
    hostname: 'api.groq.com',
    path: '/openai/v1/chat/completions',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
    }
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        console.log(`STATUS: ${res.statusCode}`);
        for (const [key, value] of Object.entries(res.headers)) {
            if (key.toLowerCase().includes('ratelimit')) {
                console.log(`${key}: ${value}`);
            }
        }
    });
});
req.write(data);
req.end();
