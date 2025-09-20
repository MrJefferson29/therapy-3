#!/usr/bin/env node

/**
 * Template for TinyLlama Model Download Script
 * Replace the URLs below with your actual Google Drive URLs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const MODEL_DIR = path.join(__dirname, '..', 'therapy-ai-tinyllama-clean');
const MODEL_URLS = {
    // 🔧 REPLACE THESE URLs WITH YOUR ACTUAL GOOGLE DRIVE URLs
    'config.json': 'https://drive.google.com/uc?export=download&id=1SaJH22x6nD7pGdVrXBuxE6CvuOvBCjSE',
    'model.safetensors': 'https://drive.google.com/uc?export=download&id=1AxvfCWviOPWBkgrIz08kf0x2bnHqXyT8',
    'tokenizer.json': 'https://drive.google.com/uc?export=download&id=1B953zrEP4cjCBysbwbWb8Mafpm2_lDGF',
    'tokenizer_config.json': 'https://drive.google.com/uc?export=download&id=141Amks8-qu_UjAZS0g6w4yhe9RBOi-a3',
    'generation_config.json': 'https://drive.google.com/uc?export=download&id=1JDXlv73VxUudYkeG-vqBh1yB9Zqecj3d'
};

console.log('🚀 TinyLlama Model Download Script');
console.log('==================================');

// Create model directory
function createModelDirectory() {
    if (!fs.existsSync(MODEL_DIR)) {
        fs.mkdirSync(MODEL_DIR, { recursive: true });
        console.log(`✅ Created model directory: ${MODEL_DIR}`);
    } else {
        console.log(`📁 Model directory exists: ${MODEL_DIR}`);
    }
}

// Download a single file
function downloadFile(url, filename) {
    return new Promise((resolve, reject) => {
        const filePath = path.join(MODEL_DIR, filename);
        const file = fs.createWriteStream(filePath);
        
        console.log(`📥 Downloading ${filename}...`);
        
        const protocol = url.startsWith('https:') ? https : http;
        
        protocol.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download ${filename}: ${response.statusCode}`));
                return;
            }
            
            response.pipe(file);
            
            file.on('finish', () => {
                file.close();
                const stats = fs.statSync(filePath);
                console.log(`✅ Downloaded ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
                resolve();
            });
            
            file.on('error', (err) => {
                fs.unlink(filePath, () => {}); // Delete partial file
                reject(err);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

// Download all model files
async function downloadAllFiles() {
    console.log('📥 Starting model file downloads...');
    
    const downloadPromises = Object.entries(MODEL_URLS).map(([filename, url]) => {
        return downloadFile(url, filename).catch(error => {
            console.error(`❌ Failed to download ${filename}:`, error.message);
            return { filename, error: error.message };
        });
    });
    
    const results = await Promise.all(downloadPromises);
    const failures = results.filter(result => result && result.error);
    
    if (failures.length > 0) {
        console.log('\n❌ Some files failed to download:');
        failures.forEach(failure => {
            console.log(`   - ${failure.filename}: ${failure.error}`);
        });
        return false;
    }
    
    console.log('\n✅ All model files downloaded successfully!');
    return true;
}

// Verify downloaded files
function verifyFiles() {
    console.log('\n🔍 Verifying downloaded files...');
    
    const requiredFiles = Object.keys(MODEL_URLS);
    const missingFiles = [];
    
    requiredFiles.forEach(filename => {
        const filePath = path.join(MODEL_DIR, filename);
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            console.log(`✅ ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
        } else {
            missingFiles.push(filename);
            console.log(`❌ ${filename} - MISSING`);
        }
    });
    
    if (missingFiles.length > 0) {
        console.log(`\n❌ Missing files: ${missingFiles.join(', ')}`);
        return false;
    }
    
    console.log('\n✅ All model files verified!');
    return true;
}

// Main execution
async function main() {
    try {
        createModelDirectory();
        
        // Check if files already exist
        const existingFiles = Object.keys(MODEL_URLS).filter(filename => {
            return fs.existsSync(path.join(MODEL_DIR, filename));
        });
        
        if (existingFiles.length === Object.keys(MODEL_URLS).length) {
            console.log('✅ All model files already exist, skipping download');
            if (verifyFiles()) {
                console.log('🎉 TinyLlama model is ready!');
                return;
            }
        }
        
        const success = await downloadAllFiles();
        if (success && verifyFiles()) {
            console.log('🎉 TinyLlama model setup complete!');
        } else {
            console.log('❌ Model setup failed');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { downloadAllFiles, verifyFiles, createModelDirectory };
