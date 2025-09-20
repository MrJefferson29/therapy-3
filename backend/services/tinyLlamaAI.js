const { pipeline } = require('@xenova/transformers');
const fs = require('fs');
const path = require('path');

class TinyLlamaAI {
    constructor(modelId = 'thejefferson29/therapy-ai-tinyllama') {
        // Use Hugging Face model ID, but fallback to local path
        this.modelId = modelId;
        this.localModelPath = path.resolve(__dirname, '..', 'therapy-ai-tinyllama-clean');
        this.workingModelPath = path.resolve(__dirname, '..', 'therapy-ai-working');
        this.model = null;
        this.tokenizer = null;
        this.isInitialized = false;
        this.initializationAttempted = false;
    }

    async initialize() {
        // Only attempt initialization once
        if (this.initializationAttempted) {
            return this.isInitialized;
        }
        
        this.initializationAttempted = true;
        
        try {
            console.log('🔄 Initializing TinyLlama model...');
            
            // Try multiple approaches for loading the model
            const approaches = [
                {
                    name: 'Working Model (Local)',
                    load: () => this.loadWorkingModel()
                },
                {
                    name: 'Hugging Face Direct',
                    load: () => this.loadFromHuggingFace()
                },
                {
                    name: 'Compatible Model (Fallback)',
                    load: () => this.loadCompatibleModel()
                }
            ];
            
            for (const approach of approaches) {
                try {
                    console.log(`🔄 Trying ${approach.name}...`);
                    this.model = await approach.load();
                    this.isInitialized = true;
                    console.log(`✅ TinyLlama model initialized successfully using ${approach.name}`);
                    return true;
                } catch (error) {
                    console.log(`⚠️ ${approach.name} failed: ${error.message}`);
                    continue;
                }
            }
            
            throw new Error('All loading approaches failed');
            
        } catch (error) {
            console.error('❌ Failed to initialize TinyLlama model:', error.message);
            console.log('💡 TinyLlama will be disabled - using fallback models (Gemini/DeepSeek)');
            console.log('💡 This is normal - the system will work with other AI models');
            this.isInitialized = false;
            return false;
        }
    }
    
    async loadWorkingModel() {
        console.log('📁 Loading working model from local files...');
        
        // Check if working model files exist
        const modelFiles = ['config.json', 'model.safetensors', 'tokenizer.json'];
        const missingFiles = modelFiles.filter(file => 
            !fs.existsSync(path.join(this.workingModelPath, file))
        );
        
        if (missingFiles.length > 0) {
            throw new Error(`Missing working model files: ${missingFiles.join(', ')}`);
        }
        
        return await pipeline(
            'text-generation',
            this.workingModelPath,
            {
                device: 'cpu',
                dtype: 'float32',
                use_onnx: false
            }
        );
    }
    
    async loadCompatibleModel() {
        console.log('🌐 Loading compatible model from Hugging Face...');
        const compatibleModelId = 'Xenova/distilgpt2';
        
        return await pipeline(
            'text-generation',
            compatibleModelId,
            {
                device: 'cpu',
                dtype: 'float32',
                use_onnx: false
            }
        );
    }
    
    async loadFromHuggingFace() {
        console.log('🌐 Loading model from Hugging Face:', this.modelId);
        console.log('⏳ First load may take a few minutes (downloading model)...');
        
        return await pipeline(
            'text-generation',
            this.modelId,
            {
                device: 'cpu',
                dtype: 'float32',
                use_onnx: false,
                cache_dir: path.join(__dirname, '..', '..', '.cache', 'transformers')
            }
        );
    }
    
    async loadFromLocal() {
        console.log('📁 Loading model from local files...');
        
        // Check if local files exist
        const modelFiles = ['config.json', 'model.safetensors', 'tokenizer.json'];
        const missingFiles = modelFiles.filter(file => 
            !fs.existsSync(path.join(this.localModelPath, file))
        );
        
        if (missingFiles.length > 0) {
            throw new Error(`Missing local files: ${missingFiles.join(', ')}`);
        }
        
        return await pipeline(
            'text-generation',
            this.localModelPath,
            {
                device: 'cpu',
                dtype: 'float32',
                use_onnx: false,
                cache_dir: path.join(__dirname, '..', '..', '.cache', 'transformers')
            }
        );
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
