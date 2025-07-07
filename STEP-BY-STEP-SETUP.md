# Step-by-Step Mobile Testing Setup

## 🎯 Current Status
You're in: `/home/scrapybara/Edyrichards/todo`
We'll use: `material-todo-app` (has all the mobile features!)

## Step 1: Find Your Local IP Address

**Copy and run this command on YOUR computer (not in Scout):**

**For Mac/Linux:**
```bash
# Method 1 (most reliable)
ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1

# Method 2 (simpler)
hostname -I

# Method 3 (if above don't work)
ip route get 1 | awk '{print $7; exit}'
```

**For Windows:**
```cmd
ipconfig | findstr "IPv4"
```

**Example result:** `192.168.1.100` or `10.0.0.100`

---

## Step 2: Start the Development Server

I'll help you run these commands in the Scout environment:

### Navigate to the app directory:
```bash
cd material-todo-app
```

### Install dependencies (if needed):
```bash
bun install
```

### Start the server with network access:
```bash
bun run dev --host
```

The `--host` flag makes it accessible from your phone!

---

## Step 3: Access from Your Phone

1. **Ensure your phone and computer are on the same WiFi network**
2. **Open your phone's browser** (Chrome, Safari, etc.)
3. **Navigate to:** `http://YOUR_IP_ADDRESS:5173`
   
   **Example:** `http://192.168.1.100:5173`

---

## Step 4: Test Mobile Features

Once loaded, try these gestures:
- ✅ **Swipe left** on any task → Delete action
- ✅ **Swipe right** on any task → Complete action  
- ✅ **Long press** on any task → Edit dialog
- ✅ **Pull down** from top → Refresh animation
- ✅ **Double tap** on task text → Toggle completion

---

**Ready? Say "yes" and I'll start running these commands for you!**