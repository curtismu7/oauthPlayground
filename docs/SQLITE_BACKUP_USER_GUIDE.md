# SQLite Backup User Guide

## Overview

The OAuth Playground now includes comprehensive SQLite backup functionality for all Production apps, ensuring data persistence across browser sessions, device restarts, and server maintenance windows.

## 🎯 What This Means for Users

### **Automatic Data Persistence**
- **Cross-Session Survival**: Your credentials and settings persist when you close and reopen your browser
- **Server Restart Resilience**: Data survives server restarts and maintenance windows
- **Device Synchronization**: Work seamlessly across different devices and browsers
- **Environment Isolation**: Data is properly separated between different environments (dev, staging, prod)

### **4-Layer Storage Architecture**

1. **Memory Cache** - Instant access during active session
2. **localStorage** - Browser-based persistence for quick reloads
3. **IndexedDB** - Enhanced browser storage for larger datasets
4. **SQLite Backup** - Server-side persistence for ultimate reliability

## 📱 Production Apps with SQLite Backup

All Production menu group apps now include SQLite backup:

| App | Path | Backup Type | Data Stored |
|-----|------|-------------|-------------|
| **Unified MFA** | `/v8/unified-mfa` | MFA Credentials | Environment ID, authentication state |
| **Unified OAuth** | `/v8u/unified` | OAuth Credentials | Client credentials, tokens, configuration |
| **Delete All Devices** | `/v8/delete-all-devices` | Worker Token | Worker token credentials, environment data |
| **Token Monitoring** | `/v8u/token-monitoring` | Worker Token | Token monitoring configuration |
| **Enhanced State Management** | `/v8u/enhanced-state-management` | OAuth Credentials | State management data |
| **Protect Portal App** | `/protect-portal` | OAuth Credentials | Portal configuration and authentication |

## 🔧 How It Works

### **Automatic Backup Process**
1. **Save Action**: When you save credentials or configuration in any Production app
2. **Layered Storage**: Data is automatically saved through all 4 storage layers
3. **SQLite Backup**: Server-side backup ensures data survives browser cache clears
4. **Environment Tagging**: Data is tagged with environment ID for proper isolation

### **Automatic Restore Process**
1. **App Load**: When you open a Production app
2. **Priority Loading**: Data is loaded in priority order (Memory → localStorage → IndexedDB → SQLite)
3. **Fallback Safety**: If SQLite backup fails, gracefully falls back to other storage methods
4. **Cache Update**: Successfully restored data is cached for faster future access

### **Environment Isolation**
- **Separate Storage**: Each environment (dev, staging, prod) has isolated data
- **Automatic Detection**: Environment ID is automatically detected and applied
- **Cross-Environment Safety**: Data from one environment never mixes with another

## 🛡️ Security & Privacy

### **Data Encryption**
- **Transport Security**: All data transmitted over HTTPS
- **Storage Security**: SQLite database uses secure file permissions
- **Environment Isolation**: Data is separated by environment ID

### **Data Retention**
- **Automatic Cleanup**: Backup data expires after 7 days by default
- **Manual Cleanup**: Users can clear data through browser storage settings
- **Server Cleanup**: Old backup data is automatically purged

### **Privacy Controls**
- **Local Storage**: Data is stored locally on your server instance
- **No External Sharing**: Backup data is never shared with third parties
- **User Control**: Users maintain full control over their data

## 🚀 User Benefits

### **Seamless Workflow**
- **No Data Loss**: Never lose your work due to browser crashes or server restarts
- **Quick Recovery**: Instantly restore your previous session and settings
- **Cross-Device Work**: Start work on one device, continue on another
- **Environment Switching**: Seamlessly switch between development and production environments

### **Productivity Gains**
- **Zero Configuration**: Backup works automatically - no setup required
- **Instant Recovery**: No need to re-enter credentials or reconfigure apps
- **Consistent Experience**: Same settings and data across all sessions
- **Reliable Testing**: Consistent test environments with preserved configurations

### **Developer Experience**
- **Debugging Support**: Persistent data makes debugging easier
- **Testing Consistency**: Test scenarios remain consistent across sessions
- **Environment Management**: Easy switching between different environments
- **Data Portability**: Export/import functionality for data migration

