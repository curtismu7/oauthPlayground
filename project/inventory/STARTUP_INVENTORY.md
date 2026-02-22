# Startup Inventory

**Last Updated**: February 21, 2026  
**Total Components**: 15  
**Purpose**: Track startup functionality, scripts, domain management, and prevent regressions

---

## 🔎 Quick Links (Start here when testing startup changes)

- **Components Table** — Jump to all startup components and their status
- **Scripts Inventory** — All startup-related scripts and their purposes
- **Domain Management** — Custom domain setup and management components
- **SSL Configuration** — SSL certificate generation and management
- **Documentation** — Startup guides and user documentation
- **Testing Commands** — Copy/paste commands for startup verification

> Tip: Use your editor's outline/sidebar view and search for the exact headings above.

---

## 📋 Components Table

| Component | Status | Impact | Category | Description | Location | Dependencies |
|-----------|--------|--------|----------|-------------|----------|--------------|
| **run.sh** | ✅ ACTIVE | Critical | Main Script | Primary startup script with integrated domain setup | `scripts/development/run.sh` | Node.js, npm, OpenSSL |
| **STARTUP-GUIDE.md** | ✅ ACTIVE | High | Documentation | Comprehensive startup and domain guide | `STARTUP-GUIDE.md` | None |
| **README.md** | ✅ ACTIVE | High | Documentation | Main project overview and quick start | `README.md` | None |
| **test-custom-domain-startup.sh** | ✅ ACTIVE | Medium | Testing | Test script for domain functionality | `test-custom-domain-startup.sh` | run.sh |
| **clear_domain_setup()** | ✅ ACTIVE | High | Function | Clears existing domain configuration | `run.sh:132-203` | None |
| **setup_custom_domain()** | ✅ ACTIVE | High | Function | Main domain setup with validation | `run.sh:205-450` | OpenSSL, hosts file |
| **validate_domain()** | ✅ ACTIVE | Medium | Function | Validates domain format (xxx.xxxxxx.xxx) | `run.sh:450-480` | None |
| **generate_ssl_certificates()** | ✅ ACTIVE | High | Function | Generates SSL certificates for domains | `run.sh:550-600` | OpenSSL |
| **configure_hosts_file()** | ✅ ACTIVE | High | Function | Configures hosts file for domain resolution | `run.sh:500-540` | System permissions |
| **configure_browser_trust()** | ✅ ACTIVE | Medium | Function | Configures browser trust (macOS) | `run.sh:610-650` | macOS Keychain |
| **read_custom_domain()** | ✅ ACTIVE | High | Function | Reads domain configuration from .env.local | `run.sh:61-120` | .env.local |
| **show_setup_banner()** | ✅ ACTIVE | Low | Function | Displays setup information banner | `run.sh:650-700` | None |
| **check_openssl()** | ✅ ACTIVE | Medium | Function | Checks OpenSSL availability | `run.sh:480-500` | OpenSSL |
| **install_openssl()** | ✅ ACTIVE | Medium | Function | Installs OpenSSL on different OS | `run.sh:520-550` | Package managers |
| **detect_os()** | ✅ ACTIVE | Medium | Function | Detects operating system | `run.sh:460-480` | None |

---

## 🚀 Scripts Inventory

### **Primary Scripts**

#### **`scripts/development/run.sh`** - Main Startup Script
- **Purpose**: Primary script for all startup operations
- **Features**: 
  - Custom domain setup and management
  - Server startup and health checks
  - SSL certificate generation
  - Hosts file configuration
  - Multiple operation modes
- **Flags**:
  - `--help` - Show comprehensive help
  - `-default` - Skip setup, use existing configuration
  - `-quick` - Use all defaults, no prompts
- **Dependencies**: Node.js, npm, OpenSSL, system permissions
- **Status**: ✅ Production Ready

#### **`test-custom-domain-startup.sh`** - Testing Script
- **Purpose**: Test custom domain functionality
- **Features**:
  - Tests domain setup process
  - Verifies .env.local creation
  - Tests clear functionality
  - Validates environment variables
- **Dependencies**: run.sh
- **Status**: ✅ Active

