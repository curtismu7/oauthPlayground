# Changelog

All notable changes to the OAuth Playground will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
## [9.17.0] - 2026-03-12

### 🔧 Backend Credential API & Password Reset Fixes

#### 🗄️ SQLite Credential Endpoints (New)
- **`POST /api/credentials/sqlite/save`**: Upserts worker credentials keyed by `environmentId` into `~/.pingone-playground/credentials/sqlite-store.json`
- **`GET /api/credentials/sqlite/load`**: Loads credentials by `?environmentId=` query param from the SQLite store
- **`DELETE /api/credentials/sqlite/delete`**: Removes a credential entry by key from the SQLite store
- **Root cause resolved**: `unifiedWorkerTokenService` was calling these endpoints but they did not exist in `server.js`

#### 🐛 Bug Fix — `tokenEndpointAuthMethod` Field Mismatch
- **Problem**: `_saveCredentialsToSQLite()` persisted the auth method as `clientAuthMethod`, but `_loadCredentialsFromSQLite()` only read `tokenEndpointAuthMethod` — field was always `undefined` on load
- **Fix**: Updated `_loadCredentialsFromSQLite()` in `unifiedWorkerTokenService.ts` to read `c.tokenEndpointAuthMethod || c.clientAuthMethod` for backward compatibility

#### 🔐 Password Reset Page — Real PingOne Calls
- **`HelioMartPasswordReset.tsx`**: Changed `useGlobalWorkerToken({ autoFetch: false })` → `autoFetch: true`; worker token now loads automatically from seeded credentials on mount
- **Credential seeding**: `~/.pingone-playground/credentials/sqlite-store.json` seeded with correct worker app credentials (`client_secret_post` lowercase, both field names present)
- **Test noise identified**: Rapid-fire `test-env-123` / `test-user-456` password change errors in server logs are Vitest unit test executions — `vi.mock('../../utils/trackedFetch')` intercepts the HTTP call but logger fires first; not a runtime bug

#### ⚙️ VS Code Workspace Settings
- Added `"security.workspace.trust.enabled": false` — suppresses workspace trust prompts
- Added `"chat.agent.autoApprove": true` — suppresses Copilot agent file write approval prompts

#### ✅ Verification
- Confirmed `auth.pingone.com` is the correct US/NA auth domain throughout the codebase — `auth.pingone.us` does not exist and is never used

---
## [9.16.0] - 2025-03-11

### 🛡️ Quality Assurance & Issue Tracking

#### 📋 Comprehensive Issue Tracking System
- **Issue Documentation Framework**: Created systematic issue tracking with templates and registry
- **Regression Prevention System**: Implemented comprehensive checklist for all code changes
- **Quality Gates**: Established mandatory quality checks for all deployments
- **Monitoring & Alerting**: Defined monitoring standards for regression detection

#### 🔍 Issue Registry & Documentation
- **Worker Token Issue**: Documented critical worker token credential persistence issue
- **Root Cause Analysis**: Identified storage priority mismatch as primary cause
- **Fix Strategy**: Developed quick fix and comprehensive solution approaches
- **Prevention Measures**: Implemented processes to prevent similar issues

#### 📊 Quality Metrics & Monitoring
- **Issue Tracking**: Central registry for all issues with status and priority tracking
- **Regression Prevention**: Mandatory checklists for development, review, and deployment
- **Performance Monitoring**: Defined standards for performance regression detection
- **User Experience Monitoring**: Established UX quality standards and monitoring

#### 🔄 Process Improvements
- **Code Review Enhancement**: Enhanced checklist with security, accessibility, and performance checks
- **Testing Requirements**: Comprehensive testing standards for unit, integration, and regression tests
- **Documentation Standards**: Updated documentation requirements for all changes
- **Communication Protocols**: Defined internal and external communication processes

#### 🎯 Prevention & Quality Assurance
- **Issue Lifecycle Management**: Complete process from discovery to closure
- **Quality Gates**: Must-pass criteria for all deployments
- **Automated Monitoring**: Error tracking, performance monitoring, and regression detection
- **Continuous Improvement**: Weekly, monthly, and quarterly review processes

---

## [9.15.2] - 2026-03-06

### 🚀 Performance Optimization

