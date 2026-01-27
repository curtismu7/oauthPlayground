// Debug script to check device authorization polling status
// Run this in the browser console when on the device authorization flow page

console.log('=== Device Authorization Polling Debug ===');

// Check if we're on the right page
if (window.location.pathname.includes('device-authorization')) {
    console.log('✅ On device authorization page');
    
    // Check localStorage for device flow data
    const deviceCodeData = localStorage.getItem('device_flow_device_code');
    const tokens = localStorage.getItem('device_flow_tokens');
    const credentials = localStorage.getItem('device_flow_credentials');
    
    console.log('📱 Device Code Data:', deviceCodeData ? JSON.parse(deviceCodeData) : null);
    console.log('🔑 Tokens:', tokens ? JSON.parse(tokens) : null);
    console.log('👤 Credentials:', credentials ? JSON.parse(credentials) : null);
    
    // Check if polling should be active
    if (deviceCodeData && !tokens) {
        console.log('⚠️ Should be polling but no tokens found');
        
        // Check for any polling-related intervals
        const intervalCount = setInterval(() => {}, 0);
        clearInterval(intervalCount);
        console.log(`🔄 Active intervals: ${intervalCount + 1} (should be 0)`);
        
        // Try to manually trigger a poll
        console.log('🔧 Attempting to manually trigger polling...');
        
        // Get the current device code data
        const deviceData = JSON.parse(deviceCodeData);
        console.log('📋 Device Data:', {
            device_code: deviceData.device_code?.substring(0, 10) + '...',
            user_code: deviceData.user_code,
            expires_in: deviceData.expires_in,
            interval: deviceData.interval,
            verification_uri: deviceData.verification_uri
        });
        
        // Check if expired
        const expiresAt = deviceData.timestamp + (deviceData.expires_in * 1000);
        const isExpired = Date.now() > expiresAt;
        console.log('⏰ Expiration:', {
            expiresAt: new Date(expiresAt),
            currentTime: new Date(),
            isExpired: isExpired,
            timeRemaining: Math.max(0, expiresAt - Date.now()) + 'ms'
        });
        
        if (!isExpired && credentials) {
            const creds = JSON.parse(credentials);
            console.log('🔍 Ready to poll with credentials:', {
                clientId: creds.clientId,
                environmentId: creds.environmentId,
                hasDeviceCode: !!deviceData.device_code,
                interval: deviceData.interval + 's'
            });
        }
    } else if (tokens) {
        console.log('✅ Tokens found - authorization completed');
    } else {
        console.log('❌ No device code data found');
    }
} else {
    console.log('❌ Not on device authorization page');
}

console.log('=== End Debug ===');
