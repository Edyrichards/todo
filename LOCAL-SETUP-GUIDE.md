# 🚀 Local Setup Guide - Material Todo App

This guide will help you run the Material Todo app on your local machine. There are two versions available:

## 📋 **Prerequisites**

Before starting, make sure you have these installed:

- **Node.js 18+** (recommended: Node.js 20+)
- **npm** or **bun** (bun is recommended for faster performance)
- **Git** (to clone the repository)

### Check Your Setup:
```bash
node --version    # Should be 18+
npm --version     # Should be 6+
# Optional but recommended:
bun --version     # Should be 1.0+
```

---

## 🎯 **Option 1: Basic Working Version (Recommended to Start)**

This is the stable, simplified version that's guaranteed to work:

### **Step 1: Get the Code**
```bash
# Clone the repository
git clone https://github.com/Edyrichards/todo.git
cd todo

# Navigate to the working version
cd todo-app-fixed
```

### **Step 2: Install Dependencies**
```bash
# Using bun (recommended - faster)
bun install

# OR using npm
npm install
```

### **Step 3: Start the Development Server**
```bash
# Using bun
bun run dev

# OR using npm
npm run dev
```

### **Step 4: Open in Browser**
- Open your browser and go to: **http://localhost:5173**
- You should see the Material Todo app with sample tasks!

### **✅ What You Get:**
- Clean Material Design 3 interface
- 6 pre-loaded sample tasks
- Real-time search functionality
- Task completion toggling
- Priority system with visual indicators
- Persistent data storage
- Responsive design

---

## 🔥 **Option 2: Full-Featured Version (All Advanced Features)**

This version includes Calendar, Kanban, Analytics, PWA features, and more:

### **Step 1: Navigate to Full Version**
```bash
# From the main todo directory
cd material-todo-app
```

### **Step 2: Install Dependencies**
```bash
# Clear any cached dependencies first
rm -rf node_modules
rm -f bun.lock package-lock.json

# Fresh install
bun install
# OR
npm install
```

### **Step 3: Start Development Server**
```bash
# Try bun first
bun run dev

# If that fails, try npm
npm run dev

# If both fail, try building first
bun run build && bun run preview
```

### **Step 4: Access the App**
- Go to: **http://localhost:5173** (or the port shown in terminal)

### **✅ What You Get (Additional Features):**
- 📅 **Calendar View**: Month/Week/Day views with task scheduling
- 📋 **Kanban Board**: Drag & drop task management
- 📊 **Analytics Dashboard**: Task completion trends and insights
- 📱 **PWA Features**: Offline capability, installable app
- 🤳 **Mobile Gestures**: Swipe actions, pull-to-refresh
- 🔄 **Recurring Tasks**: Daily/weekly/monthly task patterns
- ✨ **Advanced Animations**: Smooth transitions and micro-interactions
- 🌐 **WebSocket Integration**: Real-time collaboration ready

---

## 🖥️ **Option 3: Full Backend Integration (Real-time Features)**

For real-time collaboration and data synchronization:

### **Step 1: Set Up Backend Environment**
```bash
# From the main todo directory
cd backend

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database settings
```

### **Step 2: Start Database Services**
```bash
# Make sure Docker is installed and running
docker --version

# Start PostgreSQL and Redis
chmod +x dev-setup.sh
./dev-setup.sh start
```

### **Step 3: Initialize Database**
```bash
# Run database migrations
npm run migrate

# Seed with sample data (optional)
npm run seed
```

### **Step 4: Start Backend Server**
```bash
# Start the backend API
npm run dev
# Backend will run on http://localhost:3001
```

### **Step 5: Start Frontend with Backend**
```bash
# In a new terminal, go to frontend
cd ../material-todo-app

# Start frontend
bun run dev
# Frontend will run on http://localhost:5173
```

### **✅ What You Get (Additional Features):**
- 🔄 **Real-time Sync**: Changes sync across all devices
- 👥 **Multi-user Support**: Team collaboration
- 🔐 **Authentication**: User accounts and secure login
- ☁️ **Cloud Storage**: Data stored in PostgreSQL
- 📡 **WebSocket Updates**: Live typing indicators and presence

---

## 📱 **Quick Start Commands Summary**

### **Basic Version (Fastest Setup):**
```bash
git clone https://github.com/Edyrichards/todo.git
cd todo/todo-app-fixed
bun install && bun run dev
```

### **Full Frontend Only:**
```bash
git clone https://github.com/Edyrichards/todo.git
cd todo/material-todo-app
bun install && bun run dev
```

### **Full Stack (Frontend + Backend):**
```bash
git clone https://github.com/Edyrichards/todo.git
cd todo

# Terminal 1: Backend
cd backend && npm install && ./dev-setup.sh start && npm run dev

# Terminal 2: Frontend  
cd ../material-todo-app && bun install && bun run dev
```

---

## 🛠️ **Troubleshooting**

### **If Build Fails:**
```bash
# Clear everything and restart
rm -rf node_modules
rm -f package-lock.json bun.lock
bun install
bun run dev
```

### **If Port 5173 is Busy:**
```bash
# Kill any existing processes
pkill -f vite
# Or use a different port
bun run dev -- --port 3000
```

### **If Dependencies Won't Install:**
```bash
# Try using npm instead of bun
npm install --legacy-peer-deps
npm run dev
```

### **Backend Database Issues:**
```bash
# Reset database
cd backend
./dev-setup.sh reset
npm run migrate
```

---

## 🎉 **What's Next?**

Once you have it running locally:

1. **Explore the Features**: Try creating tasks, using search, toggling completion
2. **Customize**: Modify colors, add your own tasks, adjust categories  
3. **Develop**: Add new features, integrate with your own APIs
4. **Deploy**: Use Vercel/Netlify for frontend, Railway/Render for backend

---

## 📞 **Need Help?**

If you run into issues:
1. Check the terminal for error messages
2. Make sure all prerequisites are installed
3. Try the basic version first (todo-app-fixed)
4. Clear node_modules and reinstall dependencies
5. Check if ports 5173 and 3001 are available

The basic version (todo-app-fixed) is guaranteed to work and gives you a fully functional todo app to start with! 🚀