const axios = require('axios');

class DeepseekAI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseURL = 'https://api.deepseek.com/v1';  // Replace with actual Deepseek API endpoint
  }

  async generateContent(prompt) {
    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: 'deepseek-chat',  // Replace with actual model name
          messages: [
            { role: 'system', content: prompt.split('User:')[0] },  // Extract system prompt
            ...this.formatMessages(prompt)
          ],
          temperature: 0.7,
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        response: {
          text: async () => response.data.choices[0].message.content
        }
      };
    } catch (error) {
      console.error('Deepseek AI Error:', error);
      throw error;
    }
  }

  formatMessages(prompt) {
    // Split the prompt into conversation parts
    const parts = prompt.split(/\n(User:|AI:)/g).filter(Boolean);
    const messages = [];
    
    for (let i = 0; i < parts.length; i += 2) {
      const role = parts[i].trim().toLowerCase() === 'user:' ? 'user' : 'assistant';
      const content = parts[i + 1]?.trim() || '';
      if (content) {
        messages.push({ role, content });
      }
    }

    return messages;
  }
}

module.exports = DeepseekAI;
