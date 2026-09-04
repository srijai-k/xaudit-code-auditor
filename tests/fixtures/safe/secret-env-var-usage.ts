const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
client.models.list();
