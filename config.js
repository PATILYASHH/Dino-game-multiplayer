// Configuration for deployment
const CONFIG = {
    // WebSocket server URL - change this after deploying your WebSocket server
    WEBSOCKET_URL: window.location.protocol === 'https:' 
        ? 'wss://your-websocket-server.railway.app' // Replace with your deployed WebSocket server
        : 'ws://localhost:3000', // Local development
    
    // Deployment platform
    PLATFORM: 'netlify',
    
    // Game settings
    GAME_VERSION: '2.0.0',
    MAX_PLAYERS: 8,
    DEFAULT_DIFFICULTY: 'medium',
    
    // UI settings
    MOBILE_BREAKPOINT: 768,
    ANIMATION_DURATION: 300
};

// Make config globally available
window.DINO_CONFIG = CONFIG;
