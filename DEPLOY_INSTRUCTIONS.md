# Deploy WebSocket Server for Multiplayer Dino Game

Your Netlify frontend is working at: **https://multidino.netlify.app/**

To enable multiplayer functionality, you need to deploy the WebSocket server separately.

## Option 1: Railway Deployment (Recommended)

1. Go to [railway.app](https://railway.app)
2. Sign up/Login with GitHub
3. Click "Deploy from GitHub repo"
4. Connect your `Dino-game-multiplayer` repository
5. Railway will automatically detect the `Procfile` and `railway.json` 
6. Click "Deploy"
7. Once deployed, copy the Railway URL (format: `https://your-project-name.railway.app`)

## Option 2: Render Deployment

1. Go to [render.com](https://render.com)
2. Sign up/Login with GitHub
3. Click "New Web Service"
4. Connect your `Dino-game-multiplayer` repository
5. Use these settings:
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Environment Variables**: 
     - `PORT`: (leave empty, Render will set automatically)
     - `NODE_ENV`: `production`

## Option 3: Heroku Deployment

1. Go to [heroku.com](https://heroku.com)
2. Create new app
3. Connect GitHub repository
4. Deploy from `main` branch
5. The `Procfile` is already configured

## After Deployment:

1. Copy your deployed server URL
2. Update `config.js` with the new URL
3. Commit and push changes to update Netlify
4. Test multiplayer functionality

## Current Status:
- ✅ Netlify frontend: https://multidino.netlify.app/
- ⏳ WebSocket server: Need to deploy
- ⏳ Config update: After server deployment

## Test Local First:
```bash
npm start
# Test at http://localhost:3000
```
