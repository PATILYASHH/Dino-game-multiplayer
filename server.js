// Simple WebSocket server using Node.js and ws with HTTP server
const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Add process error handlers for stability
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Create HTTP server
const httpServer = http.createServer((req, res) => {
    let filePath = '';
    
    // Route handling
    if (req.url === '/') {
        filePath = path.join(__dirname, 'index.html');
    } else if (req.url === '/lobby') {
        filePath = path.join(__dirname, 'lobby.html');
    } else if (req.url === '/game') {
        filePath = path.join(__dirname, 'game.html');
    } else {
        // Serve static files
        filePath = path.join(__dirname, req.url);
    }
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath);
        const contentType = {
            '.html': 'text/html',
            '.css': 'text/css', 
            '.js': 'application/javascript',
            '.json': 'application/json'
        }[ext] || 'text/plain';
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(fs.readFileSync(filePath));
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
    }
});

// Create WebSocket server using the HTTP server
const server = new WebSocket.Server({ server: httpServer });

// lobbies: Map<lobbyId, Map<playerId, { ws, color, ready, playerName }>>
const lobbies = new Map();
// players: Map<ws, { lobbyId, playerId }>
const players = new Map();

function broadcast(lobbyId, data) {
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return;
    const msg = JSON.stringify(data);
    for (const [pid, client] of lobby.entries()) {
        if (client.ws && client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(msg);
        }
    }
}

server.on('connection', (ws) => {
    let currentLobby = null;
    let playerId = null;

    ws.on('message', (msg) => {
        let data = {};
        try { data = JSON.parse(msg); } catch (e) { 
            return; 
        }

        if (data.type === 'join') {
            currentLobby = data.lobbyId;
            playerId = data.playerId || Math.random().toString(36).slice(2, 8);
            if (!currentLobby) return;
            
            if (!lobbies.has(currentLobby)) lobbies.set(currentLobby, new Map());
            
            const lobbyMap = lobbies.get(currentLobby);
            const isAdmin = lobbyMap.size === 0; // First player is admin
            
            const playerData = {
                ws: ws,
                color: data.color || '#2563eb',
                ready: false,
                playerName: data.playerName || `Player${Math.floor(Math.random() * 1000)}`,
                isAdmin: isAdmin
            };
            
            lobbyMap.set(playerId, playerData);
            players.set(ws, { lobbyId: currentLobby, playerId });
            
            // Send admin status to player
            if (isAdmin) {
                ws.send(JSON.stringify({
                    type: 'admin_status',
                    isAdmin: true
                }));
            }
            
            const playersArr = Array.from(lobbies.get(currentLobby).entries()).map(([pid, meta]) => ({ 
                id: pid, 
                color: meta.color, 
                ready: meta.ready,
                playerName: meta.playerName
            }));
            
            const host = playersArr.length ? playersArr[0].id : null;
            broadcast(currentLobby, { type: 'lobby', players: playersArr, host });
            
        } else if (data.type === 'start') {
            // only allow start if current sender is host
            if (!currentLobby) return;
            const lobbyMap = lobbies.get(currentLobby);
            if (!lobbyMap) return;
            const playersArr = Array.from(lobbyMap.keys());
            const host = playersArr[0];
            if (host !== playerId) return; // only host can start
            
            // generate an explicit seed so everyone uses the same obstacle RNG
            const seed = Math.floor(Math.random() * 2 ** 31);
            broadcast(currentLobby, { type: 'start', seed });
            
        } else if (data.type === 'state') {
            // relay state to everyone in the lobby with additional player info
            if (currentLobby) {
                const lobbyMap = lobbies.get(currentLobby);
                const playerData = lobbyMap ? lobbyMap.get(playerId) : null;
                
                broadcast(currentLobby, { 
                    type: 'state', 
                    player: data.player, 
                    score: data.score, 
                    alive: data.alive,
                    isAlive: data.isAlive,
                    isJumping: data.isJumping,
                    isFrozen: data.isFrozen,
                    progress: data.progress,
                    playerName: playerData ? playerData.playerName : data.playerName,
                    color: playerData ? playerData.color : data.color
                });
            }
            
        } else if (data.type === 'player_died') {
            // relay player death to everyone in the lobby
            if (currentLobby) {
                broadcast(currentLobby, {
                    type: 'player_died',
                    playerId: data.playerId
                });
            }
            
        } else if (data.type === 'player_respawned') {
            // relay player respawn to everyone in the lobby
            if (currentLobby) {
                broadcast(currentLobby, {
                    type: 'player_respawned',
                    playerId: data.playerId
                });
            }
            
        } else if (data.type === 'player_frozen') {
            // relay player freeze to everyone in the lobby
            if (currentLobby) {
                broadcast(currentLobby, {
                    type: 'player_frozen',
                    playerId: data.playerId
                });
            }
            
        } else if (data.type === 'player_unfrozen') {
            // relay player unfreeze to everyone in the lobby
            if (currentLobby) {
                broadcast(currentLobby, {
                    type: 'player_unfrozen',
                    playerId: data.playerId
                });
            }
            
        } else if (data.type === 'game_settings') {
            // relay admin game settings to everyone in the lobby
            if (currentLobby) {
                broadcast(currentLobby, {
                    type: 'game_settings',
                    settings: data.settings
                });
            }
            
        } else if (data.type === 'game_finished') {
            // relay game finish to everyone in the lobby
            if (currentLobby) {
                broadcast(currentLobby, {
                    type: 'game_finished',
                    winner: data.winner,
                    winnerName: data.winnerName
                });
            }
            
        } else if (data.type === 'set') {
            // update player meta (color/ready)
            if (!currentLobby) return;
            const lobbyMap = lobbies.get(currentLobby);
            if (!lobbyMap) return;
            const meta = lobbyMap.get(playerId);
            if (!meta) return;
            
            if (data.key === 'color') meta.color = data.value;
            if (data.key === 'ready') meta.ready = !!data.value;
            if (data.key === 'playerName') meta.playerName = data.value;
            
            lobbyMap.set(playerId, meta);
            const playersArr = Array.from(lobbyMap.entries()).map(([pid, m]) => ({ 
                id: pid, 
                color: m.color, 
                ready: m.ready,
                playerName: m.playerName 
            }));
            const host = playersArr.length ? playersArr[0].id : null;
            broadcast(currentLobby, { type: 'lobby', players: playersArr, host });
        }
    });

    ws.on('close', () => {
        const info = players.get(ws);
        if (info && info.lobbyId) {
            const map = lobbies.get(info.lobbyId);
            if (map) {
                map.delete(info.playerId);
                if (map.size === 0) {
                    lobbies.delete(info.lobbyId);
                } else {
                    const playersArr = Array.from(map.entries()).map(([pid, m]) => ({ 
                        id: pid, 
                        color: m.color, 
                        ready: m.ready,
                        playerName: m.playerName 
                    }));
                    const host = playersArr.length ? playersArr[0].id : null;
                    broadcast(info.lobbyId, { type: 'lobby', players: playersArr, host });
                }
            }
        }
        players.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
    });
});

server.on('error', (error) => {
    console.error('Server error:', error);
});

// Start the HTTP server
const PORT = process.env.PORT || 3000;
const HOST = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1';

httpServer.listen(PORT, HOST, () => {
    console.log(`WebSocket server running on ws://${HOST}:${PORT}`);
    console.log(`HTTP server running on http://${HOST}:${PORT}`);
    console.log('Server ready for connections!');
}).on('error', (err) => {
    console.error('❌ Server failed to start:', err);
    process.exit(1);
});
