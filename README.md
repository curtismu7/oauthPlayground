# PingOne Import Tool

A comprehensive web-based tool for managing PingOne user imports, exports, and modifications with real-time progress tracking and detailed logging.

## 🚀 Features

### Core Functionality
- **User Import**: Bulk import users from CSV files with validation and error handling
- **User Export**: Export users from specific populations with customizable options
- **User Modification**: Update existing user attributes and data
- **Population Management**: Create, delete, and manage user populations
- **Real-time Progress**: Live progress tracking with detailed status updates
- **Comprehensive Logging**: Detailed logs for debugging and audit trails

### Advanced Features
- **Token Management**: Automatic token refresh and validation with status indicators
- **Error Handling**: Robust error handling with detailed error messages
- **File Validation**: CSV format validation and data integrity checks
- **Responsive UI**: Modern, mobile-friendly interface with Ping Identity styling
- **Settings Management**: Centralized configuration management
- **API Testing**: Built-in API connection testing tools
- **Swagger UI Integration**: Interactive API documentation
- **Disclaimer Banner**: Ping Identity–branded legal disclaimer
- **Token Status Indicator**: Real-time token validity monitoring

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- PingOne environment credentials
- Valid PingOne API access

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/cmuir_pingcorp/pingone-import.git
   cd pingone-import
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   Edit `.env` with your PingOne credentials:
   ```
   PINGONE_CLIENT_ID=your_client_id
   PINGONE_CLIENT_SECRET=your_client_secret
   PINGONE_ENVIRONMENT_ID=your_environment_id
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

5. **Access the application**
   Open your browser and navigate to `http://localhost:4000`

## 🎯 Usage

### Import Users
1. Navigate to the **Import** tab
2. Upload a CSV file with user data
3. Review the data preview
4. Select target population (optional)
5. Click **Start Import** to begin the process
6. Monitor real-time progress and logs

### Export Users
1. Navigate to the **Export** tab
2. Enter population ID or select from dropdown
3. Configure export options
4. Click **Export Users** to download CSV

### Modify Users
1. Navigate to the **Modify** tab
2. Upload CSV with user updates
3. Review changes in preview
4. Click **Apply Changes** to update users

### Settings
1. Navigate to the **Settings** tab
2. Configure API credentials
3. Test connection
4. Save settings

### API Documentation
- Access Swagger UI at `/swagger/html`
- View OpenAPI spec at `/swagger.json`
- Test API endpoints directly from the interface

## 📁 Project Structure

```
pingone-import/
├── public/                 # Static assets
│   ├── css/               # Stylesheets
│   ├── js/                # Client-side JavaScript
│   └── index.html         # Main HTML file
├── routes/                # API routes
├── server/                # Server-side code
├── test/                  # Test files
├── data/                  # Configuration data
└── scripts/               # Utility scripts
```

## 🔧 Configuration

### Environment Variables
- `PINGONE_CLIENT_ID`: Your PingOne client ID
- `PINGONE_CLIENT_SECRET`: Your PingOne client secret
- `PINGONE_ENVIRONMENT_ID`: Your PingOne environment ID
- `PORT`: Server port (default: 4000)

### CSV Format Requirements
The tool supports standard CSV format with the following columns:
- `username` (required)
- `email` (required)
- `firstName`
- `lastName`
- `populationId` (optional)

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run specific test categories:
```bash
npm run test:unit
npm run test:integration
npm run test:e2e
```

## 🐛 Troubleshooting

### Common Issues

1. **Token Expiration**
   - Navigate to Settings
   - Click "Test Connection"
   - Update credentials if needed

2. **CSV Import Errors**
   - Check CSV format and required columns
   - Verify data types and values
   - Review error logs for specific issues

3. **API Connection Issues**
   - Verify PingOne credentials
   - Check network connectivity
   - Review server logs

### Debug Mode
Enable debug logging by setting `DEBUG=true` in your environment variables.

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Add tests** for new functionality
5. **Commit your changes**
   ```bash
   git commit -m "Add: description of your changes"
   ```
6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Create a Pull Request**

### Development Guidelines
- Follow the existing code style
- Add comments for complex logic
- Include error handling
- Write tests for new features
- Update documentation as needed

## 📝 Issue Templates

### Bug Report
When reporting bugs, please include:
- **Description**: Clear description of the issue
- **Steps to reproduce**: Detailed steps to recreate the problem
- **Expected behavior**: What should happen
- **Actual behavior**: What actually happens
- **Environment**: OS, browser, Node.js version
- **Screenshots**: If applicable

### Feature Request
When requesting features, please include:
- **Description**: Clear description of the feature
- **Use case**: Why this feature is needed
- **Proposed solution**: How you envision it working
- **Alternatives**: Any alternative approaches considered

## 🔒 Security

- Never commit sensitive credentials
- Use environment variables for configuration
- Regularly update dependencies
- Follow security best practices

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- PingOne API documentation
- Contributors and maintainers
- Open source community

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section
- Review the logs for error details

---

## 🌍 Region Configuration

The tool supports multiple PingOne regions with production-ready selection and validation:

| Region Name                        | Code | TLD     |
|------------------------------------|------|---------|
| North America (excluding Canada)   | NA   | com     |
| Canada                             | CA   | ca      |
| European Union                     | EU   | eu      |
| Australia                          | AU   | com.au  |
| Singapore                          | SG   | sg      |
| Asia-Pacific                       | AP   | asia    |

- Select your region in **Settings**. The correct API base URL is used automatically.
- Region info is used for all API calls and is saved in your settings.

## ⏳ Modern Progress UI

- All major operations (Import, Export, Delete, Modify) feature a modern, non-blocking progress UI.
- Real-time updates via SSE (Server-Sent Events) and responsive controls.
- Duplicate handling, error reporting, and accessibility features included.
- Progress UI is tested via the API tester and Swagger UI.

## 🧪 API Documentation & Testing

- **Swagger UI**: Access at `/swagger/html` or `/api-docs` for interactive API documentation and live testing.
- **Region and Progress Endpoints**: All region codes and progress endpoints are documented and testable in Swagger UI.
- **API Tester**: Use `public/api-tester.html` for comprehensive UI and API testing, including region and progress features.

---

**Version**: 5.1  
**Last Updated**: July 2025  
**Maintainer**: Curtis Muir
