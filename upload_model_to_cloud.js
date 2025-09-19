#!/usr/bin/env node

/**
 * Script to upload TinyLlama model files to cloud storage
 * This allows the model files to be downloaded on the server
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const FormData = require('form-data');

// Configuration
const MODEL_DIR = './therapy-ai-tinyllama-clean';
const REQUIRED_FILES = [
    'config.json',
    'model.safetensors', 
    'tokenizer.json',
    'tokenizer_config.json',
    'generation_config.json'
];

console.log('🚀 TinyLlama Model Upload Script');
console.log('================================');

// Check if model files exist
function checkModelFiles() {
    console.log('📁 Checking model files...');
    
    const missingFiles = [];
    const existingFiles = [];
    
    REQUIRED_FILES.forEach(file => {
        const filePath = path.join(MODEL_DIR, file);
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            existingFiles.push({ name: file, size: stats.size });
            console.log(`✅ ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
        } else {
            missingFiles.push(file);
            console.log(`❌ ${file} - MISSING`);
        }
    });
    
    if (missingFiles.length > 0) {
        console.log('\n❌ Missing required files:', missingFiles.join(', '));
        console.log('Please ensure all model files are in the therapy-ai-tinyllama-clean directory');
        return false;
    }
    
    console.log(`\n✅ All ${existingFiles.length} model files found`);
    return true;
}

// Create a simple HTTP server to serve model files
function createModelServer() {
    console.log('\n🌐 Creating temporary model server...');
    console.log('This will allow you to download model files to your server');
    
    const express = require('express');
    const app = express();
    const port = 3001;
    
    // Serve model files
    app.use('/model', express.static(MODEL_DIR));
    
    // Health check endpoint
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', files: REQUIRED_FILES });
    });
    
    // List available files
    app.get('/files', (req, res) => {
        const files = REQUIRED_FILES.map(file => {
            const filePath = path.join(MODEL_DIR, file);
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                return {
                    name: file,
                    size: stats.size,
                    url: `http://localhost:${port}/model/${file}`
                };
            }
            return null;
        }).filter(Boolean);
        
        res.json({ files });
    });
    
    const server = app.listen(port, () => {
        console.log(`✅ Model server running on http://localhost:${port}`);
        console.log(`📁 Model files available at: http://localhost:${port}/model/`);
        console.log(`📋 File list: http://localhost:${port}/files`);
        console.log('\n🔧 To download files to your server:');
        console.log(`curl -o config.json http://localhost:${port}/model/config.json`);
        console.log(`curl -o model.safetensors http://localhost:${port}/model/model.safetensors`);
        console.log(`curl -o tokenizer.json http://localhost:${port}/model/tokenizer.json`);
        console.log(`curl -o tokenizer_config.json http://localhost:${port}/model/tokenizer_config.json`);
        console.log(`curl -o generation_config.json http://localhost:${port}/model/generation_config.json`);
        console.log('\n⏹️  Press Ctrl+C to stop the server');
    });
    
    return server;
}

// Main execution
function main() {
    if (!checkModelFiles()) {
        process.exit(1);
    }
    
    try {
        const server = createModelServer();
        
        // Graceful shutdown
        process.on('SIGINT', () => {
            console.log('\n🛑 Shutting down model server...');
            server.close(() => {
                console.log('✅ Server stopped');
                process.exit(0);
            });
        });
        
    } catch (error) {
        console.error('❌ Error starting model server:', error.message);
        console.log('\n💡 Alternative: Use a cloud storage service like:');
        console.log('- Google Drive (public link)');
        console.log('- Dropbox (public link)');
        console.log('- AWS S3 (public bucket)');
        console.log('- GitHub Releases (for smaller files)');
        process.exit(1);
    }
}

// Check if express is available
try {
    require('express');
    main();
} catch (error) {
    console.log('📦 Installing express for model server...');
    console.log('Run: npm install express');
    console.log('Then run this script again');
    process.exit(1);
}