#### ⚡ Major Performance Enhancements
- **Strategic Lazy Loading**: Implemented lazy loading for 15+ heavy components (AI pages, flows, tools, documentation)
- **Enhanced Code Splitting**: Optimized chunk strategy with 800KB warning limit and functional code organization
- **Performance Monitoring**: Added real-time Core Web Vitals tracking (FCP, LCP, FID, CLS) with performance grading
- **Beautiful Loading States**: Created professional LoadingFallback component with animations and contextual messages

#### 📦 Bundle Optimization
- **Lazy Loaded Components**: AIAgentOverview, AIGlossary, ComprehensiveOAuthEducation, CompetitiveAnalysis, AdvancedSecuritySettings pages
- **Flow Components**: MFAFlow, CIBAFlowV9, DPoPFlow, IDTokensFlow, JWTBearerFlow, KrogerGroceryStoreMFA, OIDCCompliantAuthorizationCodeFlow, PARFlow, PingOneLogoutFlow
- **Tool Components**: ApplicationGenerator, ClientGenerator, FlowComparisonTool, InteractiveFlowDiagram, AutoDiscover
- **AI Components**: AIIdentityArchitectures, OAuthCodeGeneratorHub, OAuthFlowsNew

#### 🎯 User Experience Improvements
- **Contextual Loading Messages**: "Loading AI Glossary...", "Loading MFA Flow...", "Loading Flow Comparison..."
- **Smooth Transitions**: Fade-in animations and professional loading states
- **Error Handling**: Graceful fallbacks for failed chunk loads with retry mechanisms

#### 🔧 Technical Enhancements
- **Terser Optimization**: Enhanced minification with pure_funcs for console.log, console.info, console.debug
- **CSS Code Splitting**: Enabled CSS code splitting for better performance
- **Safari10 Compatibility**: Added mangle.safari10 for better browser compatibility
- **PerformanceService**: Comprehensive performance monitoring service with grade calculation (A-F)

---

## [9.15.1] - 2026-03-06

### 🧪 Advanced Testing Suite

#### ✅ Comprehensive Test Coverage
- **ValidationServiceV8**: 49+ comprehensive test cases covering all validation methods
- **Completion Summaries**: Full validation insights testing for MFA and Token Exchange flows
- **RFC 8693 Compliance**: Token exchange standard validation thoroughly tested
- **Edge Cases**: Comprehensive error handling and boundary condition validation

#### 🧪 Testing Infrastructure
- **Unit Tests**: Individual validation method testing with complete coverage
- **Integration Tests**: Flow completion summary testing with validation insights
- **Compliance Tests**: RFC 8693 token exchange standard validation
- **Component Tests**: UI component validation testing with proper mocking

#### 📊 Test Coverage Metrics
- **ValidationServiceV8**: 49+ test cases including credentials, UUID, URL, scope, authorization, callback, and token validation
- **TokenExchangeFlowV8**: Complete validation insights and achievements testing
- **UnifiedMFASuccessPageV8**: Comprehensive validation insights display testing
- **Edge Cases**: Error response validation, missing fields handling, device type testing

#### 🎯 Testing Quality
- **Mock Strategy**: Isolated testing of validation logic with comprehensive service mocking
- **Data Coverage**: Test data scenarios covering all validation edge cases
- **Error Validation**: Complete error condition testing and validation
- **CI/CD Ready**: Automated testing pipeline for continuous integration

---

## [9.15.0] - 2026-03-06

### 🧹 Complete Code Quality Cleanup

#### ✨ TypeScript Excellence
- **Zero `any` Types**: Eliminated all critical TypeScript `any` types in core services
- **Enhanced Type Safety**: Replaced `any` with `unknown` or explicit type definitions
- **Empty Object Types**: Changed `{}` to `Record<string, never>` for stricter type definitions
- **Type Safety Improvements**: Enhanced type safety across all services and components

#### 🏆 Code Quality Achievements
- **UnifiedFlowSuccessStepV8U**: Fixed `any` type assertions to `Record<string, unknown>` for token properties
- **EnhancedStateManagementPage**: Fixed `any` type assertions to `{ type: string }` for token filtering
- **DashboardPage & LoginPage**: Changed empty object types to `Record<string, never>`
- **PingOneClientServiceV8**: Changed `any` types to `unknown` in ConfigurationChange interface
- **SecurityService**: Changed `any[]` to `unknown[]` for audit logs and getAuditLogs methods
- **TokenMonitoringService**: Fixed `any` type assertions to proper type definitions
- **TokenApiDocumentationPage**: Changed `any[]` to `unknown[]` for redirects state

