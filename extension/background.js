const API_BASE_URL = 'http://localhost:8000';
let watchQueue = [];
let currentUser = null;

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.sessionToken) {
    console.log('Token updated, refreshing auth');
    getCurrentUser();
  }
});

async function getCurrentUser() {
  const { sessionToken } = await chrome.storage.local.get('sessionToken');
  if (!sessionToken) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { 'Authorization': `Bearer ${sessionToken}` }
    });
    if (response.ok) {
      currentUser = await response.json();
      console.log('Authenticated as:', currentUser.email);
      return currentUser;
    }
  } catch (err) {
    console.error('Auth check failed:', err);
  }
  return null;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'VIDEO_WATCHED') {
    const isDuplicate = watchQueue.some(item => 
      item.videoId === message.data.videoId && 
      Math.abs(new Date(item.watchedAt) - new Date(message.data.watchedAt)) < 10000
    );
    
    if (!isDuplicate) {
      watchQueue.push(message.data);
      updateBadge();
      syncToBackend();
    }
    sendResponse({ success: true });
  }
  return true;
});

async function syncToBackend() {
  const { sessionToken } = await chrome.storage.local.get('sessionToken');
  if (!sessionToken || watchQueue.length === 0) return;

  try {
    const response = await fetch(`${API_BASE_URL}/ingest/extension`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({ videos: watchQueue })
    });

    if (response.ok) {
      console.log('Sync Success');
      watchQueue = [];
      updateBadge();
    }
  } catch (err) {
    console.error('Sync network error:', err);
  }
}

function updateBadge() {
  const text = watchQueue.length > 0 ? watchQueue.length.toString() : '';
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });
}

chrome.alarms.create('periodicSync', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener(syncToBackend);

getCurrentUser();

if (chrome.alarms) {
  chrome.alarms.create('periodicSync', { periodInMinutes: 1 });
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'periodicSync') {
    syncToBackend();
  }
});

getCurrentUser();