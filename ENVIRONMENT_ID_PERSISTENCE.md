# Environment ID Persistence

This feature automatically saves and restores your PingOne Environment ID across sessions, so you never lose it.

## How It Works

1. **Automatic Saving**: When you enter or change an Environment ID in any flow, it's automatically saved to localStorage
2. **OIDC Discovery**: When OIDC discovery finds an Environment ID, it's also saved automatically
3. **Persistent Storage**: The Environment ID is loaded from localStorage on app startup
4. **.env Integration**: Instructions are provided to add the Environment ID to your .env file for permanent persistence

## Features

- ✅ **Auto-save on change**: Environment ID is saved whenever you type or discover it
- ✅ **OIDC Discovery integration**: Automatically saves Environment ID from discovery
- ✅ **localStorage persistence**: Survives browser refreshes and sessions
- ✅ **.env file support**: Can load from REACT_APP_PINGONE_ENVIRONMENT_ID
- ✅ **Visual status**: Shows persistence status and provides .env content
- ✅ **Copy to clipboard**: Easy .env content copying

## Usage

### 1. Manual Entry
- Type an Environment ID in any credentials form
- It's automatically saved to localStorage
- Console shows instructions to update .env file

### 2. OIDC Discovery
- Use the "OIDC Discovery" button
- If an Environment ID is found, it's automatically saved
- Source is marked as "oidc_discovery"

### 3. .env File Setup
Add this line to your `.env` file:
```
REACT_APP_PINGONE_ENVIRONMENT_ID=your-environment-id-here
```

### 4. Status Monitoring
The app shows a blue status box with:
- ✅ Storage status (localStorage)
- ✅ .env file status
- 📅 Last updated timestamp
- 🔍 Source of the Environment ID
- 📋 Copy .env content button

## Console Commands

In development, you can use these console commands:

```javascript
// Check persistence status
environmentIdPersistenceService.getPersistenceStatus()

// Load current Environment ID
environmentIdPersistenceService.loadEnvironmentId()

// Save Environment ID manually
environmentIdPersistenceService.saveEnvironmentId('your-id-here', 'manual')

// Clear stored Environment ID
environmentIdPersistenceService.clearEnvironmentId()

// Generate .env content
environmentIdPersistenceService.generateEnvContent()
```

## File Locations

- **Service**: `src/services/environmentIdPersistenceService.ts`
- **UI Component**: `src/components/EnvironmentIdPersistenceStatus.tsx`
- **Integration**: `src/services/comprehensiveCredentialsService.tsx`

## Benefits

1. **Never lose your Environment ID** - It's automatically saved
2. **Consistent across flows** - Same Environment ID used everywhere
3. **Easy .env management** - Copy-paste instructions provided
4. **OIDC Discovery integration** - Automatically saves discovered IDs
5. **Visual feedback** - Always know the persistence status

## Troubleshooting

- **Environment ID not persisting**: Check browser console for errors
- **Not loading from .env**: Ensure REACT_APP_PINGONE_ENVIRONMENT_ID is set correctly
- **Status not updating**: Refresh the page to reload the status
- **Clear storage**: Use the "Clear Storage" button or console command

