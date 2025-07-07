# 🚀 Quick Setup Commands

Copy and paste these commands to get started quickly:

## Option 1: Basic Version (Recommended First)
```bash
# Navigate to the project
cd todo-app-fixed

# Install and run
bun install && bun run dev
# OR
npm install && npm run dev
```

## Option 2: Full-Featured Version
```bash
# Navigate to full version
cd material-todo-app

# Clean install and run
rm -rf node_modules && bun install && bun run dev
# OR
rm -rf node_modules && npm install && npm run dev
```

## Option 3: Full-Stack (Backend + Frontend)

### Terminal 1 (Backend):
```bash
cd backend
npm install
./dev-setup.sh start  # Starts Docker services
npm run migrate       # Set up database
npm run dev          # Start backend server
```

### Terminal 2 (Frontend):
```bash
cd material-todo-app
bun install && bun run dev
# OR
npm install && npm run dev
```

## 🎯 Success URLs:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001 (if running full-stack)

## 🛠️ If Something Goes Wrong:
```bash
# Kill any running processes
pkill -f vite
pkill -f node

# Clean everything
rm -rf node_modules
rm -f package-lock.json bun.lock

# Try again
npm install && npm run dev
```