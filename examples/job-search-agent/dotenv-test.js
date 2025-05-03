require('dotenv').config();

console.log('SERPAPI_KEY:', process.env.SERPAPI_KEY ? 'Present (length: ' + process.env.SERPAPI_KEY.length + ')' : 'Missing');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Present (length: ' + process.env.OPENAI_API_KEY.length + ')' : 'Missing'); 