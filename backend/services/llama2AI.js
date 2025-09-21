const axios = require('axios');
const { spawn } = require('child_process');

class Llama2AI {
  constructor(apiKey, modelUrl) {
    this.apiKey = apiKey;
    this.modelUrl = modelUrl; // Hugging Face model URL
    this.baseURL = 'https://api-inference.huggingface.co/models';
    this.useLocalInference = false; // Flag to switch to local inference
  }

  async generateContent(prompt) {
    try {
      // First try Hugging Face Inference API
      const formattedPrompt = this.formatPromptForLlama2(prompt);

      const response = await axios.post(
        `${this.baseURL}/${this.modelUrl}`,
        {
          inputs: formattedPrompt,
          parameters: {
            max_new_tokens: 1000,
            temperature: 0.7,
            top_p: 0.9,
            do_sample: true,
            return_full_text: false
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      // Handle different response formats from Hugging Face
      let generatedText = '';
      if (Array.isArray(response.data) && response.data.length > 0) {
        generatedText = response.data[0].generated_text || '';
      } else if (response.data.generated_text) {
        generatedText = response.data.generated_text;
      }

      return {
        response: {
          text: async () => generatedText
        }
      };
    } catch (error) {
      console.error('Llama2 API Error:', error.response?.data || error.message);

      // Handle rate limiting
      if (error.response?.status === 429) {
        throw new Error('Llama2 API rate limit exceeded. Please try again later.');
      }

      // Handle model loading or 404 (LoRA model)
      if (error.response?.status === 404 ||
          error.response?.data?.error?.includes('loading') ||
          error.code === 'ETIMEDOUT') {
        console.log('🔄 Falling back to local inference for LoRA model...');
        return await this.generateContentLocal(prompt);
      }

      throw error;
    }
  }

  formatPromptForLlama2(prompt) {
    // Extract system prompt and user input from the combined prompt
    const systemMatch = prompt.match(/You are Zensui AI[\s\S]*?SAFETY PROTOCOLS:[\s\S]*?User: ([\s\S]*)/);
    let systemPrompt = '';
    let userInput = prompt;

    if (systemMatch) {
      // Extract system prompt (everything before "User:")
      const fullMatch = systemMatch[0];
      const userIndex = fullMatch.indexOf('User: ');
      systemPrompt = fullMatch.substring(0, userIndex).trim();
      userInput = systemMatch[1].trim();
    }

    // Format for Llama 2 chat template
    const formattedPrompt = `<s>[INST] ${systemPrompt}\n\n${userInput} [/INST]`;

    return formattedPrompt;
  }

  // Local inference for LoRA models using Python script
  async generateContentLocal(prompt) {
    return new Promise((resolve, reject) => {
      const scriptPath = require('path').join(__dirname, 'llama2_local_inference.py');
      const pythonProcess = spawn('python3', [scriptPath, this.modelUrl, this.apiKey, prompt]);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout.trim());
            if (result.success) {
              resolve({
                response: {
                  text: async () => result.response
                }
              });
            } else {
              reject(new Error(result.error || 'Local inference failed'));
            }
          } catch (parseError) {
            reject(new Error(`Failed to parse Python output: ${parseError.message}`));
          }
        } else {
          reject(new Error(`Python script failed with code ${code}: ${stderr}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });

      // Timeout after 5 minutes
      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('Local inference timeout after 5 minutes'));
      }, 300000);
    });
  }
}

module.exports = Llama2AI;