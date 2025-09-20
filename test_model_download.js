#!/usr/bin/env node

/**
 * Test script to verify model download works locally
 * Run this before deploying to Render
 */

const { downloadAllFiles, verifyFiles, createModelDirectory } = require('./backend/scripts/download_model');

async function testDownload() {
    console.log('🧪 Testing TinyLlama Model Download');
    console.log('===================================');
    
    try {
        // Test directory creation
        console.log('1️⃣ Testing directory creation...');
        createModelDirectory();
        
        // Test file download
        console.log('\n2️⃣ Testing file download...');
        const success = await downloadAllFiles();
        
        if (success) {
            console.log('\n3️⃣ Testing file verification...');
            const verified = verifyFiles();
            
            if (verified) {
                console.log('\n🎉 All tests passed! Ready for deployment.');
                console.log('\n📋 Next steps:');
                console.log('1. Update Render build command: npm install && node backend/scripts/download_model.js');
                console.log('2. Deploy to Render');
                console.log('3. Check logs for successful model download');
            } else {
                console.log('\n❌ File verification failed');
            }
        } else {
            console.log('\n❌ File download failed');
        }
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.log('\n💡 Make sure to:');
        console.log('1. Upload files to Google Drive');
        console.log('2. Get public download URLs');
        console.log('3. Update MODEL_URLS in backend/scripts/download_model.js');
    }
}

// Run test
testDownload();
