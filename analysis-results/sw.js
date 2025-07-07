import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from 'workbox-strategies';

// Precache all static assets
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Cache strategy for API calls
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3,
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          return response.status === 200 ? response : null;
        },
      },
    ],
  })
);

// Cache strategy for images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images-cache',
    plugins: [
      {
        cacheWillUpdate: async ({ response }) => {
          return response.status === 200 ? response : null;
        },
      },
    ],
  })
);

// Cache strategy for static assets
registerRoute(
  ({ request }) => 
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'document',
  new StaleWhileRevalidate({
    cacheName: 'static-cache',
  })
);

// Push notification handling
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    image: data.image,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      taskId: data.taskId,
      action: data.action
    },
    actions: [
      {
        action: 'complete',
        title: '✅ Mark Complete',
        icon: '/icons/action-complete.png'
      },
      {
        action: 'postpone',
        title: '⏰ Postpone',
        icon: '/icons/action-postpone.png'
      },
      {
        action: 'view',
        title: '👁️ View Task',
        icon: '/icons/action-view.png'
      }
    ],
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    tag: data.tag || 'task-reminder',
    renotify: true,
    timestamp: Date.now()
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const action = event.action;
  const taskId = event.notification.data?.taskId;
  const url = event.notification.data?.url || '/';

  if (action === 'complete' && taskId) {
    // Send message to app to complete task
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        if (clients.length > 0) {
          clients[0].postMessage({
            type: 'COMPLETE_TASK',
            taskId: taskId
          });
        }
      })
    );
  } else if (action === 'postpone' && taskId) {
    // Send message to app to postpone task
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        if (clients.length > 0) {
          clients[0].postMessage({
            type: 'POSTPONE_TASK', 
            taskId: taskId
          });
        }
      })
    );
  } else {
    // Default action - open the app
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        // Check if app is already open
        for (const client of clients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window if app not open
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
    );
  }
});

// Background sync for offline task creation
self.addEventListener('sync', (event) => {
  if (event.tag === 'task-sync') {
    event.waitUntil(syncTasks());
  }
});

async function syncTasks() {
  try {
    // Get pending tasks from IndexedDB
    const pendingTasks = await getPendingTasks();
    
    for (const task of pendingTasks) {
      try {
        // Attempt to sync with server
        const response = await fetch('/api/tasks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(task),
        });
        
        if (response.ok) {
          // Remove from pending queue
          await removePendingTask(task.id);
        }
      } catch (error) {
        console.log('Failed to sync task:', task.id);
      }
    }
  } catch (error) {
    console.log('Background sync failed:', error);
  }
}

// Helper functions for IndexedDB operations
async function getPendingTasks() {
  // Implementation would connect to IndexedDB
  return [];
}

async function removePendingTask(taskId) {
  // Implementation would remove from IndexedDB
}

// Install event
self.addEventListener('install', (event) => {
  console.log('Service worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service worker activating...');
  event.waitUntil(self.clients.claim());
});

// Share target handling
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  if (url.searchParams.has('share-target')) {
    event.respondWith(handleShareTarget(event.request));
  }
});

async function handleShareTarget(request) {
  const url = new URL(request.url);
  const title = url.searchParams.get('title') || '';
  const text = url.searchParams.get('text') || '';
  const sharedUrl = url.searchParams.get('url') || '';
  
  // Combine shared content into task description
  let description = text;
  if (sharedUrl) {
    description += sharedUrl ? `\n\nShared link: ${sharedUrl}` : '';
  }
  
  // Redirect to app with pre-filled task data
  const taskData = encodeURIComponent(JSON.stringify({
    title: title || 'Shared Content',
    description: description,
    isShared: true
  }));
  
  return Response.redirect(`/?shared=${taskData}`, 302);
}