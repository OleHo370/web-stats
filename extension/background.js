const API_BASE_URL = 'http://localhost:8000';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'VIDEO_WATCHED') {
    syncOneItem(message.data).then(result => sendResponse(result));
    return true; 
  }
});

async function syncOneItem(videoData) {
  const data = await chrome.storage.local.get('sessionToken');
  try {
    const response = await fetch(`${API_BASE_URL}/ingest/extension`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${data.sessionToken}`
      },
      body: JSON.stringify({ videos: [videoData] })
    });
    return { success: response.ok };
  } catch (err) {
    return { success: false };
  }
}