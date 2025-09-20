#!/usr/bin/env node

/**
 * TinyLlama Model Download Script using Python gdown
 * More reliable for Google Drive downloads
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

console.log('🚀 TinyLlama Model Download Script (Python gdown)');
console.log('================================================');

// Create model directory
function createModelDirectory() {
    if (!fs.existsSync(MODEL_DIR)) {
        fs.mkdirSync(MODEL_DIR, { recursive: true });
        console.log(`✅ Created model directory: ${MODEL_DIR}`);
    } else {
        console.log(`📁 Model directory exists: ${MODEL_DIR}`);
    }
}

// Check if Python and gdown are available
async function checkPython() {
    try {
        await execAsync('python --version');
        console.log('✅ Python is available');
        
        try {
            await execAsync('python -c "import gdown"');
            console.log('✅ gdown is available');
            return true;
        } catch (error) {
            console.log('⚠️ gdown not found, installing...');
            await execAsync('pip install gdown');
            console.log('✅ gdown installed');
            return true;
        }
    } catch (error) {
        console.log('❌ Python not found');
        return false;
    }
}

// Download a single file using gdown
async function downloadFile(fileId, filename) {
    const filePath = path.join(MODEL_DIR, filename);
    // Convert Windows path to forward slashes for Python
    const pythonPath = filePath.replace(/\\/g, '/');
    
    console.log(`📥 Downloading ${filename}...`);
    
    try {
        const command = `python -c "import gdown; gdown.download('https://drive.google.com/uc?id=${fileId}', '${pythonPath}', quiet=False)"`;
        await execAsync(command);
        
        // Check if file was downloaded
        if (fs.existsSync(filePath) && fs.statSync(filePath).size > 0) {
            const stats = fs.statSync(filePath);
            console.log(`✅ Downloaded ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
            return true;
        } else {
            console.log(`❌ Failed to download ${filename} - file is empty or missing`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Failed to download ${filename}:`, error.message);
        return false;
    }
}

// Download all model files
async function downloadAllFiles() {
    console.log('📥 Starting model file downloads...');
    
    // Download files one by one
    for (const [filename, fileId] of Object.entries(MODEL_FILES)) {
        const success = await downloadFile(fileId, filename);
        if (!success) {
            return false;
        }
    }
    
    console.log('\n✅ All model files downloaded successfully!');
    return true;
}

// Verify downloaded files
function verifyFiles() {
    console.log('\n🔍 Verifying downloaded files...');
    
    const requiredFiles = Object.keys(MODEL_FILES);
    const missingFiles = [];
    
    requiredFiles.forEach(filename => {
        const filePath = path.join(MODEL_DIR, filename);
        if (fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            if (stats.size > 0) {
                console.log(`✅ ${filename} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
            } else {
                console.log(`❌ ${filename} - EMPTY FILE`);
                missingFiles.push(filename);
            }
        } else {
            missingFiles.push(filename);
            console.log(`❌ ${filename} - MISSING`);
        }
    });
    
    if (missingFiles.length > 0) {
        console.log(`\n❌ Missing or empty files: ${missingFiles.join(', ')}`);
        return false;
    }
    
    console.log('\n✅ All model files verified!');
    return true;
}

// Main execution
async function main() {
    try {
        createModelDirectory();
        
        // Check if Python is available
        const pythonAvailable = await checkPython();
        if (!pythonAvailable) {
            console.log('❌ Python is required for this download method');
            console.log('💡 Alternative: Use the Node.js download script or upload files manually');
            process.exit(1);
        }
        
        // Check if files already exist and are valid
        const existingFiles = Object.keys(MODEL_FILES).filter(filename => {
            const filePath = path.join(MODEL_DIR, filename);
            return fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
        });
        
        if (existingFiles.length === Object.keys(MODEL_FILES).length) {
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