### **Deprecated Scripts**

#### **`scripts/dev/start-custom-domain.sh`** - DEPRECATED
- **Status**: ❌ Deprecated
- **Replacement**: `scripts/development/run.sh`
- **Reason**: Functionality integrated into main script
- **Action**: Shows deprecation warning and directs users to run.sh

#### **`setup-custom-domain.sh`** - DEPRECATED
- **Status**: ❌ Deprecated
- **Replacement**: `scripts/development/run.sh`
- **Reason**: Functionality integrated into main script
- **Action**: Removed, functionality now in run.sh

---

## 🌐 Domain Management Components

### **Domain Setup Flow**
1. **Detection** - `read_custom_domain()` detects existing configuration
2. **Validation** - `validate_domain()` validates format (xxx.xxxxxx.xxx)
3. **Clear Option** - `clear_domain_setup()` removes existing setup if requested
4. **Configuration** - `setup_custom_domain()` handles complete setup process
5. **SSL Generation** - `generate_ssl_certificates()` creates certificates
6. **Hosts File** - `configure_hosts_file()` configures domain resolution
7. **Browser Trust** - `configure_browser_trust()` sets up certificate trust

### **Domain Format Requirements**
- **Format**: `xxx.xxxxxx.xxx`
- **Subdomain**: 2+ characters, alphanumeric and hyphens
- **Domain**: 2+ characters, alphanumeric and hyphens
- **TLD**: 2-10 characters, letters only
- **Examples**: `auth.pingdemo.com`, `api.myapp.com`, `app.example.org`

### **Files Managed**
- **`.env.local`** - Main domain configuration
- **`{domain}.crt`** - SSL certificate file
- **`{domain}.key`** - SSL private key file
- **`{domain}.crt.backup`** - Certificate backup
- **`{domain}.key.backup`** - Key backup

---

## 🔐 SSL Configuration Components

### **SSL Certificate Generation**
- **Function**: `generate_ssl_certificates()`
- **Tool**: OpenSSL
- **Algorithm**: RSA 2048-bit
- **Validity**: 365 days
- **Format**: X.509 self-signed certificate
- **Dependencies**: OpenSSL installation

### **Browser Trust Configuration**
- **Function**: `configure_browser_trust()`
- **Platform**: macOS (automatic), Linux/Windows (manual)
- **Method**: macOS Keychain integration
- **Fallback**: Manual installation instructions

### **SSL File Management**
- **Generation**: Automatic during domain setup
- **Backup**: Automatic backup of existing certificates
- **Cleanup**: Handled by `clear_domain_setup()`
- **Verification**: Certificate details displayed after generation

---

## 📚 Documentation Components

### **Primary Documentation**

#### **`STARTUP-GUIDE.md`** - Comprehensive Guide
- **Purpose**: Single source of truth for all startup information
- **Sections**:
  - Quick Start
  - Startup Scripts
  - Custom Domain Setup
  - Domain Management
  - SSL Configuration
  - Troubleshooting
  - Advanced Usage
  - Maintenance
- **Status**: ✅ Active and comprehensive

#### **`README.md`** - Project Overview
- **Purpose**: Main project documentation
- **Updated**: References STARTUP-GUIDE.md for detailed instructions
- **Quick Start**: Integrated with run.sh script
- **Status**: ✅ Active

### **Consolidated Documentation**
- **Previous Files**: 15+ separate documentation files consolidated
- **New Structure**: Single comprehensive guide (STARTUP-GUIDE.md)
- **Benefits**: Easier maintenance, better user experience
- **Status**: ✅ Consolidation complete

---

## 🧪 Testing Commands

### **Basic Startup Testing**
```bash
# Test help functionality
./scripts/development/run.sh --help

# Test quick mode
./scripts/development/run.sh -quick

# Test default mode
./scripts/development/run.sh -default

# Test interactive setup
./scripts/development/run.sh
```

### **Domain Management Testing**
```bash
# Test domain change
rm .env.local && ./scripts/development/run.sh

# Test clear functionality
./scripts/development/run.sh
# Answer 'y' to clear prompt

# Test domain validation
./scripts/development/run.sh
# Enter invalid domain to test validation
```