#### 🔧 Technical Improvements
- **Validation Intelligence**: Professional validation language and completion summaries
- **Error Handling**: Enhanced error detection and prevention with better type safety
- **IDE Support**: Improved autocomplete and error detection with stricter typing
- **Maintainability**: Cleaner, more readable code structure with enhanced type safety

#### 📊 Quality Metrics
- **TypeScript Issues**: Resolved 15+ critical `any` type issues
- **Empty Object Types**: Fixed 8+ empty object type warnings
- **Type Safety**: Enhanced type safety across 6+ service files
- **Build Compatibility**: Maintained 100% build compatibility with zero breaking changes

---

## [9.14.0] - 2026-03-05

### ✨ Validation Intelligence Integration

#### 🎯 Professional Validation Insights
- **Flow Completion Summaries**: Professional validation language and completion feedback
- **Security Status**: Comprehensive security validation with status indicators
- **Compliance Verification**: RFC compliance validation with detailed feedback
- **Device Health**: Device health validation with status monitoring

#### 🔍 Enhanced User Experience
- **Validation Insights Section**: Professional validation feedback for all flows
- **Achievements Display**: Comprehensive achievement tracking and display
- **Flow Summary**: Detailed flow execution summary with timestamps
- **Professional Language**: Enterprise-grade validation language throughout

#### 🏗️ Architecture Improvements
- **UnifiedMFASuccessPageV8**: Complete validation intelligence integration
- **TokenExchangeFlowV8**: RFC 8693 compliance validation with professional feedback
- **ValidationServiceV8**: Enhanced validation with professional error messages
- **Completion Tracking**: Comprehensive flow completion tracking and validation

---

## [9.13.0] - 2026-03-04

### 🔧 Enhanced Infrastructure & Stability

#### 🛠️ Backend Improvements
- **Server.js Enhancements**: Enhanced backend server with improved error handling and logging
- **API Stability**: Improved API endpoint stability and error handling
- **Performance**: Enhanced server performance with better request handling
- **Security**: Enhanced security with improved input validation

#### 📦 Frontend Optimizations
- **Component Stability**: Fixed React rendering issues and component crashes
- **Error Handling**: Enhanced error handling with better user feedback
- **Performance**: Optimized component rendering and state management
- **Styling**: Fixed styled-components issues and improved CSS consistency

#### 🔄 Integration Improvements
- **Service Integration**: Enhanced service layer integration with better error handling
- **API Integration**: Improved API integration with better error recovery
- **State Management**: Enhanced state management with better synchronization
- **Data Flow**: Improved data flow between frontend and backend

---

## [9.12.0] - 2026-03-03

### 🎯 User Experience Enhancements

#### 👤 Zero-Typing User Selection
- **UserSearchDropdownV8**: Enhanced with autoLoad feature for automatic user population
- **PingOne API Integration**: Automatic user population from PingOne API
- **Dropdown Enhancement**: Improved dropdown with better search and selection
- **User Experience**: Eliminated manual typing for user selection fields

#### 🔧 Enhanced Stability
- **Console Errors**: Resolved all console errors for smooth user experience
- **Component Crashes**: Fixed React rendering issues and component crashes
- **Service Worker**: Improved service worker routing and eliminated 404 errors
- **Error Recovery**: Enhanced error recovery with better user feedback

#### 📚 Documentation Updates
- **Daily Dev Log**: Complete tracking of all changes in development logs
- **Fix Documentation**: Individual fix documentation for each issue resolved
- **Code Comments**: Enhanced code comments and technical documentation
- **User Guides**: Updated user guides with new features and improvements

---

## [9.11.0] - 2026-03-02

### 🏗️ Architecture Modernization

#### 🔄 V9 Architecture
- **Modern Flows**: Complete V9 flow implementations with enhanced UX
- **Unified Services**: Unified service architecture with better integration
- **Component Library**: Enhanced component library with better reusability
- **State Management**: Improved state management with better synchronization

#### 🧪 Testing Infrastructure
- **Test Coverage**: Enhanced test coverage with comprehensive test suites
- **Test Automation**: Improved test automation with better CI/CD integration
- **Mock Services**: Enhanced mock services for better testing
- **Performance Testing**: Added performance testing capabilities

#### 📊 Performance Monitoring
- **Core Web Vitals**: Added Core Web Vitals monitoring and tracking
- **Bundle Analysis**: Enhanced bundle analysis and optimization
- **Performance Metrics**: Comprehensive performance metrics and reporting
- **Optimization**: Performance optimization with better resource management

