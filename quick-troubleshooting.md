# 🔧 Quick Environment Check

Run these commands to verify your setup is ready:

## Check Prerequisites:
```bash
# Check Node.js version (should be 18+)
node --version

# Check npm
npm --version

# Check if bun is installed (optional but recommended)
bun --version

# Check if git is working
git --version
```

## Quick Setup Commands:

### For Basic Version (Recommended First):
```bash
cd todo-app-fixed
npm install && npm run dev
```

### For Full Version:
```bash
cd material-todo-app  
rm -rf node_modules && npm install && npm run dev
```

### Kill Conflicting Processes:
```bash
# If port 5173 is busy
npx kill-port 5173
# OR
pkill -f vite
```

## Success URLs:
- **Basic/Full Frontend**: http://localhost:5173
- **Backend API** (if running): http://localhost:3001

## Emergency Reset:
```bash
# If nothing works, try this:
rm -rf node_modules
rm -f package-lock.json bun.lock
npm cache clean --force
npm install
npm run dev
```