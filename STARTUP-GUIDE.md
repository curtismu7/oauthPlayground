# OAuth Playground - Complete Startup Guide

## 🎯 **Table of Contents**

1. [Quick Start](#-quick-start)
2. [Startup Scripts](#-startup-scripts)
3. [Custom Domain Setup](#-custom-domain-setup)
4. [Domain Management](#-domain-management)
5. [SSL Configuration](#-ssl-configuration)
6. [Troubleshooting](#-troubleshooting)
7. [Advanced Usage](#-advanced-usage)

---

## 🚀 **Quick Start**

### **For New Developers**
```bash
# Clone and setup
git clone <repository>
cd oauth-playground

# First-time setup (includes custom domain configuration)
./scripts/development/run.sh

# Wait for servers to start and follow the prompts
```

### **For Daily Development**
```bash
# Quick startup with existing configuration
./scripts/development/run.sh -default
```

### **For Automated Scripts**
```bash
# No prompts, uses all defaults
./scripts/development/run.sh -quick
```

---

## 📋 **Startup Scripts**

### **Main Script: `scripts/development/run.sh`**

This is the **primary startup script** that handles everything including custom domain setup, server management, and health checks.

#### **Available Options**
```bash
./scripts/development/run.sh           # Interactive setup with custom domain
./scripts/development/run.sh -default  # Skip setup, use existing configuration
./scripts/development/run.sh -quick    # Use all defaults, no prompts
./scripts/development/run.sh --help    # Show comprehensive help
```

#### **What It Does**
1. **Directory Discovery** - Finds and validates project directory
2. **Requirements Check** - Verifies Node.js, npm, curl, SQLite3
3. **Custom Domain Setup** - Configures domain, SSL, hosts file (first run)
4. **Lockdown Verification** - Checks SMS, Email, WhatsApp lockdown integrity
5. **Server Management** - Kills existing servers, starts fresh
6. **Health Checks** - Verifies servers are running correctly
7. **Status Reporting** - Shows comprehensive status and URLs
8. **Log Management** - Offers to tail log files

---

## 🌐 **Custom Domain Setup**

### **Automatic Setup Process**

The first time you run `./scripts/development/run.sh`, it will automatically guide you through custom domain setup:

```bash
🌐 Custom Domain Setup Utility
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🌐 Custom Domain Setup Utility 🌐                        ║
║                    Interactive Configuration Tool                           ║
║                                                                              ║
║  This script will:                                                          ║
║  1. Prompt for your custom domain (default: auth.pingdemo.com)             ║
║  2. Validate domain format and accessibility                               ║
║  3. Generate .env.local with all environment variables                      ║
║  4. Configure hosts file automatically                                      ║
║  5. Generate SSL certificates automatically                                 ║
║  6. Configure browser trust (macOS)                                         ║
║  7. Provide step-by-step setup instructions                                 ║
║  8. Show verification commands and troubleshooting tips                     ║
║                                                                              ║
║  🔧 OpenSSL Commands That Will Be Run:                                     ║
║  • openssl req -x509 -nodes -days 365 -newkey rsa:2048                     ║
║    -keyout DOMAIN.key -out DOMAIN.crt                                     ║
║    -subj "/C=US/ST=State/L/City/O=Development/CN=DOMAIN"                ║
║  • openssl x509 -in DOMAIN.crt -noout -subject -dates                       ║
║  • security add-trusted-cert (macOS browser trust)                          ║
║                                                                              ║
║  🖥️  Hosts File Commands That Will Be Run:                                 ║
║  • sudo sh -c 'echo "127.0.0.1 DOMAIN" >> /etc/hosts'                    ║
║  • sudo sh -c 'echo "::1 DOMAIN" >> /etc/hosts'                          ║
║  (Windows: Manual edit of C:\Windows\System32\drivers\etc\hosts)      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

### **Domain Format Requirements**

Your custom domain must follow the format: `xxx.xxxxxx.xxx`

#### **Valid Examples**:
- ✅ `auth.pingdemo.com`
- ✅ `api.myapp.com`
- ✅ `app.example.org`
- ✅ `test.dev.local`
- ✅ `web.application.server`

#### **Requirements**:
- **Subdomain**: 2+ characters, alphanumeric and hyphens, starts/ends with alphanumeric
- **Domain**: 2+ characters, alphanumeric and hyphens, starts/ends with alphanumeric
- **TLD**: 2-10 characters, letters only

#### **Invalid Examples**:
- ❌ `domain.com` (missing subdomain)
- ❌ `a.com` (subdomain too short)
- ❌ `auth` (missing domain and TLD)
- ❌ `auth..com` (empty domain part)
- ❌ `-auth.pingdemo.com` (subdomain starts with hyphen)

---

## 🔄 **Domain Management**

### **Changing Domains**

When you want to change your custom domain, the script will automatically detect existing setup and offer to clear it:

```bash
$ ./scripts/development/run.sh

⚠️  Existing domain setup detected
ℹ️  Found: .env.local file and/or SSL certificates

🔵 Clear existing domain setup before configuring new domain? (y/N): y

🧹 Clearing Existing Domain Setup
ℹ️  Removing .env.local file...
ℹ️  Removing SSL key file: auth.pingdemo.com.key
ℹ️  Removing SSL certificate file: auth.pingdemo.com.crt
ℹ️  Removing SSL key backup: auth.pingdemo.com.key.backup
ℹ️  Removing SSL certificate backup: auth.pingdemo.com.crt.backup
✅ Domain setup cleared successfully

🔵 Enter your custom domain (default: auth.pingdemo.com): api.myapp.com
✅ Domain validated: https://api.myapp.com
✅ Custom domain setup completed successfully!
```

### **Domain Management Options**

| Task | Command | Description |
|------|---------|-------------|
| **Change domain** | `rm .env.local && ./run.sh` | Clear existing setup and configure new domain |
| **Clear everything** | `rm .env.local *.crt *.key` | Remove all domain-related files |
| **Keep existing** | `./run.sh` (answer 'N' to clear) | Use existing domain configuration |
| **Quick reset** | `rm .env.local && ./run.sh -quick` | Reset to default domain automatically |

### **Files Managed**

The setup manages these files automatically:

- **`.env.local`** - Main domain configuration
- **`{domain}.crt`** - SSL certificate file
- **`{domain}.key`** - SSL private key file
- **`{domain}.crt.backup`** - Certificate backup
- **`{domain}.key.backup`** - Key backup

---

## 🔐 **SSL Configuration**

### **Automatic SSL Certificate Generation**

The script automatically generates self-signed SSL certificates for your custom domain:

```bash
🔐 Generating SSL Certificates
ℹ️  Domain: auth.pingdemo.com
ℹ️  Key file: auth.pingdemo.com.key
ℹ️  Cert file: auth.pingdemo.com.crt

ℹ️  Running: openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout auth.pingdemo.com.key -out auth.pingdemo.com.crt -subj "/C=US/ST=State/L/City/O=Development/CN=auth.pingdemo.com"

✅ SSL certificates generated successfully
ℹ️  Generated files:
ℹ️    Private key: auth.pingdemo.com.key
ℹ️    Certificate: auth.pingdemo.com.crt

ℹ️  Certificate details:
Certificate Details:
        Subject: C=US, ST=State, L=City, O=Development, CN=auth.pingdemo.com
        Not Before: Feb 21 2026 GMT
        Not After : Feb 21 2027 GMT
```

### **Browser Trust Configuration (macOS)**

On macOS, the script automatically attempts to add the certificate to the system keychain:

```bash
🌐 Configuring Browser Trust (macOS)
ℹ️  Attempting to add certificate to macOS Keychain...

✅ Certificate added to System Keychain
ℹ️  Browser should now trust the certificate
```

### **Manual SSL Setup (if needed)**

If automatic SSL setup fails, you can generate certificates manually:

```bash
# Generate private key and certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout your-domain.key \
  -out your-domain.crt \
  -subj "/C=US/ST=State/L/City/O=Development/CN=your-domain"

# Set appropriate permissions
chmod 600 your-domain.key
chmod 644 your-domain.crt

# Verify certificate
openssl x509 -in your-domain.crt -noout -subject -dates
```

---

## 🖥️ **Hosts File Configuration**

### **Automatic Configuration**

The script automatically configures your hosts file to resolve the custom domain to localhost:

```bash
🔧 Configuring Hosts File
ℹ️  Detected OS: macos
ℹ️  Domain: auth.pingdemo.com

ℹ️  Configuring hosts file for Unix-based system...
ℹ️  Adding domain entries to /etc/hosts...
✅ Hosts file configured successfully
ℹ️  Added entries:
ℹ️    127.0.0.1 auth.pingdemo.com
ℹ️    ::1 auth.pingdemo.com
```

### **Manual Hosts Configuration**

If automatic configuration fails, configure manually:

#### **macOS/Linux**:
```bash
# Add to /etc/hosts (requires sudo)
sudo sh -c 'echo "127.0.0.1 your-domain.com" >> /etc/hosts'
sudo sh -c 'echo "::1 your-domain.com" >> /etc/hosts'
```

#### **Windows**:
1. Open `C:\Windows\System32\drivers\etc\hosts` as Administrator
2. Add these lines:
   ```
   127.0.0.1 your-domain.com
   ::1 your-domain.com
   ```

---

## 🔧 **OpenSSL Installation**

### **Automatic Detection and Installation**

The script automatically detects if OpenSSL is installed and offers to install it:

```bash
⚠️  OpenSSL is not installed

🔵 Install OpenSSL automatically? (y/N): y

🔧 Installing OpenSSL
ℹ️  Detected OS: macos
ℹ️  Installing OpenSSL on macOS using Homebrew...
ℹ️  Homebrew found, installing OpenSSL...
✅ OpenSSL installed successfully via Homebrew
```

### **Manual OpenSSL Installation**

If automatic installation fails:

#### **macOS**:
```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install OpenSSL
brew install openssl
```

#### **Linux**:
```bash
# Ubuntu/Debian
sudo apt-get update && sudo apt-get install -y openssl

# CentOS/RHEL
sudo yum install -y openssl

# Fedora
sudo dnf install -y openssl
```

#### **Windows**:
1. Download from: https://slproweb.com/products/Win32OpenSSL.html
2. Or use Chocolatey: `choco install openssl`
3. Or use Scoop: `scoop install openssl`

---

## 🚨 **Troubleshooting**

### **Common Issues and Solutions**

#### **SSL Certificate Errors**
```bash
❌ Failed to generate SSL certificates
ℹ️  OpenSSL error output: [error details]

Troubleshooting steps:
1. Verify OpenSSL is installed: openssl version
2. Check directory permissions: ls -la
3. Try manual command:
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout domain.key -out domain.crt -subj "/C=US/ST=State/L/City/O=Development/CN=domain"
```

#### **Hosts File Issues**
```bash
❌ Failed to configure hosts file
ℹ️  You may need to run these commands manually:
ℹ️    sudo sh -c 'echo "127.0.0.1 domain" >> /etc/hosts'
ℹ️    sudo sh -c 'echo "::1 domain" >> /etc/hosts'
```

#### **Domain Validation Errors**
```bash
❌ Invalid domain format. Domain must be in format: xxx.xxxxxx.xxx
ℹ️  Examples: auth.pingdemo.com, api.myapp.com, app.example.org
ℹ️  Requirements: 2+ characters for subdomain and domain, 2-10 letters for TLD
```

#### **Port Conflicts**
```bash
❌ Servers failed to start
ℹ️  Check port conflicts with 'lsof -i :3000-3001'
```

#### **Lockdown Verification Issues**
```bash
❌ Lockdown verification failed
ℹ️  Run 'git status' to check for uncommitted changes
```

### **Debugging Scripts**

#### **Check OpenSSL Environment**:
```bash
# Verify OpenSSL installation
openssl version

# Test certificate generation
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout test.key -out test.crt \
  -subj "/C=US/ST=State/L/City/O=Test/CN=test.local"

# Clean up test files
rm test.key test.crt
```

#### **Verify Domain Resolution**:
```bash
# Check if domain resolves to localhost
ping your-domain.com

# Check hosts file entries
grep your-domain.com /etc/hosts
```

#### **Check SSL Certificate**:
```bash
# Verify certificate details
openssl x509 -in your-domain.crt -noout -subject -dates

# Test certificate with domain
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

---

## 🎯 **Advanced Usage**

### **Script Flags and Options**

#### **Interactive Mode (Default)**
```bash
./scripts/development/run.sh
```
- Prompts for custom domain setup
- Interactive confirmation for all steps
- Best for first-time setup and domain changes

#### **Default Mode**
```bash
./scripts/development/run.sh -default
```
- Skips custom domain setup (assumes already configured)
- Uses existing configuration
- Auto-accepts all prompts
- Best for daily development

#### **Quick Mode**
```bash
./scripts/development/run.sh -quick
```
- Uses all default values
- No user interaction
- Uses default domain: auth.pingdemo.com
- Best for automated scripts and CI/CD

#### **Help**
```bash
./scripts/development/run.sh --help
```
- Shows comprehensive help documentation
- Lists all available options
- Provides usage examples

### **Environment Variables**

The script creates `.env.local` with these variables:

```bash
# Domain Configuration
VITE_APP_DOMAIN=https://your-domain.com
USE_CUSTOM_DOMAIN=true

# Server URLs
FRONTEND_URL=https://your-domain.com:3000
BACKEND_URL=https://your-domain.com:8443

# SSL Configuration
SSL_KEY_FILE=your-domain.com.key
SSL_CERT_FILE=your-domain.com.crt

# Custom Domain Mode
CUSTOM_DOMAIN_HOST=your-domain.com
```

### **Log File Management**

The script offers to tail various log files:

| Log File | Description |
|----------|-------------|
| `pingone-api.log` | All PingOne API calls (proxy + direct) |
| `real-api.log` | Direct PingOne API calls only |
| `server.log` | General server logs |
| `sms.log` | SMS flow logs |
| `email.log` | Email flow logs |
| `whatsapp.log` | WhatsApp flow logs |
| `voice.log` | Voice flow logs |
| `fido.log` | FIDO2/WebAuthn logs |
| `backend.log` | Backend application logs |
| `frontend.log` | Frontend/Vite logs |
| `startup.log` | Script startup logs |

### **Use Case Examples**

#### **New Developer Setup**:
```bash
git clone <repo>
cd oauth-playground
./scripts/development/run.sh
# → Includes full custom domain setup
# → Prompts for domain (default: auth.pingdemo.com)
# → Configures everything needed
# → Starts servers
```

#### **Daily Development**:
```bash
./scripts/development/run.sh -default
# → Skips custom domain setup
# → Uses existing configuration
# → Starts servers quickly
```

#### **Domain Change**:
```bash
./scripts/development/run.sh
# → Detects existing setup
# → Prompts to clear (choose 'y')
# → Clears automatically
# → Sets up new domain
```

#### **Automated Scripts**:
```bash
./scripts/development/run.sh -quick
# → Uses all defaults
# → No user interaction
# → Starts servers
```

#### **CI/CD Pipeline**:
```bash
./scripts/development/run.sh -default &
# → Runs in background
# → Uses existing configuration
# → No interaction required
```

---

## 📚 **Additional Resources**

### **Documentation Files**
- `README.md` - Main project documentation
- `DOMAIN-VALIDATION.md` - Domain format rules and examples
- `SSL-CERTIFICATE-TROUBLESHOOTING.md` - SSL certificate troubleshooting guide
- `OPENSSL-AUTO-INSTALLATION.md` - OpenSSL installation guide

### **Useful Commands**
```bash
# Check server status
lsof -i :3000-3001

# View logs
tail -f logs/pingone-api.log
tail -f logs/server.log

# Check SSL certificates
openssl x509 -in your-domain.crt -noout -subject -dates

# Verify domain resolution
ping your-domain.com
nslookup your-domain.com

# Check git status
git status
git log --oneline -10
```

### **Getting Help**
```bash
# Script help
./scripts/development/run.sh --help

# Node.js help
npm --help
npm start --help

# OpenSSL help
openssl help
openssl version -a
```

---

## 🎉 **Success Indicators**

When everything is working correctly, you should see:

```bash
🎉 Server startup completed successfully!

✅ Frontend server started: https://your-domain.com:3000
✅ Backend server started: https://your-domain.com:8443
✅ Backend health check passed
✅ Frontend health check passed

🌐 Access your application:
   Frontend: https://your-domain.com:3000
   Backend:  https://your-domain.com:8443/docs
   Protect Portal: https://your-domain.com:3000/protect-portal

📋 Log files:
   pingone-api.log - All PingOne API calls
   server.log - General server logs
   startup.log - Script startup logs
```

---

## 🔄 **Maintenance**

### **Regular Tasks**
- **Update dependencies**: `npm update`
- **Check certificates**: Renew SSL certificates annually
- **Clean logs**: Remove old log files periodically
- **Backup configuration**: Keep backup of `.env.local`

### **Periodic Maintenance**
```bash
# Check certificate expiration
openssl x509 -in your-domain.crt -noout -dates

# Clean old log files (older than 30 days)
find logs/ -name "*.log" -mtime +30 -delete

# Backup configuration
cp .env.local .env.local.backup.$(date +%Y%m%d)

# Check for updates
npm outdated
```

---

## 📞 **Support**

If you encounter issues:

1. **Check this guide** - Most common issues are covered here
2. **Run with help** - `./scripts/development/run.sh --help`
3. **Check logs** - Look in `logs/` directory for detailed error messages
4. **Verify requirements** - Ensure Node.js, npm, and OpenSSL are installed
5. **Check permissions** - Ensure script has execute permissions: `chmod +x scripts/development/run.sh`

---

*This comprehensive startup guide covers all aspects of setting up and running the OAuth Playground with custom domain support. For the most up-to-date information, always check the main README.md file.*

**Last Updated: 2025-02-20**
**Version: 2.0.0**
**Status: Production Ready**
