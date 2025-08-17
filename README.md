# Dino Run - Multiplayer Racing Game

A modern, professional multiplayer Chrome-style Dino game with real-time WebSocket racing.

🎮 **[Live Demo on Netlify](https://your-dino-game.netlify.app)** (Add your URL after deployment)

## Features

- 🏃 **Single Player Mode**: Classic endless runner with high scores
- 🏁 **Multiplayer Racing**: Real-time races with up to 8 players
- 🎨 **Customization**: Choose your dino color and name
- 🏆 **Live Leaderboard**: See rankings in real-time during races
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ⚡ **Professional UI**: Modern, attractive interface with animations
- 🧊 **Smart Collision**: 5-second freeze instead of game over

## 🚀 Netlify Deployment Guide

### Frontend Deployment (Netlify)
1. **Fork/Clone this repository**
2. **Connect to Netlify**:
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub account and select the repository
   - Netlify will auto-detect build settings:
     - Build command: `npm run build`
     - Publish directory: `dist`
   - Deploy the site
3. **Domain**: Your game will be live at `https://your-project.netlify.app`

### WebSocket Server Deployment Options

Since Netlify doesn't support WebSocket servers, choose one of these options:

#### Option A: Railway (Recommended)
1. Go to [railway.app](https://railway.app)
2. Connect your GitHub repository  
3. Add environment variable: `PORT=8080`
4. Deploy - Railway will automatically detect Node.js
5. Get your WebSocket URL: `wss://your-app.railway.app`

#### Option B: Render
1. Go to [render.com](https://render.com)
2. Create new Web Service from your repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Get your WebSocket URL: `wss://your-app.onrender.com`

#### Option C: Heroku
1. Install Heroku CLI
2. `heroku create your-dino-server`
3. `git push heroku main`
4. Get WebSocket URL: `wss://your-dino-server.herokuapp.com`

### Update WebSocket URL

After deploying your WebSocket server, update the connection URL in your code:

1. **Edit `game.js`** (line ~262):
```javascript
// Replace localhost with your deployed WebSocket URL
this.ws = new WebSocket('wss://your-websocket-server.railway.app');
```

2. **Edit `lobby.js`** (similar update needed)

## 🎮 Local Development

```bash
# Install dependencies
npm install

# Start WebSocket server
npm start

# Serve static files (in another terminal)
python -m http.server 3000

# Open http://localhost:3000
```

## Game Architecture

- **Frontend**: Pure HTML5/CSS3/JavaScript (deployed on Vercel)
- **WebSocket Server**: Node.js with 'ws' library (deployed separately)
- **Real-time Sync**: Deterministic RNG for synchronized multiplayer
- **State Management**: WebSocket message passing for game events

## How to Play

### Single Player
1. Click "Single Player" on the home page
2. Press SPACE or tap to jump over obstacles
3. Hitting obstacles freezes you for 5 seconds (no game over!)
4. Try to beat your high score!

### Multiplayer
1. Click "Multiplayer" on the home page
2. Enter your name and choose a dino color
3. Create a new lobby or join with a friend's lobby code
4. Wait for other players and click "Ready Up!"
5. Host can configure difficulty and race endpoints in admin settings (⚙️)
6. Race against friends on the same obstacle course!

## Admin Controls (Host Only)

- **Difficulty Settings**: Easy, Medium, Hard, Extreme
- **Race Mode**: Set endpoint scores for competitive races
- **Real-time Updates**: Settings sync to all players instantly

## Browser Compatibility

- ✅ Chrome/Edge: Full support
- ✅ Firefox: Full support  
- ✅ Safari: Full support
- ✅ Mobile browsers: Touch controls supported

## Tech Stack

- **Frontend**: HTML5 Canvas, CSS3, Vanilla JavaScript
- **Backend**: Node.js, WebSocket (ws library)
- **Deployment**: Vercel (frontend) + Railway/Render (backend)
- **Real-time**: WebSocket connections for multiplayer sync

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this code for your own projects!

---

🦕 **Happy Racing!** Enjoy playing the enhanced multiplayer Dino game!
