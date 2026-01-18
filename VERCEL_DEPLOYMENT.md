# Vercel Deployment Guide

## 🚀 Quick Deployment

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   # First deployment (follow prompts)
   vercel
   
   # Production deployment
   vercel --prod
   ```

### Option 2: Deploy via GitHub Integration

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect the configuration
   - Click "Deploy"

## 🔧 Configuration

### Environment Variables

Add these in Vercel Dashboard → Settings → Environment Variables:

**Optional (can be configured in UI):**
- `PINGONE_ENVIRONMENT_ID` - Your PingOne Environment ID
- `PINGONE_CLIENT_ID` - OAuth Client ID
- `PINGONE_CLIENT_SECRET` - OAuth Client Secret (sensitive!)
- `PINGONE_REDIRECT_URI` - e.g., `https://your-app.vercel.app/callback`
- `PINGONE_LOGOUT_REDIRECT_URI` - e.g., `https://your-app.vercel.app`

**App Configuration:**
- `PINGONE_APP_TITLE` - Default: "OAuth Playground"
- `PINGONE_APP_DESCRIPTION` - Default: "Interactive playground for OAuth 2.0 and OpenID Connect"
- `PINGONE_APP_VERSION` - Default: from package.json
- `PINGONE_APP_DEFAULT_THEME` - Default: "light"

**Feature Flags:**
- `PINGONE_FEATURE_DEBUG_MODE` - Default: "false"
- `PINGONE_FEATURE_ANALYTICS` - Default: "true"

### Build Settings

Vercel will automatically detect these from `vercel.json`, but you can verify:

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`
- **Node Version:** 18.x

## 📁 Project Structure

```
pingone-oauth-playground/
├── api/                      # Vercel Serverless Functions
│   ├── token-exchange.js    # OAuth token exchange endpoint
│   └── pingone/
│       └── [...path].js     # PingOne API proxy
├── dist/                     # Build output (auto-generated)
├── src/                      # Frontend source code
├── vercel.json              # Vercel configuration
├── .vercelignore            # Files to exclude from deployment
└── package.json             # Dependencies and scripts
```

## 🔐 Security Notes

1. **Never commit `.env` files** - Use Vercel's Environment Variables instead
2. **Client Secret** - Mark as "Secret" in Vercel to hide in logs
3. **CORS** - API routes are configured with CORS headers for your domain
4. **HTTPS** - Vercel provides automatic HTTPS for all deployments

## 🌐 Custom Domain

1. Go to Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Update `PINGONE_REDIRECT_URI` to use your custom domain

## 🔄 Updates and Rollbacks

### Auto-Deploy
- Push to `main` branch → automatic production deployment
- Push to other branches → preview deployments

### Manual Rollback
1. Go to Vercel Dashboard → Deployments
2. Find the deployment you want to rollback to
3. Click "..." → "Promote to Production"

## 🐛 Troubleshooting

### Build Fails
- Check build logs in Vercel Dashboard
- Verify all dependencies are in `package.json`
- Ensure Node version is 18.x

### API Routes Not Working
- Check `/api/token-exchange` and `/api/pingone/*` are accessible
- Verify CORS headers in browser dev tools
- Check Vercel Function logs

### Environment Variables Not Working
- Ensure variables are added in Vercel Dashboard
- Redeploy after adding new variables
- Variables starting with `PINGONE_` are exposed to the client

## 📊 Monitoring

- **Analytics:** Vercel Dashboard → Analytics
- **Logs:** Vercel Dashboard → Deployments → Select deployment → Function logs
- **Performance:** Vercel Dashboard → Speed Insights

## 🎯 Next Steps

1. Deploy to Vercel
2. Configure environment variables
3. Test OAuth flows
4. (Optional) Add custom domain
5. Monitor usage and performance

## 📞 Support

- Vercel Docs: https://vercel.com/docs
- PingOne Docs: https://apidocs.pingidentity.com
- Project Issues: [GitHub Issues](https://github.com/your-repo/issues)
