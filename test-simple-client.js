// Test client for simple server
const WebSocket = require('ws');

console.log('Testing WebSocket connection to ws://localhost:8081...');

const ws = new WebSocket('ws://localhost:8081');

ws.on('open', function open() {
    console.log('✅ WebSocket connection successful!');
    
    // Test sending a message
    const testMessage = {
        type: 'test',
        message: 'Hello from client'
    };
    
    console.log('Sending test message:', testMessage);
    ws.send(JSON.stringify(testMessage));
});

ws.on('message', function message(data) {
    console.log('📨 Received message:', data.toString());
});

ws.on('close', function close() {
    console.log('❌ WebSocket connection closed');
});

ws.on('error', function error(err) {
    console.error('❌ WebSocket error:', err);
});

// Close connection after 3 seconds
setTimeout(() => {
    console.log('Closing connection...');
    ws.close();
}, 3000);
