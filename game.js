// Enhanced Dino Game with Professional UI and Multiplayer
class DinoGame {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.scoreElement = document.getElementById('score');
        this.highScoreElement = document.getElementById('high-score');
        this.gameOverlay = document.getElementById('game-overlay');
        this.finalScoreElement = document.getElementById('final-score');
        this.restartBtn = document.getElementById('restart-btn');
        this.multiplayerPanel = document.getElementById('multiplayer-panel');
        this.livePlayersElement = document.getElementById('live-players');
        this.playerRankElement = document.getElementById('player-rank');
        this.multiplayerStatsElement = document.getElementById('multiplayer-stats');
        
        // Game constants
        this.GROUND_Y = 250; // Moved up even more from 280 to 250 for better alignment
        this.GRAVITY = 0.8;
        this.JUMP_VELOCITY = -16;
        this.OBSTACLE_SPEED = 8;
        this.OBSTACLE_INTERVAL = 100;
        this.DINO_WIDTH = 50;
        this.DINO_HEIGHT = 50;
        this.OBSTACLE_WIDTH = 25;
        this.OBSTACLE_HEIGHT = 50;
        
        // Game state
        this.gameMode = localStorage.getItem('gameMode') || 'single';
        this.isMultiplayer = this.gameMode === 'multiplayer';
        this.gameStarted = false;
        this.gamePaused = false;
        this.gameOver = false;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('highScore')) || 0;
        this.frame = 0;
        this.speed = 1;
        
        // Player state
        this.dino = {
            x: 100,
            y: this.GROUND_Y - this.DINO_HEIGHT, // Position dino ON the ground, not below it
            vy: 0,
            isJumping: false,
            isAlive: true,
            isDead: false,
            deathTime: 0,
            isFrozen: false,
            freezeTime: 0,
            freezeDuration: 5000, // 5 seconds freeze
            color: localStorage.getItem('playerColor') || '#2563eb'
        };
        
        // Game settings for admin
        this.gameSettings = {
            difficulty: localStorage.getItem('gameDifficulty') || 'medium',
            hasEndPoint: localStorage.getItem('hasEndPoint') === 'true',
            endPoint: parseInt(localStorage.getItem('endPoint')) || 1000,
            respawnTime: 2000 // 2 seconds
        };
        this.isAdmin = localStorage.getItem('isAdmin') === 'true';
        this.gameFinished = false;
        this.winner = null;
        
        this.obstacles = [];
        this.clouds = [];
        this.particles = [];
        
        // Multiplayer state
        this.ws = null;
        this.playerId = localStorage.getItem('playerId');
        this.playerName = localStorage.getItem('playerName');
        this.lobbyCode = localStorage.getItem('lobbyCode');
        this.remotePlayers = new Map();
        this.gameSeed = localStorage.getItem('gameSeed');
        this.rng = this.gameSeed ? this.mulberry32(parseInt(this.gameSeed)) : Math.random;
        
        this.initializeGame();
        this.setupEventListeners();
        
        if (this.isMultiplayer) {
            this.initializeMultiplayer();
        }
        
        this.initializeAdminControls();
        
        this.gameLoop();
    }
    
    mulberry32(seed) {
        return function() {
            let t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ t >>> 15, t | 1);
            t ^= t + Math.imul(t ^ t >>> 7, t | 61);
            return ((t ^ t >>> 14) >>> 0) / 4294967296;
        }
    }
    
    initializeGame() {
        this.highScoreElement.textContent = this.highScore;
        this.updateScore(0);
        
        // Generate initial clouds
        for (let i = 0; i < 3; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width,
                y: 50 + Math.random() * 100,
                size: 20 + Math.random() * 30,
                speed: 0.5 + Math.random() * 1
            });
        }
        
        // Pre-generate obstacles for multiplayer
        if (this.isMultiplayer && this.gameSeed) {
            this.generateObstaclesFromSeed();
        }
        
        this.gameStarted = true;
    }
    
    generateObstaclesFromSeed() {
        this.obstacles = [];
        let x = this.canvas.width + 100;
        
        for (let i = 0; i < 100; i++) {
            const spacing = 150 + this.rng() * 200;
            x += spacing;
            
            if (this.rng() < 0.7) {
                const height = this.OBSTACLE_HEIGHT + this.rng() * 30;
                this.obstacles.push({
                    x: x,
                    y: this.GROUND_Y - height,
                    width: this.OBSTACLE_WIDTH,
                    height: height,
                    type: Math.floor(this.rng() * 3) // Different obstacle types
                });
            }
        }
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        // Touch support for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.jump();
        });
        
        this.canvas.addEventListener('click', () => {
            if (this.gameOver) {
                this.restartGame();
            } else {
                this.jump();
            }
        });
        
        this.restartBtn.addEventListener('click', () => this.restartGame());
        
        // Pause button
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.togglePause());
        }
    }
    
    initializeAdminControls() {
        const adminBtn = document.getElementById('admin-btn');
        const adminPanel = document.getElementById('admin-panel');
        const closeAdminBtn = document.getElementById('close-admin-btn');
        const applySettingsBtn = document.getElementById('apply-settings-btn');
        const hasEndpointCheck = document.getElementById('has-endpoint');
        const endpointRow = document.getElementById('endpoint-row');
        
        // Show admin button if user is admin
        if (this.isAdmin && adminBtn) {
            adminBtn.style.display = 'flex';
            adminBtn.addEventListener('click', () => {
                adminPanel.style.display = 'block';
                this.loadAdminSettings();
            });
        }
        
        if (closeAdminBtn) {
            closeAdminBtn.addEventListener('click', () => {
                adminPanel.style.display = 'none';
            });
        }
        
        if (hasEndpointCheck) {
            hasEndpointCheck.addEventListener('change', (e) => {
                endpointRow.style.display = e.target.checked ? 'flex' : 'none';
            });
        }
        
        if (applySettingsBtn) {
            applySettingsBtn.addEventListener('click', () => this.applyAdminSettings());
        }
    }
    
    loadAdminSettings() {
        const difficultySelect = document.getElementById('difficulty-select');
        const hasEndpointCheck = document.getElementById('has-endpoint');
        const endpointScore = document.getElementById('endpoint-score');
        const endpointRow = document.getElementById('endpoint-row');
        
        if (difficultySelect) difficultySelect.value = this.gameSettings.difficulty;
        if (hasEndpointCheck) hasEndpointCheck.checked = this.gameSettings.hasEndPoint;
        if (endpointScore) endpointScore.value = this.gameSettings.endPoint;
        if (endpointRow) endpointRow.style.display = this.gameSettings.hasEndPoint ? 'flex' : 'none';
    }
    
    applyAdminSettings() {
        const difficultySelect = document.getElementById('difficulty-select');
        const hasEndpointCheck = document.getElementById('has-endpoint');
        const endpointScore = document.getElementById('endpoint-score');
        const adminPanel = document.getElementById('admin-panel');
        
        this.gameSettings.difficulty = difficultySelect.value;
        this.gameSettings.hasEndPoint = hasEndpointCheck.checked;
        this.gameSettings.endPoint = parseInt(endpointScore.value);
        
        // Save to localStorage
        localStorage.setItem('gameDifficulty', this.gameSettings.difficulty);
        localStorage.setItem('hasEndPoint', this.gameSettings.hasEndPoint.toString());
        localStorage.setItem('endPoint', this.gameSettings.endPoint.toString());
        
        // Apply difficulty settings
        this.applyDifficultySettings();
        
        // Send settings to other players if multiplayer
        if (this.isMultiplayer && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'game_settings',
                settings: this.gameSettings,
                lobbyId: this.lobbyCode
            }));
        }
        
        adminPanel.style.display = 'none';
    }
    
    applyDifficultySettings() {
        const difficultyMultipliers = {
            easy: 0.7,
            medium: 1.0,
            hard: 1.4,
            extreme: 2.0
        };
        
        const multiplier = difficultyMultipliers[this.gameSettings.difficulty] || 1.0;
        this.OBSTACLE_SPEED = 8 * multiplier;
        this.speed = 1 * multiplier;
    }
    
    initializeMultiplayer() {
        this.multiplayerPanel.style.display = 'block';
        this.multiplayerStatsElement.style.display = 'block';
        
        this.connectWebSocket();
    }
    
    connectWebSocket() {
        try {
            // Use config-based WebSocket URL for deployment flexibility
            const wsUrl = window.DINO_CONFIG ? window.DINO_CONFIG.WEBSOCKET_URL : 'ws://localhost:3000';
            this.ws = new WebSocket(wsUrl);
            
            this.ws.addEventListener('open', () => {
                this.ws.send(JSON.stringify({
                    type: 'join',
                    lobbyId: this.lobbyCode,
                    playerId: this.playerId,
                    playerName: this.playerName,
                    color: this.dino.color
                }));
                
                this.updateConnectionIndicator(true);
            });
            
            this.ws.addEventListener('message', (event) => {
                const data = JSON.parse(event.data);
                this.handleMultiplayerMessage(data);
            });
            
            this.ws.addEventListener('close', () => {
                this.updateConnectionIndicator(false);
            });
            
        } catch (error) {
            console.error('WebSocket connection failed:', error);
            this.updateConnectionIndicator(false);
        }
    }
    
    handleMultiplayerMessage(data) {
        switch (data.type) {
            case 'state':
                if (data.player !== this.playerId) {
                    this.remotePlayers.set(data.player, {
                        score: data.score,
                        alive: data.alive,
                        isAlive: data.alive,
                        isJumping: data.isJumping,
                        isFrozen: data.isFrozen || false,
                        progress: data.progress || 0,
                        name: data.playerName || data.player.substring(0, 8),
                        color: data.color || '#10b981'
                    });
                    this.updateLivePlayersDisplay();
                }
                break;
                
            case 'player_died':
                if (data.playerId !== this.playerId) {
                    const player = this.remotePlayers.get(data.playerId);
                    if (player) {
                        player.isAlive = false;
                        player.alive = false;
                        this.updateLivePlayersDisplay();
                    }
                }
                break;
                
            case 'player_frozen':
                if (data.playerId !== this.playerId) {
                    const player = this.remotePlayers.get(data.playerId);
                    if (player) {
                        player.isFrozen = true;
                        this.updateLivePlayersDisplay();
                    }
                }
                break;
                
            case 'player_unfrozen':
                if (data.playerId !== this.playerId) {
                    const player = this.remotePlayers.get(data.playerId);
                    if (player) {
                        player.isFrozen = false;
                        this.updateLivePlayersDisplay();
                    }
                }
                break;
                
            case 'player_respawned':
                if (data.playerId !== this.playerId) {
                    const player = this.remotePlayers.get(data.playerId);
                    if (player) {
                        player.isAlive = true;
                        player.alive = true;
                        this.updateLivePlayersDisplay();
                    }
                }
                break;
                
            case 'game_settings':
                if (data.settings && !this.isAdmin) {
                    this.gameSettings = { ...data.settings };
                    this.applyDifficultySettings();
                }
                break;
                
            case 'game_finished':
                if (data.winner !== this.playerId) {
                    this.showOtherPlayerWon(data.winnerName || 'Another player');
                }
                break;
                
            case 'admin_status':
                this.isAdmin = data.isAdmin;
                localStorage.setItem('isAdmin', this.isAdmin.toString());
                const adminBtn = document.getElementById('admin-btn');
                if (adminBtn && this.isAdmin) {
                    adminBtn.style.display = 'flex';
                }
                break;
        }
    }
    
    showOtherPlayerWon(winnerName) {
        const overlay = document.createElement('div');
        overlay.className = 'winner-overlay';
        overlay.textContent = `🏆 ${winnerName} Wins! 🏆`;
        overlay.style.background = 'rgba(245, 158, 11, 0.9)';
        document.querySelector('.game-canvas-container').appendChild(overlay);
        
        setTimeout(() => {
            this.endGame();
        }, 3000);
    }
    
    updateConnectionIndicator(connected) {
        const indicator = document.getElementById('mp-connection');
        if (indicator) {
            const dot = indicator.querySelector('.status-dot');
            dot.className = `status-dot ${connected ? 'connected' : 'disconnected'}`;
        }
    }
    
    updateLivePlayersDisplay() {
        if (!this.livePlayersElement) return;
        
        this.livePlayersElement.innerHTML = '';
        
        const allPlayers = [
            {
                id: this.playerId,
                name: this.playerName || 'You',
                score: this.score,
                alive: this.dino.isAlive,
                isFrozen: this.dino.isFrozen,
                color: this.dino.color
            }
        ];
        
        this.remotePlayers.forEach((player, id) => {
            allPlayers.push({
                id,
                name: player.name,
                score: player.score,
                alive: player.alive,
                isFrozen: player.isFrozen || false,
                color: player.color
            });
        });
        
        // Sort by score
        allPlayers.sort((a, b) => b.score - a.score);
        
        allPlayers.forEach((player, index) => {
            const playerElement = document.createElement('div');
            let className = 'live-player';
            if (!player.alive) className += ' dead';
            if (player.isFrozen) className += ' frozen';
            playerElement.className = className;
            
            const dot = document.createElement('div');
            dot.className = 'player-dot';
            if (player.isFrozen) {
                dot.style.background = '#3b82f6'; // Blue for frozen
            } else {
                dot.style.background = player.color;
            }
            
            const info = document.createElement('div');
            info.innerHTML = `
                <div style="font-weight: 500; font-size: 0.75rem;">${player.name}</div>
                <div style="font-size: 0.625rem; color: #6b7280;">${player.score}</div>
            `;
            
            playerElement.appendChild(dot);
            playerElement.appendChild(info);
            this.livePlayersElement.appendChild(playerElement);
            
            // Update rank for current player
            if (player.id === this.playerId && this.playerRankElement) {
                this.playerRankElement.textContent = `#${index + 1}`;
            }
        });
    }
    
    handleKeyDown(e) {
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                if (this.gameOver) {
                    this.restartGame();
                } else {
                    this.jump();
                }
                break;
            case 'KeyP':
                this.togglePause();
                break;
        }
    }
    
    handleKeyUp(e) {
        // Handle key releases if needed
    }
    
    jump() {
        if (!this.gameStarted || this.gamePaused || this.gameOver) return;
        
        if (this.dino.y >= this.GROUND_Y - this.DINO_HEIGHT - 5 && this.dino.isAlive) {
            this.dino.vy = this.JUMP_VELOCITY;
            this.dino.isJumping = true;
            
            // Add jump particle effect
            for (let i = 0; i < 5; i++) {
                this.particles.push({
                    x: this.dino.x + Math.random() * this.DINO_WIDTH,
                    y: this.dino.y,
                    vx: (Math.random() - 0.5) * 4,
                    vy: Math.random() * -3,
                    life: 20,
                    maxLife: 20,
                    color: this.dino.color
                });
            }
        }
    }
    
    togglePause() {
        this.gamePaused = !this.gamePaused;
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.textContent = this.gamePaused ? '▶️' : '⏸️';
        }
    }
    
    update() {
        if (!this.gameStarted || this.gamePaused || this.gameOver) return;
        
        this.frame++;
        
        // Update dino physics
        this.dino.y += this.dino.vy;
        this.dino.vy += this.GRAVITY;
        
        if (this.dino.y >= this.GROUND_Y - this.DINO_HEIGHT) {
            this.dino.y = this.GROUND_Y - this.DINO_HEIGHT; // Sit ON the ground
            this.dino.vy = 0;
            this.dino.isJumping = false;
        }
        
        // Update obstacles (only move if dino is not frozen)
        this.obstacles.forEach(obstacle => {
            if (!this.dino.isFrozen) {
                obstacle.x -= this.OBSTACLE_SPEED * this.speed;
            }
        });
        
        // Remove off-screen obstacles
        this.obstacles = this.obstacles.filter(obstacle => obstacle.x + obstacle.width > -100);
        
        // Add new obstacles (single player only)
        if (!this.isMultiplayer && this.frame % this.OBSTACLE_INTERVAL === 0) {
            if (Math.random() < 0.8) {
                const height = this.OBSTACLE_HEIGHT + Math.random() * 30;
                this.obstacles.push({
                    x: this.canvas.width + 20,
                    y: this.GROUND_Y - height,
                    width: this.OBSTACLE_WIDTH,
                    height: height,
                    type: Math.floor(Math.random() * 3)
                });
            }
        }
        
        // Update clouds (only move if dino is not frozen)
        this.clouds.forEach(cloud => {
            if (!this.dino.isFrozen) {
                cloud.x -= cloud.speed * this.speed;
            }
            if (cloud.x + cloud.size < 0) {
                cloud.x = this.canvas.width + cloud.size;
                cloud.y = 50 + Math.random() * 100;
            }
        });
        
        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.3;
            particle.life--;
            return particle.life > 0;
        });
        
        // Collision detection
        this.checkCollisions();
        
        // Increase difficulty over time
        if (this.frame % 600 === 0) {
            this.speed += 0.1;
            this.OBSTACLE_INTERVAL = Math.max(60, this.OBSTACLE_INTERVAL - 2);
        }
        
        // Update score (only if not frozen)
        if (!this.dino.isFrozen) {
            this.updateScore(this.score + 1);
        }
        
        // Send multiplayer state
        if (this.isMultiplayer && this.ws && this.ws.readyState === WebSocket.OPEN && this.frame % 30 === 0) {
            this.ws.send(JSON.stringify({
                type: 'state',
                player: this.playerId,
                score: this.score,
                alive: this.dino.isAlive,
                isAlive: this.dino.isAlive,
                isJumping: this.dino.isJumping,
                isFrozen: this.dino.isFrozen,
                progress: this.score, // Use score as progress indicator
                playerName: this.playerName,
                color: this.dino.color,
                lobbyId: this.lobbyCode
            }));
        }
    }
    
    checkCollisions() {
        if (!this.dino.isAlive || this.dino.isFrozen) return;
        
        this.obstacles.forEach(obstacle => {
            // More precise collision detection for better alignment
            if (this.dino.x + 8 < obstacle.x + obstacle.width - 3 &&
                this.dino.x + this.DINO_WIDTH - 8 > obstacle.x + 3 &&
                this.dino.y + 8 < obstacle.y + obstacle.height - 3 &&
                this.dino.y + this.DINO_HEIGHT - 8 > obstacle.y + 3) {
                
                // Dino hits obstacle - freeze for 5 seconds
                this.dino.isFrozen = true;
                this.dino.freezeTime = Date.now();
                
                // Show freeze overlay
                this.showFreezeOverlay();
                
                // Add impact particles
                for (let i = 0; i < 12; i++) {
                    this.particles.push({
                        x: this.dino.x + Math.random() * this.DINO_WIDTH,
                        y: this.dino.y + Math.random() * this.DINO_HEIGHT,
                        vx: (Math.random() - 0.5) * 10,
                        vy: Math.random() * -10,
                        color: '#f59e0b',
                        size: 4,
                        life: 40,
                        maxLife: 40
                    });
                }
                
                // Unfreeze after 5 seconds
                setTimeout(() => {
                    if (this.dino.isFrozen && !this.gameOver) {
                        this.unfreezeDino();
                    }
                }, this.dino.freezeDuration);
                
                // Send freeze to multiplayer
                if (this.isMultiplayer && this.ws && this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'player_frozen',
                        playerId: this.playerId,
                        lobbyId: this.lobbyCode
                    }));
                }
            }
        });
        
        // Check for game end conditions
        if (this.gameSettings.hasEndPoint && this.score >= this.gameSettings.endPoint && this.dino.isAlive && !this.dino.isFrozen) {
            this.declareWinner();
        }
    }
    
    showFreezeOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'dino-freeze-overlay';
        overlay.innerHTML = '🧊 FROZEN - 5 seconds!<br><div style="font-size: 0.8em; margin-top: 5px;">Cannot move forward</div>';
        document.querySelector('.game-canvas-container').appendChild(overlay);
        
        // Countdown timer
        let countdown = 5;
        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown > 0) {
                overlay.innerHTML = `🧊 FROZEN - ${countdown} seconds!<br><div style="font-size: 0.8em; margin-top: 5px;">Cannot move forward</div>`;
            } else {
                clearInterval(countdownInterval);
            }
        }, 1000);
        
        setTimeout(() => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            clearInterval(countdownInterval);
        }, this.dino.freezeDuration);
    }
    
    unfreezeDino() {
        this.dino.isFrozen = false;
        this.dino.freezeTime = 0;
        
        // Add unfreeze particles
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.dino.x + this.DINO_WIDTH / 2,
                y: this.dino.y + this.DINO_HEIGHT / 2,
                vx: Math.cos(i * Math.PI / 4) * 8,
                vy: Math.sin(i * Math.PI / 4) * 8,
                color: '#22c55e',
                size: 5,
                life: 30,
                maxLife: 30
            });
        }
        
        // Send unfreeze to multiplayer
        if (this.isMultiplayer && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'player_unfrozen',
                playerId: this.playerId,
                lobbyId: this.lobbyCode
            }));
        }
    }
    
    declareWinner() {
        this.gameFinished = true;
        this.winner = this.playerId;
        
        const overlay = document.createElement('div');
        overlay.className = 'winner-overlay';
        overlay.textContent = '🏆 YOU WIN! 🏆';
        document.querySelector('.game-canvas-container').appendChild(overlay);
        
        if (this.isMultiplayer && this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'game_finished',
                winner: this.playerId,
                winnerName: this.playerName,
                lobbyId: this.lobbyCode
            }));
        }
        
        setTimeout(() => {
            this.endGame();
        }, 3000);
    }
    
    draw() {
        // Clear canvas with gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#98FB98');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw clouds
        this.drawClouds();
        
        // Draw ground
        this.drawGround();
        
        // Draw obstacles
        this.drawObstacles();
        
        // Draw particles
        this.drawParticles();
        
        // Draw dino
        this.drawDino();
        
        // Draw other players' dinos in multiplayer
        if (this.isMultiplayer) {
            this.drawMultiplayerDinos();
        }
        
        // Draw pause indicator
        if (this.gamePaused) {
            this.drawPauseScreen();
        }
        
        // Draw progress bar for races with endpoints
        if (this.gameSettings.hasEndPoint && this.isMultiplayer) {
            this.drawProgressBar();
        }
    }
    
    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.clouds.forEach(cloud => {
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.size * 0.6, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.size * 0.4, cloud.y - cloud.size * 0.2, cloud.size * 0.5, 0, Math.PI * 2);
            this.ctx.arc(cloud.x + cloud.size * 0.8, cloud.y, cloud.size * 0.6, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawGround() {
        // Ground
        this.ctx.fillStyle = '#8FBC8F';
        this.ctx.fillRect(0, this.GROUND_Y, this.canvas.width, this.canvas.height - this.GROUND_Y);
        
        // Ground line
        this.ctx.strokeStyle = '#228B22';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.GROUND_Y);
        this.ctx.lineTo(this.canvas.width, this.GROUND_Y);
        this.ctx.stroke();
        
        // Ground pattern (stop moving when frozen)
        this.ctx.fillStyle = this.dino.isFrozen ? 'rgba(59, 130, 246, 0.3)' : 'rgba(34, 139, 34, 0.3)';
        for (let i = 0; i < this.canvas.width; i += 40) {
            const offset = this.dino.isFrozen ? 0 : (this.frame * this.speed) % 40;
            this.ctx.fillRect(i - offset, this.GROUND_Y + 10, 20, 5);
        }
    }
    
    drawObstacles() {
        this.obstacles.forEach(obstacle => {
            this.ctx.save();
            this.ctx.translate(obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2);
            
            switch (obstacle.type) {
                case 0: // Cactus
                    this.drawCactus(obstacle.width, obstacle.height);
                    break;
                case 1: // Rock
                    this.drawRock(obstacle.width, obstacle.height);
                    break;
                case 2: // Tree
                    this.drawTree(obstacle.width, obstacle.height);
                    break;
                default:
                    this.drawCactus(obstacle.width, obstacle.height);
            }
            
            this.ctx.restore();
        });
    }
    
    drawCactus(width, height) {
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(-width / 2, -height / 2, width, height);
        this.ctx.fillStyle = '#006400';
        this.ctx.fillRect(-width / 3, -height / 2 - 10, width / 2, 15);
        this.ctx.fillRect(0, -height / 3, width / 3, 20);
    }
    
    drawRock(width, height) {
        this.ctx.fillStyle = '#696969';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#A9A9A9';
        this.ctx.beginPath();
        this.ctx.ellipse(-width / 4, -height / 4, width / 4, height / 4, 0, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawTree(width, height) {
        // Trunk
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(-width / 4, -height / 4, width / 2, height / 2);
        // Leaves
        this.ctx.fillStyle = '#228B22';
        this.ctx.beginPath();
        this.ctx.arc(0, -height / 3, width / 2, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawDino() {
        const bounceOffset = this.dino.isJumping ? Math.sin(this.frame * 0.5) * 2 : 0;
        
        this.ctx.save();
        this.ctx.translate(this.dino.x + this.DINO_WIDTH / 2, this.dino.y + this.DINO_HEIGHT / 2 + bounceOffset);
        
        // Dino body
        this.ctx.fillStyle = this.dino.color;
        this.ctx.fillRect(-this.DINO_WIDTH / 2, -this.DINO_HEIGHT / 2, this.DINO_WIDTH, this.DINO_HEIGHT);
        
        // Eye
        this.ctx.fillStyle = '#fff';
        this.ctx.fillRect(this.DINO_WIDTH / 4, -this.DINO_HEIGHT / 3, 8, 8);
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(this.DINO_WIDTH / 4 + 2, -this.DINO_HEIGHT / 3 + 2, 4, 4);
        
        // Legs animation (stop animation if frozen)
        if (!this.dino.isJumping && !this.dino.isFrozen) {
            const legOffset = Math.sin(this.frame * 0.3) * 3;
            this.ctx.fillStyle = this.dino.color;
            this.ctx.fillRect(-this.DINO_WIDTH / 3, this.DINO_HEIGHT / 3 + legOffset, 10, 8);
            this.ctx.fillRect(this.DINO_WIDTH / 6, this.DINO_HEIGHT / 3 - legOffset, 10, 8);
        } else if (this.dino.isFrozen) {
            // Static legs when frozen
            this.ctx.fillStyle = this.dino.color;
            this.ctx.fillRect(-this.DINO_WIDTH / 3, this.DINO_HEIGHT / 3, 10, 8);
            this.ctx.fillRect(this.DINO_WIDTH / 6, this.DINO_HEIGHT / 3, 10, 8);
        }
        
        // Frozen effect
        if (this.dino.isFrozen) {
            // Blue ice overlay
            this.ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
            this.ctx.fillRect(-this.DINO_WIDTH / 2, -this.DINO_HEIGHT / 2, this.DINO_WIDTH, this.DINO_HEIGHT);
            
            // Ice crystals effect
            this.ctx.strokeStyle = 'rgba(147, 197, 253, 0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            // Draw ice crystal pattern
            for (let i = 0; i < 6; i++) {
                const angle = (i * Math.PI) / 3;
                const x1 = Math.cos(angle) * 15;
                const y1 = Math.sin(angle) * 15;
                const x2 = Math.cos(angle) * 25;
                const y2 = Math.sin(angle) * 25;
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x2, y2);
            }
            this.ctx.stroke();
        }
        
        // Death effect
        if (!this.dino.isAlive) {
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            this.ctx.fillRect(-this.DINO_WIDTH / 2, -this.DINO_HEIGHT / 2, this.DINO_WIDTH, this.DINO_HEIGHT);
        }
        
        this.ctx.restore();
    }
    
    drawMultiplayerDinos() {
        this.remotePlayers.forEach((player, playerId) => {
            if (playerId === this.playerId) return; // Don't draw own dino twice
            
            // Calculate relative position based on score difference
            const scoreDiff = player.score - this.score;
            const dinoX = 100 + (scoreDiff * 2); // 2 pixels per score point difference
            const dinoY = player.isJumping ? this.GROUND_Y - this.DINO_HEIGHT - 60 : this.GROUND_Y - this.DINO_HEIGHT;
            const bounceOffset = player.isJumping ? Math.sin(this.frame * 0.5) * 2 : 0;
            
            // Only draw if the dino is visible on screen
            if (dinoX > -50 && dinoX < this.canvas.width + 50) {
                this.ctx.save();
                this.ctx.translate(dinoX + this.DINO_WIDTH / 2, dinoY + this.DINO_HEIGHT / 2 + bounceOffset);
                
                // Player dino body
                this.ctx.fillStyle = player.color || '#2563eb';
                this.ctx.fillRect(-this.DINO_WIDTH / 2, -this.DINO_HEIGHT / 2, this.DINO_WIDTH, this.DINO_HEIGHT);
                
                // Eye
                this.ctx.fillStyle = '#fff';
                this.ctx.fillRect(this.DINO_WIDTH / 4, -this.DINO_HEIGHT / 3, 8, 8);
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(this.DINO_WIDTH / 4 + 2, -this.DINO_HEIGHT / 3 + 2, 4, 4);
                
                // Legs animation
                if (!player.isJumping && !player.isFrozen) {
                    const legOffset = Math.sin(this.frame * 0.3) * 3;
                    this.ctx.fillStyle = player.color || '#2563eb';
                    this.ctx.fillRect(-this.DINO_WIDTH / 3, this.DINO_HEIGHT / 3 + legOffset, 10, 8);
                    this.ctx.fillRect(this.DINO_WIDTH / 6, this.DINO_HEIGHT / 3 - legOffset, 10, 8);
                } else if (player.isFrozen) {
                    // Static legs when frozen
                    this.ctx.fillStyle = player.color || '#2563eb';
                    this.ctx.fillRect(-this.DINO_WIDTH / 3, this.DINO_HEIGHT / 3, 10, 8);
                    this.ctx.fillRect(this.DINO_WIDTH / 6, this.DINO_HEIGHT / 3, 10, 8);
                }
                
                // Frozen effect for other players
                if (player.isFrozen) {
                    this.ctx.fillStyle = 'rgba(59, 130, 246, 0.4)';
                    this.ctx.fillRect(-this.DINO_WIDTH / 2, -this.DINO_HEIGHT / 2, this.DINO_WIDTH, this.DINO_HEIGHT);
                    
                    // Ice crystals effect
                    this.ctx.strokeStyle = 'rgba(147, 197, 253, 0.8)';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    for (let i = 0; i < 6; i++) {
                        const angle = (i * Math.PI) / 3;
                        const x1 = Math.cos(angle) * 15;
                        const y1 = Math.sin(angle) * 15;
                        const x2 = Math.cos(angle) * 25;
                        const y2 = Math.sin(angle) * 25;
                        this.ctx.moveTo(x1, y1);
                        this.ctx.lineTo(x2, y2);
                    }
                    this.ctx.stroke();
                }
                
                // Death effect
                if (!player.isAlive) {
                    this.ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                    this.ctx.fillRect(-this.DINO_WIDTH / 2, -this.DINO_HEIGHT / 2, this.DINO_WIDTH, this.DINO_HEIGHT);
                    
                    // Add X mark for dead dino
                    this.ctx.strokeStyle = '#fff';
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(-15, -15);
                    this.ctx.lineTo(15, 15);
                    this.ctx.moveTo(15, -15);
                    this.ctx.lineTo(-15, 15);
                    this.ctx.stroke();
                }
                
                this.ctx.restore();
                
                // Draw player name label
                this.ctx.save();
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                const labelWidth = this.ctx.measureText(player.name || 'Player').width + 10;
                this.ctx.fillRect(dinoX + this.DINO_WIDTH/2 - labelWidth/2, dinoY - 35, labelWidth, 18);
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '12px Inter';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(player.name || 'Player', dinoX + this.DINO_WIDTH/2, dinoY - 23);
                
                // Draw score below name
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
                this.ctx.fillRect(dinoX + this.DINO_WIDTH/2 - 20, dinoY - 15, 40, 14);
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '10px Inter';
                this.ctx.fillText(player.score.toString(), dinoX + this.DINO_WIDTH/2, dinoY - 7);
                this.ctx.restore();
            }
        });
        
        // Draw race track lanes for multiplayer
        if (this.isMultiplayer) {
            this.drawRaceLanes();
        }
    }
    
    drawRaceLanes() {
        // Draw subtle lane dividers
        const laneHeight = this.canvas.height / 8;
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 10]);
        
        for (let i = 1; i < 8; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * laneHeight);
            this.ctx.lineTo(this.canvas.width, i * laneHeight);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }
    
    drawProgressBar() {
        const barWidth = this.canvas.width - 100;
        const barHeight = 20;
        const barX = 50;
        const barY = 20;
        
        // Background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Progress for current player
        const progress = Math.min(this.score / this.gameSettings.endPoint, 1);
        this.ctx.fillStyle = this.dino.color;
        this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);
        
        // Progress for other players
        this.remotePlayers.forEach((player, playerId) => {
            const playerProgress = Math.min(player.score / this.gameSettings.endPoint, 1);
            const playerY = barY + 25 + Array.from(this.remotePlayers.keys()).indexOf(playerId) * 8;
            
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.fillRect(barX, playerY, barWidth, 6);
            
            this.ctx.fillStyle = player.color || '#2563eb';
            this.ctx.fillRect(barX, playerY, barWidth * playerProgress, 6);
        });
        
        // Endpoint line
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(barX + barWidth - 1, barY - 5);
        this.ctx.lineTo(barX + barWidth - 1, barY + barHeight + 50);
        this.ctx.stroke();
        
        // Labels
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Inter';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Race Progress', barX, barY - 5);
        
        this.ctx.font = '12px Inter';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Goal: ${this.gameSettings.endPoint}`, barX + barWidth, barY - 5);
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
    
    drawPauseScreen() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 48px Inter';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        
        this.ctx.font = '20px Inter';
        this.ctx.fillText('Press P to resume', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
    
    updateScore(newScore) {
        this.score = newScore;
        this.scoreElement.textContent = this.score;
        
        if (this.score > this.highScore) {
            this.highScore = this.score;
            this.highScoreElement.textContent = this.highScore;
            localStorage.setItem('highScore', this.highScore.toString());
        }
    }
    
    endGame() {
        this.gameOver = true;
        this.finalScoreElement.textContent = this.score;
        
        // Show game over overlay with animation
        setTimeout(() => {
            this.gameOverlay.classList.add('show');
        }, 500);
        
        // Update live players one more time
        if (this.isMultiplayer) {
            this.updateLivePlayersDisplay();
        }
    }
    
    restartGame() {
        // Reset game state
        this.gameOver = false;
        this.gamePaused = false;
        this.score = 0;
        this.frame = 0;
        this.speed = 1;
        
        // Reset dino
        this.dino.y = this.GROUND_Y;
        this.dino.vy = 0;
        this.dino.isJumping = false;
        this.dino.isAlive = true;
        
        // Clear obstacles and particles
        if (!this.isMultiplayer || !this.gameSeed) {
            this.obstacles = [];
        } else {
            this.generateObstaclesFromSeed();
        }
        this.particles = [];
        
        // Hide overlay
        this.gameOverlay.classList.remove('show');
        
        // Update UI
        this.updateScore(0);
        
        // Reset pause button
        const pauseBtn = document.getElementById('pause-btn');
        if (pauseBtn) {
            pauseBtn.textContent = '⏸️';
        }
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Detect mobile
    if (window.innerWidth <= 768) {
        document.getElementById('mobile-instruction').style.display = 'flex';
        const desktopInstructions = document.querySelectorAll('.instruction:not(#mobile-instruction)');
        desktopInstructions.forEach(el => el.style.display = 'none');
    }
    
    window.dinoGame = new DinoGame();
});