### **SSL Certificate Testing**
```bash
# Verify OpenSSL installation
openssl version

# Test certificate generation
./scripts/development/run.sh
# Check generated certificate files

# Verify certificate details
openssl x509 -in your-domain.crt -noout -subject -dates
```

### **Hosts File Testing**
```bash
# Check domain resolution
ping your-domain.com

# Verify hosts file entries
grep your-domain.com /etc/hosts

# Test SSL connection
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

### **Test Script Execution**
```bash
# Run domain functionality tests
./test-custom-domain-startup.sh

# Verify all components
./scripts/development/run.sh --help
```

---

## 🚨 Prevention Commands

### **Before Making Startup Changes**
```bash
# Verify current functionality
./scripts/development/run.sh --help

# Test domain setup
./test-custom-domain-startup.sh

# Check SSL functionality
openssl version
```

### **After Making Startup Changes**
```bash
# Test all modes
./scripts/development/run.sh --help
./scripts/development/run.sh -quick
./scripts/development/run.sh -default

# Test domain functionality
./test-custom-domain-startup.sh

# Verify documentation references
grep -r "STARTUP-GUIDE.md" . --exclude-dir=node_modules
```

### **Regression Prevention**
```bash
# Ensure no deprecated script references
find . -name "*.sh" -exec grep -l "setup-custom-domain.sh\|start-custom-domain.sh" {} \;

# Verify all print functions are defined
grep -n "print_info\|print_success\|print_error" scripts/development/run.sh

# Check function definition order
grep -n "print_info()" scripts/development/run.sh
```

---

## 📊 Status Summary

### **✅ Active Components (15)**
- Main startup script with integrated functionality
- Comprehensive documentation
- Domain management system
- SSL configuration
- Testing framework
- Cross-platform support

### **❌ Deprecated Components (3)**
- Old setup scripts (replaced by integrated functionality)
- Separate documentation files (consolidated)
- Legacy startup methods

### **🔄 Recent Changes**
- **Integration**: Custom domain setup integrated into main script
- **Consolidation**: 15+ documentation files consolidated into STARTUP-GUIDE.md
- **Bug Fixes**: Function definition order fixed
- **Enhanced Features**: Domain clearing functionality added
- **Updated Documentation**: README.md updated to reference new workflow

---

## 🎯 Quality Gates

### **Must Pass Before Release**
1. ✅ All script modes work without errors
2. ✅ Domain setup and clearing functionality works
3. ✅ SSL certificate generation successful
4. ✅ Documentation is accurate and up-to-date
5. ✅ No references to deprecated scripts
6. ✅ All print functions properly defined

### **Testing Checklist**
- [ ] `./scripts/development/run.sh --help` works
- [ ] `./scripts/development/run.sh -quick` works
- [ ] `./scripts/development/run.sh -default` works
- [ ] Domain setup process completes successfully
- [ ] Domain clearing functionality works
- [ ] SSL certificates generated correctly
- [ ] Hosts file configured properly
- [ ] Browser trust configured (macOS)
- [ ] Test script passes all checks
- [ ] Documentation references are correct

---

## 📞 Support and Troubleshooting

### **Common Issues and Solutions**
1. **"print_info: command not found"** - Function definition order (fixed)
2. **SSL generation fails** - Check OpenSSL installation
3. **Hosts file permission denied** - Use sudo or manual configuration
4. **Domain validation fails** - Check format requirements
5. **Browser trust issues** - Manual certificate installation

### **Getting Help**
- **Comprehensive Guide**: `STARTUP-GUIDE.md`
- **Script Help**: `./scripts/development/run.sh --help`
- **Troubleshooting**: Section in STARTUP-GUIDE.md
- **Testing**: `./test-custom-domain-startup.sh`

---

*Startup Inventory maintained to ensure consistent, reliable startup functionality across all development environments.*

**Last Updated**: 2025-02-20  
**Next Review**: 2025-03-20  
**Maintainer**: Development Team  
**Status**: Production Ready
