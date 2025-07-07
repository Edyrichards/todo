# Mobile Testing Setup Guide

## Quick Setup for Phone Testing

### 1. Get Your Local IP Address

**On Windows:**
```bash
ipconfig
# Look for your "IPv4 Address" (usually 192.168.x.x or 10.x.x.x)
```

**On Mac/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
# Or use: hostname -I
```

**Example IP:** `192.168.1.100`

### 2. Run the App with Network Access

Navigate to your project and run:

```bash
# Option 1: Using the working todo-app-fixed version
cd todo-app-fixed
bun install
bun run dev --host

# Option 2: Using the full-featured material-todo-app (if builds work)
cd material-todo-app
bun install
bun run dev --host
```

The `--host` flag makes the dev server accessible from other devices on your network.

### 3. Access from Your Phone

1. **Connect your phone to the same WiFi network** as your computer
2. **Open your phone's browser** (Safari, Chrome, etc.)
3. **Go to:** `http://YOUR_IP_ADDRESS:5173`
   - Example: `http://192.168.1.100:5173`

### 4. Test Mobile Features

Once the app loads on your phone, test these features:

#### **Swipe Gestures (Task Cards)**
- ✅ **Swipe left** on any task → Should show delete action with haptic feedback
- ✅ **Swipe right** on any task → Should show complete action with haptic feedback
- ✅ **Long press** on any task → Should open edit dialog with haptic feedback

#### **Pull-to-Refresh**
- ✅ **Pull down** from the top of the task list → Should trigger refresh animation with haptic feedback

#### **Haptic Feedback**
- ✅ **Any tap/swipe** → Should feel vibrations (if your phone supports it)
- ✅ **Different actions** → Should have different vibration patterns

#### **Touch Interactions**
- ✅ **Double tap** on task text → Should toggle completion
- ✅ **Touch targets** → All buttons should be easily tappable (44px minimum)

#### **Mobile Navigation**
- ✅ **Bottom navigation** → Should be easy to reach with thumb
- ✅ **Floating action button** → Should be positioned for easy access

#### **Mobile Dialog**
- ✅ **Add new task** → Dialog should slide up from bottom (bottom sheet style)
- ✅ **Keyboard handling** → Dialog should adjust when keyboard appears

## Troubleshooting

### Can't Access from Phone

1. **Check firewall** - Temporarily disable firewall on your computer
2. **Try different port** - Run with `bun run dev --host --port 3000`
3. **Use mobile hotspot** - Connect computer to phone's hotspot instead

### No Haptic Feedback

1. **Check phone settings** - Enable vibration in system settings
2. **Try different browser** - Chrome usually has better haptic support
3. **Check console** - Open developer tools on phone browser

### App Not Loading

1. **Check console errors** - Long press → Inspect on mobile Chrome
2. **Try incognito mode** - Bypass cache issues
3. **Clear browser cache** - Hard refresh the page

## Feature Verification Checklist

### ✅ Swipe Gestures
- [ ] Left swipe reveals delete action
- [ ] Right swipe reveals complete action
- [ ] Swipe threshold provides haptic feedback
- [ ] Visual feedback during swipe

### ✅ Touch Interactions
- [ ] Long press opens task editor
- [ ] Double tap toggles task completion
- [ ] Touch targets are 44px+ (easy to tap)
- [ ] No accidental taps when scrolling

### ✅ Haptic Feedback
- [ ] Different patterns for different actions
- [ ] Progressive feedback during gestures
- [ ] Confirmation feedback for completions
- [ ] Error feedback for failed actions

### ✅ Pull-to-Refresh
- [ ] Visual indicator appears when pulling
- [ ] Haptic feedback at trigger point
- [ ] Smooth animation and state management
- [ ] Actually refreshes task data

### ✅ Mobile Navigation
- [ ] Bottom nav easy to reach
- [ ] View switching works smoothly
- [ ] Floating action button positioned well
- [ ] No interference with system gestures

### ✅ Responsive Design
- [ ] All text readable without zooming
- [ ] Buttons properly sized for fingers
- [ ] No horizontal scrolling needed
- [ ] Safe area handling (iPhone notch, etc.)

## Advanced Testing

### Test Different Devices
- **iPhone** - Test Safari and Chrome
- **Android** - Test Chrome and Firefox
- **Different screen sizes** - Phone, tablet, etc.

### Test Different Scenarios
- **Portrait/landscape** - Rotate phone during use
- **Poor network** - Test offline/slow connection
- **Background/foreground** - Switch apps and return
- **Different browsers** - Safari, Chrome, Firefox

## Quick Demo Script (5 Minutes)

1. **Load app** → Open browser, navigate to your IP:5173
2. **Add task** → Tap + button, type "Test mobile gestures"
3. **Swipe left** → Delete gesture with haptic feedback
4. **Swipe right** → Complete gesture with haptic feedback
5. **Long press** → Edit task dialog
6. **Pull down** → Refresh animation
7. **Navigate views** → Test bottom navigation
8. **Double tap** → Toggle task completion

## Expected Results

You should experience:
- **Smooth 60fps animations** on all interactions
- **Haptic feedback** that feels intentional and helpful
- **No accidental triggers** - gestures should feel deliberate
- **Immediate visual response** to all touches
- **Native app-like experience** despite being a web app

## Need Help?

If any features aren't working as expected, check:
1. Browser console for JavaScript errors
2. Network tab for failed requests  
3. Device settings for haptic/vibration permissions
4. Try a different browser or device

The mobile experience should feel polished and responsive - like a native app!