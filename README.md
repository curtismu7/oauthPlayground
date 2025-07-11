# PingOne Import Tool v4.3.1

A comprehensive web application for managing PingOne user data with bulk import, export, modification, and deletion capabilities.

## 🏗️ Application Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PINGONE IMPORT TOOL v4.3.1                          │
│                              Application Structure                             │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                                FRONTEND (Browser)                             │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐           │
│  │   Navigation    │    │   Main Views    │    │   File Input    │           │
│  │                 │    │                 │    │                 │           │
│  │ • Import        │    │ • Import View   │    │ • CSV File      │           │
│  │ • Export        │    │ • Export View   │    │ • File Handler  │           │
│  │ • Modify        │    │ • Modify View   │    │ • File Logger   │           │
│  │ • Delete        │    │ • Delete View   │    │ • File Preview  │           │
│  │ • Settings      │    │ • Settings View │    │                 │           │
│  │ • Logs          │    │ • Logs View     │    │                 │           │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘           │
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐           │
│  │   UI Manager    │    │   Progress UI   │    │   Notifications │           │
│  │                 │    │                 │    │                 │           │
│  │ • View Switching│    │ • Progress Bars │    │ • Success Msgs  │           │
│  │ • Status Updates│    │ • Status Counts │    │ • Error Msgs    │           │
│  │ • Connection    │    │ • Cancel Buttons│    │ • Warning Msgs  │           │
│  │ • Loading States│    │ • Close Buttons │    │ • Info Msgs     │           │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘           │
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐           │
│  │   API Client    │    │   Settings      │    │   Token Manager │           │
│  │                 │    │   Manager       │    │                 │           │
│  │ • Local API     │    │ • Load Settings │    │ • Get Token     │           │
│  │ • PingOne API   │    │ • Save Settings │    │ • Refresh Token │           │
│  │ • Rate Limiting │    │ • Validate      │    │ • Token Storage │           │
│  │ • Error Handling│    │ • Form Updates  │    │ • Token Expiry  │           │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                                BACKEND (Node.js)                              │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐           │
│  │   Express       │    │   API Routes    │    │   Middleware    │           │
│  │   Server        │    │                 │    │                 │           │
│  │                 │    │ • /api/health   │    │ • Rate Limiting │           │
│  │ • Port 4000     │    │ • /api/logs     │    │ • CORS          │           │
│  │ • Static Files  │    │ • /api/settings │    │ • JSON Parser   │           │
│  │ • Error Handler │    │ • /api/pingone  │    │ • Auth Check    │           │
│  │ • Logging       │    │ • /api/export   │    │ • File Upload   │           │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘           │
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐           │
│  │   PingOne       │    │   Token         │    │   File          │           │
│  │   Client        │    │   Manager       │    │   Handler       │           │
│  │                 │    │                 │    │                 │           │
│  │ • User Import   │    │ • Get Token     │    │ • CSV Parsing   │           │
│  │ • User Export   │    │ • Refresh Token │    │ • File Validation│          │
│  │ • User Modify   │    │ • Token Storage │    │ • Data Processing│          │
│  │ • User Delete   │    │ • Token Expiry  │    │ • Error Handling│          │
│  │ • Population    │    │ • Auth Headers  │    │ • File Logging  │           │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘           │
│                                                                                 │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐           │
│  │   Logger        │    │   Settings      │    │   Data          │           │
│  │   System        │    │   Manager       │    │   Storage       │           │
│  │                 │    │                 │    │                 │           │
│  │ • File Logging  │    │ • Load Settings │    │ • Local Storage │           │
│  │ • Console Logs  │    │ • Save Settings │    │ • Session Data  │           │
│  │ • Error Logs    │    │ • Validate      │    │ • Cache Data    │           │
│  │ • Debug Logs    │    │ • Environment   │    │ • Temp Files    │           │
│  │ • UI Logs       │    │ • Config Files  │    │ • Export Files  │           │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW DIAGRAM                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │   User      │    │   Frontend  │    │   Backend   │    │   PingOne   │   │
│  │   Action    │───▶│   Processing│───▶│   API       │───▶│   API       │   │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘   │
│         │                   │                   │                   │         │
│         ▼                   ▼                   ▼                   ▼         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │   File      │    │   UI        │    │   Token     │    │   User      │   │
│  │   Upload    │    │   Update    │    │   Auth      │    │   Data      │   │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘   │
│         │                   │                   │                   │         │
│         ▼                   ▼                   ▼                   ▼         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │   CSV       │    │   Progress  │    │   Rate      │    │   Response  │   │
│  │   Parsing   │    │   Display   │    │   Limiting  │    │   Processing│   │
│  └─────────────┘    └─────────────────┘    └─────────────┘    └─────────────┘   │
│         │                   │                   │                   │         │
│         ▼                   ▼                   ▼                   ▼         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │   Data      │    │   Status    │    │   Logging   │    │   Result    │   │
│  │   Validation│    │   Update    │    │   System    │    │   Display   │   │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

## 🚀 Key Features

### 📁 File Operations
- **CSV Import** with validation and preview
- **CSV Export** with field selection and formatting
- **File upload** with drag & drop support
- **File size validation** and error handling
- **File info display** with detailed metadata

### 👥 User Management
- **Bulk user import** with population assignment
- **User modification** (update existing users)
- **User deletion** (CSV-based and population-based)
- **User export** with customizable fields
- **Population-based operations** with safety checks

### 🔐 Authentication
- **PingOne API token management**
- **Automatic token refresh**
- **Secure credential storage**
- **Connection status monitoring**

### 📊 Progress Tracking
- **Real-time progress bars**
- **Success/failure statistics**
- **Detailed logging and error reporting**
- **Cancel operation support**
- **Enhanced notification system** with success/warning/error states