## 🔍 Troubleshooting

### **Common Issues**

#### **Data Not Restoring**
1. **Check Environment**: Ensure you're in the correct environment
2. **Clear Cache**: Try clearing browser cache and reloading
3. **Check Server**: Verify server is running and backup API is accessible
4. **Network Connection**: Ensure stable internet connection

#### **Backup Failed**
1. **Server Status**: Check if server is running and accessible
2. **Permissions**: Verify server has write permissions for backup directory
3. **Disk Space**: Ensure sufficient disk space on server
4. **Network**: Check network connectivity to backup API

#### **Environment Issues**
1. **Environment ID**: Verify environment ID is properly set
2. **URL Parameters**: Check if environment is specified in URL
3. **Configuration**: Verify environment configuration is correct
4. **Isolation**: Ensure data is properly isolated by environment

### **Debug Information**

#### **Browser Console**
Check browser console for backup-related messages:
```
✅ [PRODUCTION-APP] App credentials saved with SQLite backup
🔍 [PRODUCTION-APP] Trying SQLite backup for server restart persistence...
⚠️ [PRODUCTION-APP] SQLite backup failed, using fallback
```

#### **Network Tab**
Check network tab for backup API calls:
- `POST /api/backup/oauth` - OAuth credential backup
- `GET /api/backup/oauth` - OAuth credential restore
- `POST /api/backup/worker-token` - Worker token backup
- `GET /api/backup/worker-token` - Worker token restore

#### **Server Logs**
Check server logs for backup operations:
```
[BACKUP] SQLite backup saved for environment: test-env-1
[BACKUP] SQLite backup loaded for environment: test-env-1
[BACKUP] Backup data expired, cleaning up old entries
```

## 📋 Advanced Usage

### **Manual Data Export**
Users can export their data for backup or migration:
1. Open any Production app
2. Use the export functionality (if available)
3. Save the exported file securely

### **Manual Data Import**
Users can import previously exported data:
1. Open the target Production app
2. Use the import functionality (if available)
3. Select the exported file and confirm import

### **Environment Management**
Switch between environments while preserving data:
1. Change environment ID in app settings
2. Data is automatically isolated by environment
3. Switch back to restore previous environment data

### **Data Cleanup**
Clear backup data when needed:
1. Use browser storage settings to clear local data
2. Server backup data automatically expires after 7 days
3. Contact administrator for immediate server cleanup

## 🔧 Technical Details

### **Backup API Endpoints**
- `POST /api/backup/oauth` - Save OAuth credentials
- `GET /api/backup/oauth` - Load OAuth credentials
- `DELETE /api/backup/oauth` - Delete OAuth credentials
- `POST /api/backup/worker-token` - Save worker token credentials
- `GET /api/backup/worker-token` - Load worker token credentials
- `DELETE /api/backup/worker-token` - Delete worker token credentials

### **Storage Locations**
- **Memory**: Application memory during session
- **localStorage**: Browser local storage
- **IndexedDB**: Browser IndexedDB
- **SQLite**: Server-side SQLite database (`data/oauth-playground.db`)

### **Data Format**
Backup data is stored in JSON format with metadata:
```json
{
  "data": { /* actual credential data */ },
  "metadata": {
    "environmentId": "test-env-1",
    "createdAt": "2026-02-15T16:10:13.169Z",
    "expiresAt": "2026-02-22T16:10:13.169Z",
    "version": "1.0"
  }
}
```

## 📞 Support

### **Getting Help**
If you encounter issues with SQLite backup functionality:

1. **Check Documentation**: Review this guide and troubleshooting section
2. **Browser Console**: Check for error messages in browser console
3. **Network Tab**: Verify backup API calls are successful
4. **Server Logs**: Check server logs for backup-related messages
5. **Contact Support**: Reach out to development team for assistance

### **Feedback**
We welcome feedback on the SQLite backup functionality:
- **Bug Reports**: Report any issues or unexpected behavior
- **Feature Requests**: Suggest improvements or new features
- **Documentation**: Help us improve this user guide
- **Testing**: Help test backup functionality across different scenarios

---

**Last Updated**: February 15, 2026  
**Version**: 1.0  
**Compatible with**: OAuth Playground v9.11.40+
