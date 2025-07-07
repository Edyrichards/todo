# Mobile Testing Checklist

## Setup Verification
- [ ] App loads at `http://YOUR_IP:5173` on phone
- [ ] No console errors visible
- [ ] Touch targets are appropriately sized
- [ ] Text is readable without zooming

## Core Swipe Gestures
- [ ] **Swipe left** on task card → Delete action appears
- [ ] **Swipe right** on task card → Complete action appears  
- [ ] **Swiping feels smooth** with 60fps animation
- [ ] **Haptic feedback** triggers at swipe threshold
- [ ] **Visual feedback** shows action preview
- [ ] **Swipe back** cancels the action
- [ ] **Full swipe** executes the action

## Touch Interactions
- [ ] **Single tap** on task → Selects/focuses task
- [ ] **Double tap** on task text → Toggles completion
- [ ] **Long press** on task → Opens edit dialog (with haptic)
- [ ] **Long press timing** feels natural (500ms)
- [ ] **Touch targets** are at least 44px (easy to hit)

## Pull-to-Refresh
- [ ] **Pull down** from top of list starts refresh
- [ ] **Visual indicator** appears during pull
- [ ] **Haptic feedback** at trigger point
- [ ] **Release animation** is smooth
- [ ] **Actually refreshes** task data
- [ ] **Works in all views** (List, Calendar, Kanban)

## Haptic Feedback Patterns
- [ ] **Light tap** → Task selection/navigation
- [ ] **Medium tap** → Button presses, toggles
- [ ] **Heavy tap** → Task completion, important actions
- [ ] **Different patterns** for different action types
- [ ] **Progressive feedback** during gesture thresholds
- [ ] **Error feedback** for failed actions

## Mobile Navigation
- [ ] **Bottom navigation** → Easy thumb reach
- [ ] **View switching** → Smooth transitions
- [ ] **Back gesture** → Works with browser back
- [ ] **No conflicts** with system gestures
- [ ] **Safe area handling** → No overlap with notch/indicators

## Floating Action Button (FAB)
- [ ] **Single tap** → Opens new task dialog
- [ ] **Long press** → Shows quick action menu
- [ ] **Positioned well** → Easy thumb access
- [ ] **Doesn't interfere** with scrolling
- [ ] **Haptic feedback** on interactions

## Mobile Dialogs & Forms
- [ ] **Task dialog** → Slides up from bottom (bottom sheet)
- [ ] **Keyboard appears** → Dialog adjusts position
- [ ] **Easy to dismiss** → Tap outside or swipe down
- [ ] **Form inputs** → Properly sized and accessible
- [ ] **Submit actions** → Clear and responsive

## Responsive Design
- [ ] **Portrait orientation** → Everything fits properly
- [ ] **Landscape orientation** → Layout adapts well
- [ ] **Different screen sizes** → Scales appropriately
- [ ] **Font sizes** → Readable on small screens
- [ ] **No horizontal scrolling** → Everything fits viewport

## Performance & Feel
- [ ] **Animations run at 60fps** → Buttery smooth
- [ ] **Touch response** → Immediate visual feedback
- [ ] **No lag** between touch and response
- [ ] **Gestures feel natural** → Like native app
- [ ] **Memory usage** → App doesn't slow down phone

## Advanced Features
- [ ] **Calendar view** → Touch-friendly date selection
- [ ] **Kanban board** → Cards easy to interact with
- [ ] **Analytics charts** → Readable on small screen
- [ ] **Search functionality** → Mobile keyboard works well
- [ ] **Export features** → Download works on mobile

## Edge Cases
- [ ] **Very long task names** → Don't break layout
- [ ] **Many tasks** → Scrolling performance good
- [ ] **Network issues** → Graceful offline handling
- [ ] **Background/foreground** → State preserved
- [ ] **Low battery mode** → Still responsive

## Browser Compatibility
- [ ] **Safari (iOS)** → All features work
- [ ] **Chrome (iOS)** → All features work
- [ ] **Chrome (Android)** → All features work
- [ ] **Firefox (Android)** → All features work
- [ ] **Samsung Internet** → All features work

## Accessibility
- [ ] **Screen reader** → Announces actions properly
- [ ] **High contrast** → Still readable
- [ ] **Large text** → Scales appropriately
- [ ] **Voice control** → Works with voice commands
- [ ] **Motor accessibility** → Alternative input methods work

## Final Experience Check
- [ ] **Overall feel** → Like a native mobile app
- [ ] **Intuitive** → Features discoverable without instruction
- [ ] **Responsive** → Every touch gets immediate feedback
- [ ] **Polished** → Animations and transitions feel premium
- [ ] **Reliable** → Gestures work consistently

## What Success Looks Like

✅ **The app should feel like a native mobile app**
✅ **All gestures should be smooth and responsive**
✅ **Haptic feedback should enhance the experience**
✅ **Touch targets should be easy to hit**
✅ **No accidental actions from normal scrolling**
✅ **Animations should run at 60fps**
✅ **Everything should work without instructions**

## Report Issues

If any item fails:
1. Note which browser and device
2. Check browser console for errors
3. Try different browser/device
4. Note specific steps to reproduce

The mobile experience represents hundreds of hours of optimization and should feel exceptional!