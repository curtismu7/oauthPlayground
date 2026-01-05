# Setup Instructions for New Machine

**Repository:** `oauthPlayground`  
**GitHub URL:** `git@github.com:curtismu7/oauthPlayground.git` or `https://github.com/curtismu7/oauthPlayground.git`  
**Restore Point Tag:** `restore-saturday-morning`

---

## Quick Start

### Step 1: Choose a Directory

You can clone the project anywhere you want. Common locations:
- **Home directory**: `~/` or `~/Projects/`
- **Development directory**: `~/dev/` or `~/code/`
- **Documents**: `~/Documents/`

### Step 2: Clone the Repository

```bash
# Navigate to where you want the project (optional - git clone creates the directory)
cd ~/Projects  # or wherever you want it

# Clone the repository (SSH - if you have SSH keys set up)
git clone git@github.com:curtismu7/oauthPlayground.git

# OR use HTTPS if you don't have SSH keys
git clone https://github.com/curtismu7/oauthPlayground.git

# Change into the project directory
cd oauthPlayground
```

### Step 3: Verify You're in the Right Place

After cloning, you should be in the **project root directory** (`oauthPlayground/`), which contains:
- `package.json`
- `server.js`
- `src/` folder
- `docs/` folder
- `.git/` folder

Verify with:
```bash
# Should show you're in oauthPlayground directory
pwd

# Should show package.json exists
ls -la package.json

# Should show the git repository
git status
```

### Step 4: Checkout the Restore Point (Optional)

If you want to restore to the `restore-saturday-morning` tag:
```bash
# Make sure tags are fetched
git fetch --tags

# Checkout the tag (this will put you in detached HEAD state)
git checkout restore-saturday-morning

# OR if you want to create a branch from the tag:
git checkout -b restore-saturday-morning-branch restore-saturday-morning
```

**Note:** If you just want the latest code, skip this step and proceed to Step 5.

### Step 5: Install Dependencies

```bash
# Make sure you're in the project root directory (oauthPlayground/)
npm install
```

### Step 6: Start the Application

```bash
# Start both frontend and backend
npm start

# OR start them separately:
# Terminal 1 - Frontend
npm run start:frontend

# Terminal 2 - Backend
npm run start:backend
```

The application will be available at:
- **Frontend:** https://localhost:3000
- **Backend:** http://localhost:3001

---

## Prerequisites

- **Node.js**: Version 16.0 or higher (`node --version`)
- **npm**: Version 6.0 or higher (`npm --version`)
- **Git**: For cloning the repository

---

## Important Notes

1. **Project Directory:** After cloning, the project will be in a folder called `oauthPlayground` wherever you ran the `git clone` command.

2. **Project Root:** The directory you want to be in is the `oauthPlayground/` folder (the project root). This is where `package.json` and `server.js` are located.

3. **Environment Variables:** The project should have a `.env` file with PingOne configuration. If it's missing, you may need to create one based on `.env.example`.

4. **Git Branch:** By default, you'll be on the `main` branch after cloning. Use `git checkout restore-saturday-morning` if you want the specific restore point.

---

## Troubleshooting

### Git Clone Fails
- **SSH Error:** Use HTTPS instead: `git clone https://github.com/curtismu7/oauthPlayground.git`
- **Authentication:** Make sure you're logged into GitHub or have SSH keys set up

### npm install Fails
- Check Node.js version: `node --version` (must be 16+)
- Try: `rm -rf node_modules package-lock.json && npm install`
- On macOS/Linux, if permission errors: `sudo npm install`

### Application Won't Start
- Verify you're in the project root: `pwd` should show `.../oauthPlayground`
- Check Node.js version: `node --version`
- Verify `.env` file exists
- Check logs: `tail -f backend.log` or `tail -f logs/server.log`

---

## Current Directory Structure

After cloning, your directory structure should look like:
```
oauthPlayground/
├── src/              # Source code
├── docs/             # Documentation (including master documents)
├── server.js         # Backend server
├── package.json      # Dependencies
├── .env              # Environment variables (if exists)
└── ... (other files)
```

---

## Git Commands Reference

```bash
# Check current branch
git branch

# Check status
git status

# Pull latest changes
git pull origin main

# List all tags
git tag --list

# Checkout specific tag
git checkout restore-saturday-morning

# Switch back to main branch
git checkout main

# See commit history
git log --oneline -10
```

---

## Summary

1. **Clone repository:** `git clone git@github.com:curtismu7/oauthPlayground.git`
2. **Enter directory:** `cd oauthPlayground`
3. **Install dependencies:** `npm install`
4. **Start application:** `npm start`
5. **Open browser:** https://localhost:3000

The **project root directory** (`oauthPlayground/`) is where all commands should be run from.