### ⚙️ Configuration
- **Settings management** with validation
- **Environment and population selection**
- **Import/export preferences**
- **Rate limiting configuration**

### 🎨 User Interface
- **Modern responsive design** with Bootstrap 4
- **Enhanced notification system** with color-coded messages
- **Improved disclaimer system** with required acceptance
- **Consistent branding** with Ping Identity logo
- **Better file handling** with detailed file information display
- **Enhanced delete page** with reordered sections and improved UX
- **Version badge** with consistent versioning across the application

### 🛡️ Safety Features
- **Comprehensive disclaimer** with required acceptance
- **Safety warnings** and confirmation dialogs
- **Data validation** and error handling
- **Rate limiting** to prevent API overload
- **Backup recommendations** before destructive operations

## 🛠️ Technical Stack

### 🎨 Frontend
- **HTML5 + CSS3 + JavaScript (ES6+)**
- **Bootstrap 4** for responsive UI
- **Font Awesome** for icons
- **Browserify** for module bundling
- **Babel** for ES6+ transpilation

### ⚙️ Backend
- **Node.js** with Express.js framework
- **PingOne API** integration
- **File system operations**
- **Rate limiting and error handling**
- **Comprehensive logging system**

### 📦 Build Tools
- **npm** for package management
- **Browserify** for JavaScript bundling
- **Babel** for code transpilation
- **Jest** for testing framework

### 🔧 Development
- **Hot reloading** for development
- **Comprehensive error handling**
- **Debug logging and monitoring**
- **Cross-browser compatibility**

## 📋 Prerequisites

- Node.js v18 or higher
- npm or yarn package manager
- PingOne environment credentials
- Modern web browser

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd PingONe-cursor-import
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp data/settings.json.example data/settings.json
   # Edit settings.json with your PingOne credentials
   ```

4. **Build the application**
   ```bash
   npm run build
   ```

5. **Start the server**
   ```bash
   node server.js
   ```

6. **Access the application**
   - Open your browser to `http://localhost:4000`
   - Accept the disclaimer to access the tool
   - Configure your PingOne settings in the Settings tab
   - Start importing, exporting, or modifying users

## 📖 Usage

### Getting Started
1. **Accept Disclaimer**: The application requires accepting the disclaimer before use
2. **Configure Settings**: Set up your PingOne credentials in the Settings tab
3. **Test Connection**: Verify your API credentials are working correctly

### Import Users
1. Navigate to the **Import** tab
2. Select a CSV file with user data
3. Choose target population
4. Review preview and start import
5. Monitor progress and results

### Export Users
1. Navigate to the **Export** tab
2. Select population to export
3. Choose fields and format
4. Download the exported file

### Modify Users
1. Navigate to the **Modify** tab
2. Upload CSV with user updates
3. Configure modification options
4. Process updates with progress tracking

### Delete Users
1. Navigate to the **Delete** tab
2. Choose deletion method (CSV or population-based)
3. Confirm deletion with safety checks
4. Monitor deletion progress

## 🔧 Configuration

### Environment Variables
- `PINGONE_CLIENT_ID`: Your PingOne client ID
- `PINGONE_CLIENT_SECRET`: Your PingOne client secret
- `PINGONE_ENVIRONMENT_ID`: Your PingOne environment ID
- `PINGONE_REGION`: Your PingOne region (NorthAmerica, Europe, etc.)

### Settings File
The application uses `data/settings.json` for configuration:
```json
{
  "apiClientId": "your-client-id",
  "apiSecret": "your-client-secret",
  "environmentId": "your-environment-id",
  "region": "NorthAmerica",
  "populationId": "optional-default-population"
}
```

## 📊 API Endpoints

### Health & Status
- `GET /api/health` - Server health check
- `GET /api/logs` - Application logs

### PingOne Operations
- `GET /api/pingone/populations` - List populations
- `POST /api/pingone/get-token` - Get authentication token
- `POST /api/pingone/refresh-token` - Refresh authentication token

### User Management
- `POST /api/export-users` - Export users to CSV
- `POST /api/modify` - Modify existing users
- Various PingOne proxy endpoints for user operations

### Settings
- `GET /api/settings` - Get current settings
- `POST /api/settings` - Save settings
- `PUT /api/settings` - Update settings

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run specific test files:
```bash
npm test -- test/api/import.test.js
```

## 📝 Logging

The application provides comprehensive logging:
- **File logs**: Stored in `logs/` directory
- **Console logs**: Real-time development logging
- **UI logs**: User-visible log messages
- **API logs**: Request/response logging

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the application logs
2. Review the documentation
3. Create an issue in the repository

## 🔄 Version History

- **v4.3.1**: Enhanced UI/UX with improved notifications, disclaimer system, and better file handling
- **v4.3.0**: Added batch deletion and progress improvements
- **v4.2.0**: Enhanced file handling and UI improvements
- **v4.1.0**: Added modify functionality and better error handling
- **v4.0.0**: Major rewrite with modern architecture

### Recent Improvements (v4.3.1)
- **Enhanced Notification System**: Color-coded success/warning/error messages with consistent icons
- **Improved Disclaimer**: Required acceptance with dual checkbox system and visual feedback
- **Better File Handling**: Detailed file information display on Import and Modify pages
- **UI Consistency**: Consistent branding with Ping Identity logo in header and footer
- **Delete Page Improvements**: Reordered sections with population delete first, expanded by default
- **Version Badge**: Consistent version display across the application
- **Footer Styling**: Fixed blue gradient background with proper text contrast
- **Rate Limiting**: Enforced 50 API calls per second limit across all operations

---

**Built with ❤️ for PingOne user management**
