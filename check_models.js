const https = require('https');
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.GROQ_API_KEY;

const options = {
    hostname: 'api.groq.com',
    path: '/openai/v1/models',
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${apiKey}`
    }
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => {
        const models = JSON.parse(body).data;
        console.log("AVAILABLE MODELS:");
        models.forEach(m => console.log(m.id));
    });
});
req.end();
