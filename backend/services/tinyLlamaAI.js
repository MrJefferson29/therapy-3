const { pipeline } = require('@xenova/transformers');
const fs = require('fs');
const path = require('path');

class TinyLlamaAI {
    constructor(modelPath = './therapy-ai-tinyllama-clean') {
        this.modelPath = modelPath;
        this.model = null;
        this.tokenizer = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            console.log('🔄 Initializing TinyLlama model...');
            
            // Check if model files exist
            const modelFiles = ['config.json', 'model.safetensors', 'tokenizer.json'];
            const missingFiles = modelFiles.filter(file => !fs.existsSync(path.join(this.modelPath, file)));
            
            if (missingFiles.length > 0) {
                throw new Error(`Missing model files: ${missingFiles.join(', ')}. Please ensure model files are in ${this.modelPath}`);
            }
            
            // Load the fine-tuned model and tokenizer
            this.model = await pipeline(
                'text-generation',
                this.modelPath,
                {
                    device: 'cpu', // Use CPU for now
                    dtype: 'float32'
                }
            );
            
            this.isInitialized = true;
            console.log('✅ TinyLlama model initialized successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize TinyLlama model:', error.message);
            this.isInitialized = false;
            return false;
        }
    }

    async generateContent(prompt, maxLength = 200) {
        if (!this.isInitialized) {
            throw new Error('TinyLlama model not initialized');
        }

        try {
            // Format prompt for TinyLlama
            const formattedPrompt = `<|user|>\n${prompt}\n<|assistant|>\n`;
            
            // Generate response
            const result = await this.model(formattedPrompt, {
                max_new_tokens: maxLength,
                temperature: 0.7,
                do_sample: true,
                pad_token_id: this.model.tokenizer.eos_token_id,
                eos_token_id: this.model.tokenizer.eos_token_id,
                repetition_penalty: 1.1
            });

            // Extract the assistant response
            let response = result[0].generated_text;
            const assistantIndex = response.indexOf('<|assistant|>');
            if (assistantIndex !== -1) {
                response = response.substring(assistantIndex + '<|assistant|>'.length).trim();
            }

            // Clean up the response
            response = this.cleanResponse(response);
            
            return {
                response: {
                    text: () => response
                }
            };
        } catch (error) {
            console.error('❌ Error generating content with TinyLlama:', error);
            throw error;
        }
    }

    cleanResponse(response) {
        // Remove any remaining special tokens
        response = response.replace(/<\|user\|>/g, '');
        response = response.replace(/<\|assistant\|>/g, '');
        response = response.replace(/<\|endoftext\|>/g, '');
        
        // Remove excessive whitespace
        response = response.replace(/\s+/g, ' ').trim();
        
        // Limit response length (prevent runaway generation)
        if (response.length > 500) {
            response = response.substring(0, 500) + '...';
        }
        
        return response;
    }

    isReady() {
        return this.isInitialized;
    }
}

module.exports = TinyLlamaAI;
