# ⚡ Quick Setup Commands - After PR #3 Merge

## 🎯 **Essential Commands Only**

### **1. Get the Code**
```bash
# Fresh clone (recommended)
git clone https://github.com/Edyrichards/todo.git
cd todo

# OR update existing repo
cd your-todo-directory
git pull origin main
```

### **2. Start Basic Version**
```bash
cd todo-app-fixed
npm install && npm run dev
# Success: http://localhost:5173
```

### **3. Start Full-Featured Version (Optional)**
```bash
# In new terminal
cd material-todo-app
npm install && npm run dev --port 3000
# Success: http://localhost:3000
```

## 🛠️ **If Something Goes Wrong**

### **Kill Conflicts:**
```bash
npx kill-port 5173
pkill -f vite
```

### **Clean Install:**
```bash
rm -rf node_modules
rm -f package-lock.json
npm install --legacy-peer-deps
npm run dev
```

### **Emergency Reset:**
```bash
cd todo-app-fixed  # Always start here - guaranteed to work
rm -rf node_modules
npm cache clean --force
npm install
npm run dev
```

## ✅ **Success = You See:**
- Material Design todo app at localhost:5173
- 6 sample tasks with search and completion
- Smooth animations and responsive design

## 🔥 **Advanced Features (Full Version):**
- Calendar views with task scheduling
- Kanban board with drag & drop
- Analytics dashboard
- Mobile gestures and PWA features