#!/usr/bin/env node

// Simple script to update config.js with your deployed WebSocket server URL
// Usage: node update-config.js https://your-server.railway.app

const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'config.js');
const serverUrl = process.argv[2];

if (!serverUrl) {
    console.log('Usage: node update-config.js <your-server-url>');
    console.log('Example: node update-config.js https://your-project.railway.app');
    process.exit(1);
}

// Validate URL format
try {
    const url = new URL(serverUrl);
    if (url.protocol !== 'https:') {
        console.log('Warning: Using HTTP instead of HTTPS may cause issues in production');
    }
} catch (error) {
    console.log('Error: Invalid URL format');
    process.exit(1);
}

// Read current config
let configContent = fs.readFileSync(configPath, 'utf8');

// Update the WebSocket URL
const wsUrl = serverUrl.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:');
const newConfigContent = configContent.replace(
    /'wss:\/\/DEPLOY-YOUR-SERVER-FIRST\.railway\.app'/,
    `'${wsUrl}'`
).replace(
    /SERVER_DEPLOYED: false/,
    'SERVER_DEPLOYED: true'
);

// Write updated config
fs.writeFileSync(configPath, newConfigContent);

console.log('✅ Config updated successfully!');
console.log(`📡 WebSocket URL: ${wsUrl}`);
console.log(`🌐 Frontend URL: https://multidino.netlify.app/`);
console.log('\n🚀 Next steps:');
console.log('1. git add config.js');
console.log('2. git commit -m "Update WebSocket server URL"');
console.log('3. git push origin main');
console.log('4. Netlify will auto-deploy the updated config');
console.log('5. Test multiplayer at https://multidino.netlify.app/');
