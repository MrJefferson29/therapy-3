#!/usr/bin/env node

/**
 * Improved TinyLlama Model Download Script with Google Drive support
 * Handles large files and Google Drive's download process
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const MODEL_DIR = path.join(__dirname, '..', 'therapy-ai-tinyllama-clean');
const MODEL_URLS = {
    // Google Drive URLs for TinyLlama model files
    'config.json': 'https://drive.google.com/uc?export=download&id=1SaJH22x6nD7pGdVrXBuxE6CvuOvBCjSE',
    'model.safetensors': 'https://drive.google.com/uc?export=download&id=1AxvfCWviOPWBkgrIz08kf0x2bnHqXyT8',
    'tokenizer.json': 'https://drive.google.com/uc?export=download&id=1B953zrEP4cjCBysbwbWb8Mafpm2_lDGF',
    'tokenizer_config.json': 'https://drive.google.com/uc?export=download&id=141Amks8-qu_UjAZS0g6w4yhe9RBOi-a3',
    'generation_config.json': 'https://drive.google.com/uc?export=download&id=1JDXlv73VxUudYkeG-vqBh1yB9Zqecj3d'
};

console.log('🚀 TinyLlama Model Download Script (Improved)');
console.log('=============================================');

// Create model directory
function createModelDirectory() {
    if (!fs.existsSync(MODEL_DIR)) {
        fs.mkdirSync(MODEL_DIR, { recursive: true });
        console.log(`✅ Created model directory: ${MODEL_DIR}`);
    } else {
        console.log(`📁 Model directory exists: ${MODEL_DIR}`);
    }
}

// Download a single file with improved Google Drive support
function downloadFile(url, filename) {
    return new Promise((resolve, reject) => {
        const filePath = path.join(MODEL_DIR, filename);
        const file = fs.createWriteStream(filePath);
        
        console.log(`📥 Downloading ${filename}...`);
        
        const protocol = url.startsWith('https:') ? https : http;
        
        const download = (downloadUrl, isRetry = false) => {
            const request = protocol.get(downloadUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            }, (response) => {
                // Handle redirects
                if (response.statusCode === 302 || response.statusCode === 303) {
                    const redirectUrl = response.headers.location;
                    console.log(`🔄 Redirecting to: ${redirectUrl}`);
                    download(redirectUrl);
                    return;
                }
                
                // Handle Google Drive's large file warning
                if (response.statusCode === 200 && response.headers['content-type'] && 
                    response.headers['content-type'].includes('text/html')) {
                    console.log(`⚠️ Large file detected for ${filename}, handling Google Drive warning...`);
                    
                    // For large files, we need to get the actual download URL
                    let body = '';
                    response.on('data', chunk => body += chunk);
                    response.on('end', () => {
                        // Extract the actual download URL from the HTML
                        const match = body.match(/href="([^"]*uc[^"]*export=download[^"]*confirm=[^"]*)"/);
                        if (match) {
                            const actualUrl = match[1].replace(/&amp;/g, '&');
                            console.log(`🔗 Found actual download URL for ${filename}`);
                            download(actualUrl, true);
                        } else {
                            reject(new Error(`Could not find download URL for large file ${filename}`));
                        }
                    });
                    return;
                }
                
                if (response.statusCode !== 200) {
                    reject(new Error(`Failed to download ${filename}: ${response.statusCode}`));
                    return;
                }
                
                // Get file size for progress tracking
                const totalSize = parseInt(response.headers['content-length'], 10);
                let downloadedSize = 0;
                
                if (totalSize) {
                    console.log(`📊 File size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
                }
                
                response.on('data', (chunk) => {
                    downloadedSize += chunk.length;
                    if (totalSize && downloadedSize % (1024 * 1024) === 0) { // Log every MB
                        const progress = ((downloadedSize / totalSize) * 100).toFixed(1);
                        console.log(`📈 ${filename}: ${progress}% (${(downloadedSize / 1024 / 1024).toFixed(2)} MB)`);
                    }
                });
                
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
            });
            
            request.on('error', (err) => {
                reject(err);
            });
            
            // Set timeout for large files
            request.setTimeout(300000, () => { // 5 minutes
                request.destroy();
                reject(new Error(`Download timeout for ${filename}`));
            });
        };
        
        download(url);
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
        
        // Check if files already exist and are valid
        const existingFiles = Object.keys(MODEL_URLS).filter(filename => {
            const filePath = path.join(MODEL_DIR, filename);
            return fs.existsSync(filePath) && fs.statSync(filePath).size > 0;
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