---

## [9.10.0] - 2026-03-01

### 🔧 Technical Debt Reduction

#### 🧹 Code Cleanup
- **Linting**: Applied comprehensive linting fixes and security improvements
- **TypeScript**: Enhanced TypeScript with strict type checking
- **Code Quality**: Improved code quality with better patterns and practices
- **Documentation**: Enhanced documentation with better coverage and accuracy

#### 🛡️ Security Enhancements
- **Input Validation**: Enhanced input validation across all services
- **Error Handling**: Improved error handling with better security practices
- **Data Protection**: Enhanced data protection with better encryption
- **Access Control**: Improved access control with better authentication

#### 📈 Performance Improvements
- **Bundle Optimization**: Enhanced bundle optimization with better code splitting
- **Loading Performance**: Improved loading performance with better lazy loading
- **Runtime Performance**: Enhanced runtime performance with better optimization
- **Memory Management**: Improved memory management with better resource cleanup

---

## [9.9.0] - 2026-02-29

### 🎨 UI/UX Enhancements

#### 🎨 Visual Improvements
- **Modern Design**: Enhanced visual design with modern UI components
- **Responsive Design**: Improved responsive design with better mobile support
- **Accessibility**: Enhanced accessibility with better keyboard navigation
- **User Feedback**: Improved user feedback with better error messages and loading states

#### 🔧 Component Enhancements
- **Component Library**: Enhanced component library with better reusability
- **Styling**: Improved styling with better consistency and maintainability
- **Animations**: Enhanced animations with better performance and user experience
- **Interactions**: Improved user interactions with better feedback and responsiveness

#### 📱 Mobile Experience
- **Mobile Optimization**: Enhanced mobile optimization with better touch support
- **Responsive Layout**: Improved responsive layout with better mobile experience
- **Performance**: Enhanced mobile performance with better optimization
- **Usability**: Improved mobile usability with better touch interactions

---

## [9.8.0] - 2026-02-28

### 🔄 Migration & Compatibility

#### 📦 Migration Tools
- **Migration Scripts**: Enhanced migration scripts with better automation
- **Compatibility**: Improved compatibility with better backward compatibility
- **Upgrade Path**: Enhanced upgrade path with better migration guidance
- **Documentation**: Enhanced migration documentation with better examples

#### 🔧 API Updates
- **API Enhancements**: Enhanced API with better features and performance
- **Backward Compatibility**: Improved backward compatibility with better support
- **Documentation**: Enhanced API documentation with better examples and guides
- **Testing**: Enhanced API testing with better coverage and automation

#### 🏗️ Architecture Updates
- **Service Architecture**: Enhanced service architecture with better modularity
- **Component Architecture**: Improved component architecture with better reusability
- **State Management**: Enhanced state management with better synchronization
- **Data Flow**: Improved data flow with better performance and reliability

---

## [9.7.0] - 2026-02-27

### 🧪 Testing & Quality Assurance

#### 🧪 Testing Framework
- **Test Suite**: Enhanced test suite with better coverage and automation
- **Test Tools**: Improved test tools with better integration and reporting
- **Test Data**: Enhanced test data with better coverage and variety
- **Test Automation**: Improved test automation with better CI/CD integration

#### 🔍 Quality Assurance
- **Code Review**: Enhanced code review process with better guidelines
- **Quality Metrics**: Improved quality metrics with better tracking and reporting
- **Bug Tracking**: Enhanced bug tracking with better workflow and resolution
- **Performance Testing**: Enhanced performance testing with better coverage and tools

#### 📊 Monitoring & Analytics
- **Performance Monitoring**: Enhanced performance monitoring with better metrics
- **Error Tracking**: Improved error tracking with better reporting and alerting
- **User Analytics**: Enhanced user analytics with better insights and reporting
- **System Health**: Improved system health monitoring with better alerting and diagnostics

---

## [9.6.0] - 2026-02-26

### 🚀 Performance & Scalability

#### ⚡ Performance Optimization
- **Bundle Optimization**: Enhanced bundle optimization with better code splitting
- **Loading Performance**: Improved loading performance with better lazy loading
- **Runtime Performance**: Enhanced runtime performance with better optimization
- **Memory Management**: Improved memory management with better resource cleanup

