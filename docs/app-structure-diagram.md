# PingOne Import Tool - Application Structure Diagram

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
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘   │
│         │                   │                   │                   │         │
│         ▼                   ▼                   ▼                   ▼         │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐   │
│  │   Data      │    │   Status    │    │   Logging   │    │   Result    │   │
│  │   Validation│    │   Update    │    │   System    │    │   Display   │   │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              KEY FEATURES                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  📁 FILE OPERATIONS:                                                           │
│  • CSV Import with validation and preview                                      │
│  • CSV Export with field selection and formatting                              │
│  • File upload with drag & drop support                                        │
│  • File size validation and error handling                                     │
│                                                                                 │
│  👥 USER MANAGEMENT:                                                           │
│  • Bulk user import with population assignment                                 │
│  • User modification (update existing users)                                   │
│  • User deletion (CSV-based and population-based)                             │
│  • User export with customizable fields                                        │
│                                                                                 │
│  🔐 AUTHENTICATION:                                                            │
│  • PingOne API token management                                                │
│  • Automatic token refresh                                                     │
│  • Secure credential storage                                                   │
│  • Connection status monitoring                                                │
│                                                                                 │
│  📊 PROGRESS TRACKING:                                                         │
│  • Real-time progress bars                                                     │
│  • Success/failure statistics                                                  │
│  • Detailed logging and error reporting                                        │
│  • Cancel operation support                                                    │
│                                                                                 │
│  ⚙️ CONFIGURATION:                                                             │
│  • Settings management with validation                                         │
│  • Environment and population selection                                        │
│  • Import/export preferences                                                   │
│  • Rate limiting configuration                                                 │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                              TECHNICAL STACK                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  🎨 Frontend:                                                                  │
│  • HTML5 + CSS3 + JavaScript (ES6+)                                           │
│  • Bootstrap 4 for responsive UI                                               │
│  • Font Awesome for icons                                                      │
│  • Browserify for module bundling                                             │
│  • Babel for ES6+ transpilation                                               │
│                                                                                 │
│  ⚙️ Backend:                                                                   │
│  • Node.js with Express.js framework                                           │
│  • PingOne API integration                                                     │
│  • File system operations                                                      │
│  • Rate limiting and error handling                                            │
│  • Comprehensive logging system                                                │
│                                                                                 │
│  📦 Build Tools:                                                              │
│  • npm for package management                                                  │
│  • Browserify for JavaScript bundling                                         │
│  • Babel for code transpilation                                               │
│  • Jest for testing framework                                                  │
│                                                                                 │
│  🔧 Development:                                                              │
│  • Hot reloading for development                                              │
│  • Comprehensive error handling                                                │
│  • Debug logging and monitoring                                                │
│  • Cross-browser compatibility                                                │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘ 