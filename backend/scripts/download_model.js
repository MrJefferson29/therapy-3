#!/usr/bin/env node

/**
 * TinyLlama Model Download Script
 * Handles both local development and deployment scenarios
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Configuration
const MODEL_DIR = path.join(__dirname, '..', 'therapy-ai-tinyllama-clean');
const MODEL_FILES = {
    'config.json': '1SaJH22x6nD7pGdVrXBuxE6CvuOvBCjSE',
    'model.safetensors': '1AxvfCWviOPWBkgrIz08kf0x2bnHqXyT8',
    'tokenizer.json': '1B953zrEP4cjCBysbwbWb8Mafpm2_lDGF',
    'tokenizer_config.json': '141Amks8-qu_UjAZS0g6w4yhe9RBOi-a3',
    'generation_config.json': '1JDXlv73VxUudYkeG-vqBh1yB9Zqecj3d'
};

console.log('🚀 TinyLlama Model Setup Script');
console.log('================================');

// Create model directory
function createModelDirectory() {
    if (!fs.existsSync(MODEL_DIR)) {
        fs.mkdirSync(MODEL_DIR, { recursive: true });
        console.log(`✅ Created model directory: ${MODEL_DIR}`);
    } else {
        console.log(`📁 Model directory exists: ${MODEL_DIR}`);
    }
}

// Check if all required files exist and are valid
function checkExistingFiles() {
    console.log('🔍 Checking for existing model files...');
    
    const requiredFiles = Object.keys(MODEL_FILES);
    const existingFiles = [];
    const missingFiles = [];
    
    requiredFiles.forEach(filename => {
        const filePath = path.join(MODEL_DIR, filename);
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            if (stats.size > 0) {
                console.log(`✅ ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
                existingFiles.push(filename);
            } else {
                console.log(`❌ ${filename} - EMPTY FILE`);
                missingFiles.push(filename);
            }
        } else {
            missingFiles.push(filename);
            console.log(`❌ ${filename} - MISSING`);
        }
    });
    
    return { existingFiles, missingFiles };
}

// Download a single file using gdown with retry logic
async function downloadFile(fileId, filename, retries = 3) {
    const filePath = path.join(MODEL_DIR, filename);
    const pythonPath = filePath.replace(/\\/g, '/');
    
    console.log(`📥 Downloading ${filename}...`);
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`   Attempt ${attempt}/${retries}`);
            
            const command = `python -c "import gdown; gdown.download('https://drive.google.com/uc?id=${fileId}', '${pythonPath}', quiet=False)"`;
            await execAsync(command, { timeout: 300000 }); // 5 minute timeout
            
            // Check if file was downloaded
            if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
                const stats = fs.statSync(filePath);
                console.log(`✅ Downloaded ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
                return true;
            } else {
                console.log(`❌ Downloaded ${filename} is empty or missing`);
                if (attempt < retries) {
                    console.log(`   Retrying in 5 seconds...`);
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
        } catch (error) {
            console.log(`❌ Attempt ${attempt} failed: ${error.message}`);
            if (attempt < retries) {
                console.log(`   Retrying in 10 seconds...`);
                await new Promise(resolve => setTimeout(resolve, 10000));
            }
        }
    }
    
    console.error(`❌ Failed to download ${filename} after ${retries} attempts`);
    return false;
}

// Download missing files
async function downloadMissingFiles(missingFiles) {
    if (missingFiles.length === 0) {
        console.log('✅ All files already exist, no download needed');
        return true;
    }
    
    console.log(`📥 Downloading ${missingFiles.length} missing files...`);
    
    // Check if Python and gdown are available
    try {
        await execAsync('python --version');
        console.log('✅ Python is available');
        
        try {
            await execAsync('python -c "import gdown"');
            console.log('✅ gdown is available');
        } catch (error) {
            console.log('⚠️ gdown not found, installing...');
            await execAsync('pip install gdown');
            console.log('✅ gdown installed');
        }
    } catch (error) {
        console.log('❌ Python not found - cannot download files');
        return false;
    }
    
    // Download files one by one
    for (const filename of missingFiles) {
        const fileId = MODEL_FILES[filename];
        const success = await downloadFile(fileId, filename);
        if (!success) {
            return false;
        }
    }
    
    return true;
}

// Main execution
async function main() {
    try {
        createModelDirectory();
        
        // Check existing files
        const { existingFiles, missingFiles } = checkExistingFiles();
        
        if (missingFiles.length === 0) {
            console.log('\n🎉 All model files are ready!');
            return;
        }
        
        console.log(`\n📥 Need to download ${missingFiles.length} files: ${missingFiles.join(', ')}`);
        
        // Try to download missing files
        const downloadSuccess = await downloadMissingFiles(missingFiles);
        
        if (downloadSuccess) {
            // Verify all files are now present
            const { missingFiles: stillMissing } = checkExistingFiles();
            if (stillMissing.length === 0) {
                console.log('\n🎉 TinyLlama model setup complete!');
            } else {
                console.log(`\n❌ Still missing files: ${stillMissing.join(', ')}`);
                console.log('💡 TinyLlama will be disabled - using fallback models');
            }
        } else {
            console.log('\n❌ Failed to download model files');
            console.log('💡 TinyLlama will be disabled - using fallback models');
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('💡 TinyLlama will be disabled - using fallback models');
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { main, checkExistingFiles, createModelDirectory };

