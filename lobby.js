// Lobby management and WebSocket connection
class LobbyManager {
    constructor() {
        console.log('LobbyManager const        try {
            // Use config-based WebSocket URL for deployment flexibility
            const wsUrl = window.DINO_CONFIG ? window.DINO_CONFIG.WEBSOCKET_URL : 'ws://localhost:8082';
            this.ws = new WebSocket(wsUrl); called');
        this.ws = null;
        this.playerId = this.generatePlayerId();
        this.playerName = '';
        this.playerColor = '#2563eb';
        this.isReady = false;
        this.isHost = false;
        this.currentLobbyCode = null;
        this.players = new Map();
        this.connectionRetries = 0;
        this.maxRetries = 5;
        
        console.log('Initializing elements...');
        this.initializeElements();
        this.setupEventListeners();
        this.initPreviewCanvas();
        console.log('LobbyManager setup complete');
    }
    
    generatePlayerId() {
        return Math.random().toString(36).substring(2, 10);
    }
    
    initializeElements() {
        this.elements = {
            connectionStatus: document.getElementById('connection-status'),
            playerNameInput: document.getElementById('player-name'),
            lobbyCodeInput: document.getElementById('lobby-code'),
            playerColorInput: document.getElementById('player-color'),
            colorPreview: document.getElementById('color-preview'),
            joinCreateBtn: document.getElementById('join-create-btn'),
            lobbySetup: document.querySelector('.lobby-setup'),
            lobbyRoom: document.getElementById('lobby-room'),
            currentLobbyCode: document.getElementById('current-lobby-code'),
            playersGrid: document.getElementById('players-grid'),
            playerCount: document.getElementById('player-count'),
            readyToggle: document.getElementById('ready-toggle'),
            startGameBtn: document.getElementById('start-game-btn'),
            leaveLobbyBtn: document.getElementById('leave-lobby-btn'),
            previewCanvas: document.getElementById('preview')
        };
        
        // Set default player name
        this.elements.playerNameInput.value = `Player${Math.floor(Math.random() * 1000)}`;
        this.updateColorPreview();
    }
    
    setupEventListeners() {
        this.elements.playerColorInput.addEventListener('change', () => {
            this.playerColor = this.elements.playerColorInput.value;
            this.updateColorPreview();
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.sendMessage('set', { key: 'color', value: this.playerColor });
            }
        });
        
        this.elements.joinCreateBtn.addEventListener('click', () => this.joinOrCreateLobby());
        this.elements.readyToggle.addEventListener('click', () => this.toggleReady());
        this.elements.startGameBtn.addEventListener('click', () => this.startGame());
        this.elements.leaveLobbyBtn.addEventListener('click', () => this.leaveLobby());
        
        // Enter key support
        this.elements.playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinOrCreateLobby();
        });
        this.elements.lobbyCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.joinOrCreateLobby();
        });
    }
    
    updateColorPreview() {
        this.elements.colorPreview.style.background = this.playerColor;
    }
    
    initPreviewCanvas() {
        const canvas = this.elements.previewCanvas;
        const ctx = canvas.getContext('2d');
        
        // Simple animated preview
        let animationFrame = 0;
        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Ground
            ctx.fillStyle = '#8FBC8F';
            ctx.fillRect(0, canvas.height - 40, canvas.width, 40);
            
            // Moving clouds
            ctx.fillStyle = '#ffffff';
            const cloudOffset = (animationFrame * 0.5) % (canvas.width + 60);
            ctx.beginPath();
            ctx.arc(cloudOffset - 60, 40, 20, 0, Math.PI * 2);
            ctx.arc(cloudOffset - 40, 35, 25, 0, Math.PI * 2);
            ctx.arc(cloudOffset - 20, 40, 20, 0, Math.PI * 2);
            ctx.fill();
            
            // Running dino
            const dinoX = 50;
            const dinoY = canvas.height - 80;
            const bounce = Math.sin(animationFrame * 0.3) * 5;
            
            ctx.fillStyle = this.playerColor;
            ctx.fillRect(dinoX, dinoY + bounce, 30, 25);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(dinoX + 20, dinoY + 5 + bounce, 4, 4);
            
            // Moving obstacles
            const obstacleOffset = (animationFrame * 2) % (canvas.width + 40);
            ctx.fillStyle = '#228B22';
            ctx.fillRect(canvas.width - obstacleOffset, canvas.height - 60, 15, 20);
            
            animationFrame++;
            requestAnimationFrame(animate);
        };
        
        animate();
    }
    
    connectWebSocket() {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return;
        }
        
        this.updateConnectionStatus('connecting', 'Connecting...');
        
        try {
            // Use config-based WebSocket URL for deployment flexibility
            const wsUrl = window.DINO_CONFIG ? window.DINO_CONFIG.WEBSOCKET_URL : 'ws://localhost:8082';
            this.ws = new WebSocket(wsUrl);
            
            this.ws.addEventListener('open', () => {
                this.connectionRetries = 0;
                this.updateConnectionStatus('connected', 'Connected');
                
                // Join lobby immediately after connection
                this.sendMessage('join', {
                    lobbyId: this.currentLobbyCode,
                    playerId: this.playerId,
                    playerName: this.playerName,
                    color: this.playerColor
                });
            });
            
            this.ws.addEventListener('message', (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            });
            
            this.ws.addEventListener('close', () => {
                this.updateConnectionStatus('disconnected', 'Disconnected');
                
                // Attempt to reconnect
                if (this.connectionRetries < this.maxRetries && this.currentLobbyCode) {
                    this.connectionRetries++;
                    setTimeout(() => this.connectWebSocket(), 2000 * this.connectionRetries);
                }
            });
            
            this.ws.addEventListener('error', (error) => {
                console.error('WebSocket error:', error);
                this.updateConnectionStatus('error', 'Connection Error');
            });
            
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            this.updateConnectionStatus('error', 'Failed to Connect');
        }
    }
    
    sendMessage(type, data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type, ...data }));
        }
    }
    
    handleMessage(data) {
        switch (data.type) {
            case 'lobby':
                this.handleLobbyUpdate(data);
                break;
            case 'start':
                this.handleGameStart(data);
                break;
            case 'error':
                this.handleError(data);
                break;
        }
    }
    
    handleLobbyUpdate(data) {
        this.players.clear();
        
        if (data.players && Array.isArray(data.players)) {
            data.players.forEach(player => {
                this.players.set(player.id, player);
            });
        }
        
        this.isHost = data.host === this.playerId;
        this.updatePlayersDisplay();
        this.updateHostControls();
    }
    
    handleGameStart(data) {
        // Store multiplayer game data
        localStorage.setItem('gameMode', 'multiplayer');
        localStorage.setItem('lobbyCode', this.currentLobbyCode);
        localStorage.setItem('playerId', this.playerId);
        localStorage.setItem('playerName', this.playerName);
        localStorage.setItem('playerColor', this.playerColor);
        
        if (data.seed) {
            localStorage.setItem('gameSeed', data.seed.toString());
        }
        
        // Navigate to game
        window.location.href = 'game.html';
    }
    
    handleError(data) {
        console.error('Server error:', data.message);
        alert(`Error: ${data.message}`);
    }
    
    updateConnectionStatus(status, text) {
        const statusDot = this.elements.connectionStatus.querySelector('.status-dot');
        const statusText = this.elements.connectionStatus.querySelector('span');
        
        statusDot.className = `status-dot ${status}`;
        statusText.textContent = text;
    }
    
    joinOrCreateLobby() {
        console.log('joinOrCreateLobby called');
        this.playerName = this.elements.playerNameInput.value.trim();
        if (!this.playerName) {
            alert('Please enter your name');
            return;
        }
        
        this.currentLobbyCode = this.elements.lobbyCodeInput.value.trim() || this.generateLobbyCode();
        console.log('Connecting to lobby:', this.currentLobbyCode);
        this.connectWebSocket();
        
        // Show lobby room
        this.elements.lobbySetup.style.display = 'none';
        this.elements.lobbyRoom.style.display = 'block';
        this.elements.currentLobbyCode.textContent = this.currentLobbyCode;
    }
    
    generateLobbyCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    
    updatePlayersDisplay() {
        const grid = this.elements.playersGrid;
        grid.innerHTML = '';
        
        this.players.forEach((player, playerId) => {
            const playerCard = document.createElement('div');
            playerCard.className = 'player-card';
            
            if (player.ready) playerCard.classList.add('ready');
            if (playerId === this.playerId) playerCard.classList.add('self');
            if (this.isHost && playerId === this.playerId) playerCard.classList.add('host');
            
            const avatar = document.createElement('div');
            avatar.className = 'player-avatar';
            avatar.style.background = player.color || '#2563eb';
            avatar.textContent = (player.playerName || player.id || 'P').charAt(0).toUpperCase();
            
            const name = document.createElement('div');
            name.className = 'player-name';
            name.textContent = player.playerName || player.id.substring(0, 8);
            if (playerId === this.playerId) name.textContent += ' (You)';
            
            const status = document.createElement('div');
            status.className = 'player-status';
            if (this.isHost && playerId === this.playerId) {
                status.textContent = 'Host';
                status.style.background = '#fef3c7';
                status.style.color = '#92400e';
            } else if (player.ready) {
                status.textContent = 'Ready';
                status.style.background = '#d1fae5';
                status.style.color = '#065f46';
            } else {
                status.textContent = 'Not Ready';
            }
            
            playerCard.appendChild(avatar);
            playerCard.appendChild(name);
            playerCard.appendChild(status);
            grid.appendChild(playerCard);
        });
        
        this.elements.playerCount.textContent = `(${this.players.size}/8)`;
    }
    
    updateHostControls() {
        if (this.isHost) {
            this.elements.startGameBtn.style.display = 'block';
        } else {
            this.elements.startGameBtn.style.display = 'none';
        }
    }
    
    toggleReady() {
        this.isReady = !this.isReady;
        this.elements.readyToggle.textContent = this.isReady ? 'Not Ready' : 'Ready Up!';
        this.elements.readyToggle.classList.toggle('ready', this.isReady);
        
        this.sendMessage('set', { key: 'ready', value: this.isReady });
    }
    
    startGame() {
        if (this.isHost) {
            this.sendMessage('start', {});
        }
    }
    
    leaveLobby() {
        if (this.ws) {
            this.ws.close();
        }
        
        // Reset UI
        this.elements.lobbySetup.style.display = 'block';
        this.elements.lobbyRoom.style.display = 'none';
        this.currentLobbyCode = null;
        this.players.clear();
        this.isReady = false;
        this.isHost = false;
        this.elements.readyToggle.textContent = 'Ready Up!';
        this.elements.readyToggle.classList.remove('ready');
        
        this.updateConnectionStatus('disconnected', 'Disconnected');
    }
}

// Global functions
function copyLobbyCode() {
    const lobbyCode = document.getElementById('current-lobby-code').textContent;
    navigator.clipboard.writeText(lobbyCode).then(() => {
        const copyBtn = document.querySelector('.copy-btn');
        const originalText = copyBtn.textContent;
        copyBtn.textContent = '✅';
        setTimeout(() => {
            copyBtn.textContent = originalText;
        }, 2000);
    }).catch(() => {
        alert(`Lobby Code: ${lobbyCode}`);
    });
}

// Initialize lobby when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.lobbyManager = new LobbyManager();
});
