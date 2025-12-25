console.log('YouTube Watch Stats: Background script loaded');

const API_BASE_URL = 'http://localhost:8000';
let watchQueue = [];
let syncInterval = 60000;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'VIDEO_WATCHED') {
    console.log('Received video watch event:', message.data);

    watchQueue.push(message.data);
    
    saveToLocalStorage(message.data);
    
    syncToBackend();
  }
});

async function saveToLocalStorage(videoData) {
  try {
    const { watchHistory = [] } = await chrome.storage.local.get('watchHistory');
    watchHistory.push(videoData);

    const trimmed = watchHistory.slice(-1000);
    
    await chrome.storage.local.set({ watchHistory: trimmed });
    console.log('Saved to local storage. Queue size:', trimmed.length);
  } catch (error) {
    console.error('Error saving to local storage:', error);
  }
}

async function syncToBackend() {

  const { sessionToken } = await chrome.storage.local.get('sessionToken');
  
  if (!sessionToken) {
    console.log('No session token, skipping sync');
    return;
  }

  if (watchQueue.length === 0) {
    console.log('Queue empty, nothing to sync');
    return;
  }

  try {
    console.log(`Syncing ${watchQueue.length} videos to backend...`);
    
    const response = await fetch(`${API_BASE_URL}/ingest/extension`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionToken}`
      },
      body: JSON.stringify({
        videos: watchQueue
      })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Sync successful:', result);

      watchQueue = [];

      chrome.action.setBadgeText({ text: '' });
    } else {
      console.error('Sync failed:', response.status);

      if (response.status === 401) {
        await chrome.storage.local.remove('sessionToken');
      }
    }
  } catch (error) {
    console.error('Error syncing to backend:', error);
  }
}

chrome.alarms.create('syncWatchHistory', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'syncWatchHistory') {
    syncToBackend();
  }
});

function updateBadge() {
  if (watchQueue.length > 0) {
    chrome.action.setBadgeText({ 
      text: watchQueue.length.toString() 
    });
    chrome.action.setBadgeBackgroundColor({ 
      color: '#FF0000' 
    });
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SYNC_NOW') {
    syncToBackend().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (message.type === 'GET_STATS') {
    chrome.storage.local.get(['watchHistory', 'sessionToken'], (data) => {
      sendResponse({
        queueSize: watchQueue.length,
        totalTracked: data.watchHistory?.length || 0,
        isLoggedIn: !!data.sessionToken
      });
    });
    return true;
  }
});