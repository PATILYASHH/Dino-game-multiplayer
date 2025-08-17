// Simplified WebSocket server test
const WebSocket = require('ws');
const http = require('http');

console.log('Starting simple HTTP + WebSocket server test...');

// Create HTTP server
const httpServer = http.createServer((req, res) => {
    console.log('HTTP request:', req.url);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Simple server running');
});

// Create WebSocket server
const wss = new WebSocket.Server({ server: httpServer });

wss.on('connection', function connection(ws) {
    console.log('✅ New WebSocket connection established');
    
    ws.on('message', function message(data) {
        console.log('📨 WebSocket message received:', data.toString());
        
        // Echo back the message
        ws.send(JSON.stringify({
            type: 'echo', 
            message: 'Server received: ' + data.toString()
        }));
    });
    
    ws.on('close', function close() {
        console.log('❌ WebSocket connection closed');
    });
    
    ws.on('error', function error(err) {
        console.error('❌ WebSocket error:', err);
    });
    
    // Send welcome message
    ws.send(JSON.stringify({
        type: 'welcome',
        message: 'Connected to simplified server'
    }));
});

wss.on('error', function error(err) {
    console.error('❌ WebSocket server error:', err);
});

// Start the server
httpServer.listen(8081, function() {
    console.log('✅ Simple HTTP server running on http://localhost:8081');
    console.log('✅ Simple WebSocket server running on ws://localhost:8081');
});

httpServer.on('error', function(err) {
    console.error('❌ HTTP server error:', err);
});