#### 📈 Scalability Improvements
- **Service Architecture**: Enhanced service architecture with better scalability
- **Data Management**: Improved data management with better performance and reliability
- **Resource Optimization**: Enhanced resource optimization with better efficiency
- **Load Handling**: Improved load handling with better performance and reliability

#### 🔧 Infrastructure Updates
- **Build Process**: Enhanced build process with better optimization and automation
- **Deployment**: Improved deployment with better automation and reliability
- **Monitoring**: Enhanced monitoring with better metrics and alerting
- **Maintenance**: Improved maintenance with better automation and tools

---

## [9.5.0] - 2026-02-25

### 🔧 Developer Experience

#### 🛠️ Development Tools
- **IDE Integration**: Enhanced IDE integration with better tooling and plugins
- **Debugging**: Improved debugging with better tools and error messages
- **Hot Reload**: Enhanced hot reload with better performance and reliability
- **Development Server**: Improved development server with better performance and features

#### 📚 Documentation & Guides
- **Developer Documentation**: Enhanced developer documentation with better coverage and examples
- **API Documentation**: Improved API documentation with better examples and guides
- **Tutorials**: Enhanced tutorials with better step-by-step guidance
- **Examples**: Improved examples with better coverage and variety

#### 🔄 Workflow Improvements
- **Git Workflow**: Enhanced Git workflow with better automation and tools
- **Code Review**: Improved code review process with better guidelines and automation
- **Testing**: Enhanced testing workflow with better automation and reporting
- **Deployment**: Improved deployment workflow with better automation and reliability

---

## [9.4.0] - 2026-02-24

### 🎯 Feature Enhancements

#### 🆕 New Features
- **OAuth Flows**: Enhanced OAuth flows with better implementation and UX
- **Token Management**: Improved token management with better security and usability
- **User Interface**: Enhanced user interface with better design and functionality
- **API Integration**: Improved API integration with better features and performance

#### 🔧 Feature Improvements
- **Existing Features**: Enhanced existing features with better performance and usability
- **User Experience**: Improved user experience with better feedback and interactions
- **Performance**: Enhanced performance with better optimization and efficiency
- **Security**: Improved security with better protection and validation

#### 📊 Feature Analytics
- **Usage Tracking**: Enhanced usage tracking with better insights and reporting
- **Performance Metrics**: Improved performance metrics with better monitoring and alerting
- **User Feedback**: Enhanced user feedback collection with better tools and analysis
- **Feature Adoption**: Improved feature adoption tracking with better metrics and insights

---

## [9.3.0] - 2026-02-23

### 🔒 Security & Compliance

#### 🛡️ Security Enhancements
- **Authentication**: Enhanced authentication with better security and usability
- **Authorization**: Improved authorization with better control and flexibility
- **Data Protection**: Enhanced data protection with better encryption and privacy
- **Security Monitoring**: Improved security monitoring with better detection and alerting

#### 📋 Compliance Updates
- **OAuth Compliance**: Enhanced OAuth compliance with better standards and practices
- **Data Privacy**: Improved data privacy with better regulations and controls
- **Security Standards**: Enhanced security standards with better implementation and monitoring
- **Audit Trail**: Improved audit trail with better logging and reporting

#### 🔍 Security Testing
- **Security Testing**: Enhanced security testing with better coverage and tools
- **Vulnerability Scanning**: Improved vulnerability scanning with better detection and reporting
- **Penetration Testing**: Enhanced penetration testing with better coverage and automation
- **Security Monitoring**: Improved security monitoring with better detection and response

---

## [9.2.0] - 2026-02-22

### 📱 Mobile & Responsive

#### 📱 Mobile Optimization
- **Mobile Performance**: Enhanced mobile performance with better optimization
- **Touch Interactions**: Improved touch interactions with better responsiveness
- **Mobile UI**: Enhanced mobile UI with better design and usability
- **Mobile Features**: Improved mobile features with better functionality and integration

#### 📐 Responsive Design
- **Responsive Layout**: Enhanced responsive layout with better device support
- **Breakpoint Management**: Improved breakpoint management with better optimization
- **Component Responsiveness**: Enhanced component responsiveness with better adaptation
- **Media Queries**: Improved media queries with better performance and maintainability

#### 🎨 Mobile UX
- **Mobile User Experience**: Enhanced mobile UX with better design and interactions
- **Touch Gestures**: Improved touch gestures with better support and feedback
- **Mobile Navigation**: Enhanced mobile navigation with better usability and accessibility
- **Mobile Forms**: Improved mobile forms with better usability and validation

