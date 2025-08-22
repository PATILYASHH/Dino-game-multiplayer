// Configuration for deployment
const CONFIG = {
    // WebSocket server URL - IMPORTANT: UPDATE THIS WITH YOUR DEPLOYED SERVER URL
    WEBSOCKET_URL: window.location.protocol === 'https:' 
        ? 'wss://DEPLOY-YOUR-SERVER-FIRST.railway.app' // REPLACE with your Railway/Render URL
        : 'ws://localhost:3000', // Local development only
    
    // Deployment platform
    PLATFORM: 'netlify',
    
    // Server deployment status
    SERVER_DEPLOYED: false, // Change to true after deploying WebSocket server
    
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
