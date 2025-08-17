// Simple WebSocket client test
const WebSocket = require('ws');

console.log('Testing WebSocket connection to ws://localhost:8080...');

const ws = new WebSocket('ws://localhost:8080');

ws.on('open', function open() {
    console.log('✅ WebSocket connection successful!');
    
    // Test sending a join message
    const testMessage = {
        type: 'join',
        lobbyId: 'TEST123',
        playerId: 'testplayer',
        playerName: 'Test Player',
        color: '#2563eb'
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

// Close connection after 5 seconds
setTimeout(() => {
    console.log('Closing connection...');
    ws.close();
}, 5000);