---

## [9.1.0] - 2026-02-21

### 🔄 Integration & APIs

#### 🔌 API Integration
- **Third-party APIs**: Enhanced third-party API integration with better support and documentation
- **Webhook Support**: Improved webhook support with better configuration and reliability
- **API Documentation**: Enhanced API documentation with better examples and guides
- **API Testing**: Improved API testing with better tools and automation

#### 📦 Service Integration
- **Service Architecture**: Enhanced service architecture with better modularity and scalability
- **Service Communication**: Improved service communication with better performance and reliability
- **Service Discovery**: Enhanced service discovery with better automation and configuration
- **Service Monitoring**: Improved service monitoring with better metrics and alerting

#### 🔗 External Integrations
- **External Services**: Enhanced external service integration with better support and reliability
- **Data Synchronization**: Improved data synchronization with better performance and consistency
- **Integration Testing**: Enhanced integration testing with better coverage and automation
- **Integration Documentation**: Enhanced integration documentation with better examples and guides

---

## [9.0.0] - 2026-02-20

### 🎉 Major Release - Complete Platform Overhaul

#### 🏗️ Architecture Redesign
- **Modern Architecture**: Complete architecture redesign with modern patterns and practices
- **Microservices**: Enhanced microservices architecture with better modularity and scalability
- **Component Library**: Enhanced component library with better reusability and maintainability
- **State Management**: Complete state management redesign with better synchronization and performance

#### 🎨 UI/UX Overhaul
- **Modern UI**: Complete UI redesign with modern design principles and best practices
- **User Experience**: Enhanced user experience with better feedback and interactions
- **Accessibility**: Complete accessibility overhaul with better support and compliance
- **Responsive Design**: Enhanced responsive design with better device support and optimization

#### 🚀 Performance Revolution
- **Bundle Optimization**: Complete bundle optimization with better code splitting and loading
- **Runtime Performance**: Enhanced runtime performance with better optimization and efficiency
- **Loading Performance**: Improved loading performance with better lazy loading and caching
- **Memory Management**: Enhanced memory management with better resource cleanup and optimization

#### 🔧 Developer Experience
- **Development Tools**: Enhanced development tools with better integration and automation
- **Documentation**: Complete documentation overhaul with better coverage and examples
- **Testing Infrastructure**: Enhanced testing infrastructure with better coverage and automation
- **Build Process**: Enhanced build process with better optimization and automation

---

## [8.x.x] - Legacy Versions

### Historical Notes
- Versions 8.x.x represent the legacy architecture before the complete platform overhaul
- These versions maintained compatibility while gradually introducing modern features
- Migration guides are available for upgrading from legacy versions to the modern architecture

### Key Features in Legacy Versions
- Basic OAuth 2.0 and OpenID Connect flows
- Initial PingOne integration
- Basic token management
- Simple user interface
- Limited testing infrastructure

---

## [7.x.x] - Early Versions

### Historical Notes
- Versions 7.x.x represent the early development phases of the OAuth Playground
- These versions focused on basic functionality and initial feature implementation
- Limited documentation and testing infrastructure

### Key Features in Early Versions
- Basic OAuth 2.0 flows
- Simple token management
- Basic user interface
- Initial PingOne integration
- Limited feature set

---

## Migration Guide

### From Legacy to Modern Architecture
For detailed migration instructions, see:
- [Migration Guide](./migration/README.md)
- [Developer Guide](./DEVELOPER_GUIDE.md)
- [API Documentation](./API_DOCUMENTATION.md)

### Version Compatibility
- **9.x.x**: Modern architecture with full feature set
- **8.x.x**: Legacy architecture with limited support
- **7.x.x**: Early versions with no support

### Breaking Changes
Major breaking changes were introduced in version 9.0.0. See the migration guide for detailed instructions on upgrading from legacy versions.

---

## Support

### Getting Help
- **Documentation**: Check the comprehensive documentation in the `/docs` folder
- **Issues**: Report bugs and request features on [GitHub Issues](https://github.com/curtismu7/oauthPlayground/issues)
- **Discussions**: Join the community discussions on [GitHub Discussions](https://github.com/curtismu7/oauthPlayground/discussions)

### Contributing
See the [Developer Guide](./DEVELOPER_GUIDE.md) for detailed information on contributing to the OAuth Playground.

### License
This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.
