# Vercel Deployment Checklist

## ✅ Pre-Deployment Steps

1. **Test locally**: Ensure everything works on localhost
2. **Update package.json**: ✅ Done
3. **Create vercel.json**: ✅ Done  
4. **Add config.js**: ✅ Done
5. **Update WebSocket URLs**: ✅ Done (uses config)
6. **Create .gitignore**: ✅ Done
7. **Update README.md**: ✅ Done

## 🚀 Deployment Process

### Step 1: Deploy Frontend to Vercel
1. Push code to GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "New Project" 
4. Import your GitHub repository
5. Vercel will auto-detect the configuration
6. Click "Deploy"
7. Your frontend will be live at: `https://your-project.vercel.app`

### Step 2: Deploy WebSocket Server

#### Option A: Railway (Recommended)
1. Go to [railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Railway will auto-deploy the Node.js server
6. Note your Railway URL: `https://your-app.railway.app`

#### Option B: Render
1. Go to [render.com](https://render.com)  
2. Connect GitHub account
3. Create "Web Service" from your repo
4. Set:
   - Build Command: `npm install`
   - Start Command: `npm start`
5. Note your Render URL: `https://your-app.onrender.com`

### Step 3: Update WebSocket Configuration
1. Edit `config.js` line 4:
```javascript
? 'wss://your-actual-server.railway.app' // Replace with your WebSocket URL
```
2. Commit and push changes
3. Vercel will auto-redeploy

## 🎯 Post-Deployment

### Testing
- [ ] Single player mode works
- [ ] Multiplayer lobby connects  
- [ ] Real-time racing functions
- [ ] Mobile responsiveness
- [ ] Admin controls work

### Optional Enhancements
- [ ] Custom domain setup
- [ ] SSL certificate (auto with Vercel)
- [ ] Performance monitoring
- [ ] Analytics integration

## 📋 Environment URLs

After deployment, update these:

- **Frontend (Vercel)**: `https://your-project.vercel.app`
- **WebSocket Server**: `wss://your-websocket-server.railway.app`
- **Repository**: `https://github.com/yourusername/dino-game-2.0`

## 🔧 Troubleshooting

### Common Issues:
1. **WebSocket connection fails**: Check HTTPS/WSS protocol matching
2. **CORS errors**: Ensure both frontend and backend use HTTPS in production
3. **Mobile not working**: Test touch controls and responsive design
4. **Multiplayer sync issues**: Verify WebSocket server is running

### Debug Commands:
```bash
# Test WebSocket server locally
npm start

# Check deployment logs
vercel logs --app=your-project

# Test production WebSocket
# Open browser console on your site and run:
# new WebSocket('wss://your-websocket-server.railway.app')
```

## 🎉 Success!

Once deployed, your enhanced multiplayer Dino game will be live and accessible worldwide!
