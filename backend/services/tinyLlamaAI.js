const { pipeline } = require('@xenova/transformers');
const fs = require('fs');
const path = require('path');

class TinyLlamaAI {
    constructor(modelPath = '../therapy-ai-tinyllama-clean') {
        this.modelPath = path.resolve(__dirname, '..', 'therapy-ai-tinyllama-clean');
        this.model = null;
        this.tokenizer = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            console.log('🔄 Initializing TinyLlama model...');
            console.log('📁 Model path:', this.modelPath);
            
            // Check if model files exist
            const modelFiles = ['config.json', 'model.safetensors', 'tokenizer.json'];
            const missingFiles = modelFiles.filter(file => !fs.existsSync(path.join(this.modelPath, file)));
            
            if (missingFiles.length > 0) {
                console.log('❌ Missing files:', missingFiles);
                console.log('📁 Looking in:', this.modelPath);
                console.log('💡 Model files not found on server. TinyLlama will be disabled.');
                console.log('💡 To enable TinyLlama:');
                console.log('   1. Upload model files to cloud storage');
                console.log('   2. Update MODEL_URLS in backend/scripts/download_model.js');
                console.log('   3. Run the download script during deployment');
                throw new Error(`Missing model files: ${missingFiles.join(', ')}. TinyLlama disabled - using fallback models.`);
            }
            
            console.log('✅ All required model files found');
            
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
