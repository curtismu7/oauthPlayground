const express = require('express');
const router = express.Router();
const oauthService = require('../services/oauthService');
const dataStore = require('../data/store');
const { determineClientType } = require('../middleware/auth');

/**
 * Initiate OAuth login for lending users
 * Redirects to P1AIC authorization endpoint
 */
router.get('/login', (req, res) => {
  try {
    // Generate state parameter for CSRF protection
    const state = oauthService.generateState();
    
    // Store state in session
    req.session.oauthState = state;
    
    // Generate authorization URL
    const authUrl = oauthService.generateAuthorizationUrl(state);
    
    // Redirect to P1AIC
    res.redirect(authUrl);
  } catch (error) {
    console.error('OAuth login error:', error);
    res.status(500).json({ error: 'Failed to initiate OAuth login' });
  }
});

/**
 * OAuth callback handler
 * Receives authorization code from P1AIC and exchanges it for tokens
 */
router.get('/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    // Check for OAuth errors
    if (error) {
      console.error('OAuth error:', error);
      const frontendUrl = process.env.REACT_APP_CLIENT_URL || 'http://localhost:3003';
      return res.redirect(`${frontendUrl}/login?error=oauth_error`);
    }

    // Validate state parameter
    if (!state || state !== req.session.oauthState) {
      console.error('Invalid state parameter');
      const frontendUrl = process.env.REACT_APP_CLIENT_URL || 'http://localhost:3003';
      return res.redirect(`${frontendUrl}/login?error=invalid_state`);
    }

    // Clear state from session
    delete req.session.oauthState;

    // Exchange authorization code for access token
    const tokenData = await oauthService.exchangeCodeForToken(code);
    
    // Get user information from P1AIC
    const userInfo = await oauthService.getUserInfo(tokenData.access_token);
    console.log('User info from P1AIC:', JSON.stringify(userInfo, null, 2));
    
    // Create user object from OAuth data
    const oauthUser = oauthService.createUserFromOAuth(userInfo);
    
    // Check if user already exists in our system
    let user = dataStore.getUserByUsername(oauthUser.username);
    console.log('Looking for existing user:', oauthUser.username);
    console.log('Found user:', user);
    
    if (!user) {
      // For OAuth users, we'll create them as lending_officer by default
      // In production, you might want to check a whitelist or specific P1AIC attributes
      console.log('Creating new OAuth user as lending_officer:', oauthUser.username);
      oauthUser.role = 'lending_officer'; // Make OAuth users lending_officer by default
    } else {
      console.log('Found existing user:', user.username, 'with role:', user.role);
      // Preserve the existing role (especially admin role)
      oauthUser.role = user.role;
    }
    
    if (!user) {
      // Create new user from OAuth data
      console.log('Creating new user with data:', oauthUser);
      user = await dataStore.createUser({
        ...oauthUser,
        password: null // OAuth users don't have passwords
      });
      console.log('Created user:', user);
    } else {
      // Update existing user with OAuth data
      console.log('Updating existing user with data:', {
        email: oauthUser.email,
        firstName: oauthUser.firstName,
        lastName: oauthUser.lastName,
        role: oauthUser.role,
        oauthProvider: oauthUser.oauthProvider,
        oauthId: oauthUser.oauthId
      });
      user = await dataStore.updateUser(user.id, {
        email: oauthUser.email,
        firstName: oauthUser.firstName,
        lastName: oauthUser.lastName,
        role: oauthUser.role,
        oauthProvider: oauthUser.oauthProvider,
        oauthId: oauthUser.oauthId
      });
      console.log('Updated user:', user);
    }

    // Store OAuth tokens directly in session (no JWT generation)
    req.session.oauthTokens = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: Date.now() + (tokenData.expires_in * 1000),
      tokenType: tokenData.token_type || 'Bearer'
    };

    // Determine client type from the original OAuth token
    const clientType = determineClientType(tokenData.access_token);
    
    // Store user and client type in session (no JWT token generation)
    req.session.user = user;
    req.session.clientType = clientType;

    // Redirect to lending dashboard
    const dashboardUrl = process.env.FRONTEND_LENDING_URL || 'http://localhost:3003/dashboard';
    res.redirect(`${dashboardUrl}?oauth=success`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    const frontendUrl = process.env.REACT_APP_CLIENT_URL || 'http://localhost:3003';
    res.redirect(`${frontendUrl}/login?error=callback_failed`);
  }
});

/**
 * Logout - clear session and redirect to login (GET for browser redirects)
 */
router.get('/logout', (req, res) => {
  console.log('GET /logout - Clearing session and redirecting');
  
  // Clear session
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
    }
    
    // Redirect to login page
    const frontendUrl = process.env.REACT_APP_CLIENT_URL || 'http://localhost:3003';
    res.redirect(`${frontendUrl}/login`);
  });
});

/**
 * Logout - clear session (POST for API calls)
 */
router.post('/logout', (req, res) => {
  console.log('POST /logout - Clearing session for API call');
  
  // Clear session
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
      return res.status(500).json({ 
        error: 'logout_failed',
        error_description: 'Failed to destroy session',
        timestamp: new Date().toISOString()
      });
    }
    
    console.log('✅ Session destroyed successfully');
    
    // Return success response for API calls
    res.json({
      success: true,
      message: 'Logged out successfully',
      timestamp: new Date().toISOString()
    });
  });
});

/**
 * Get current OAuth session status
 */
router.get('/status', (req, res) => {
  const isAuthenticated = req.session.user && req.session.oauthTokens?.accessToken;
  
  res.json({
    authenticated: isAuthenticated,
    user: isAuthenticated ? {
      id: req.session.user.id,
      username: req.session.user.username,
      email: req.session.user.email,
      firstName: req.session.user.firstName,
      lastName: req.session.user.lastName,
      role: req.session.user.role
    } : null,
    oauthProvider: isAuthenticated ? req.session.user.oauthProvider : null,
    accessToken: isAuthenticated ? req.session.oauthTokens.accessToken : null,
    tokenType: isAuthenticated ? req.session.oauthTokens.tokenType : null,
    expiresAt: isAuthenticated ? req.session.oauthTokens.expiresAt : null,
    clientType: isAuthenticated ? req.session.clientType : null
  });
});

/**
 * Refresh OAuth tokens if needed
 */
router.post('/refresh', async (req, res) => {
  try {
    if (!req.session.oauthTokens?.refreshToken) {
      return res.status(401).json({ error: 'No refresh token available' });
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const expiresAt = req.session.oauthTokens.expiresAt;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    if (expiresAt - now > fiveMinutes) {
      return res.json({ message: 'Token is still valid' });
    }

    // TODO: Implement token refresh logic
    // This would require implementing the refresh token flow with P1AIC
    
    res.json({ message: 'Token refresh not yet implemented' });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});

module.exports = router;