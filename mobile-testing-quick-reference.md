# 🚀 Mobile Testing Quick Commands

## Setup Commands (Choose One Path)

### **Path A: Quick Setup (Stable Version)**
```bash
cd todo-app-fixed
bun install
bun run dev --host 0.0.0.0
```

### **Path B: Full Features (Enhanced Version)**
```bash
cd material-todo-app  
bun install
bun run dev --host 0.0.0.0
```

### **Path C: Auto Setup Script**
```bash
# Make script executable and run
chmod +x quick-mobile-setup-script.txt
./quick-mobile-setup-script.txt
```

---

## Find Your IP Address

### **Windows:**
```cmd
ipconfig
# Look for IPv4 Address (192.168.x.x)
```

### **Mac/Linux:**
```bash
hostname -I
# Or: ifconfig | grep "inet " | grep -v 127.0.0.1
```

---

## Access URLs

- **Local**: http://localhost:5173
- **Mobile**: http://YOUR_IP_ADDRESS:5173
- **Example**: http://192.168.1.100:5173

---

## HTTPS Setup (For iOS)

```bash
# Install ngrok (one-time)
npm install -g ngrok

# Terminal 1: Start app
bun run dev

# Terminal 2: Create tunnel  
ngrok http 5173
# Use the https:// URL on mobile
```

---

## Alternative Ports

```bash
# If port 5173 is busy
bun run dev --host 0.0.0.0 --port 3000
bun run dev --host 0.0.0.0 --port 8080
```

---

## Troubleshooting

### **Can't Connect from Mobile:**
- [ ] Same WiFi network?
- [ ] Firewall blocking port 5173?
- [ ] Try different port (3000, 8080)

### **No Haptics on iOS:**
- [ ] Use HTTPS (ngrok)
- [ ] Enable haptics in Settings
- [ ] Use Safari browser

### **Gestures Not Working:**
- [ ] Add to home screen
- [ ] Disable browser pull-to-refresh
- [ ] Try slower, deliberate swipes

---

## Test Features Checklist

### **Basic Tests:**
- [ ] Tap buttons → Feel haptic
- [ ] Long press task → Progressive haptics
- [ ] Navigate between views → Smooth transitions

### **Advanced Tests (material-todo-app only):**
- [ ] Swipe task right → Complete with celebration
- [ ] Swipe task left → Delete with warning
- [ ] Pull to refresh → Progressive feedback
- [ ] Create 100+ tasks → Virtual scrolling activates

---

## Stop Server
```bash
Ctrl+C  # In terminal running the dev server
```