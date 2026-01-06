const API_BASE_URL = 'http://localhost:8000';
const CLIENT_ID = '87631314794-8756idgfk3pi50tsfrdsj6b399ili2d5.apps.googleusercontent.com';

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'VIDEO_WATCHED') {
    syncOneItem(message.data).then(result => sendResponse(result));
    return true; 
  }

  if (message.type === 'GOOGLE_LOGIN') {
    handleGoogleLogin().then(result => sendResponse(result));
    return true;
  }
});

async function handleGoogleLogin() {
  try {
    const redirectUri = chrome.identity.getRedirectURL();
    const scope = encodeURIComponent('openid email profile https://www.googleapis.com/auth/youtube.readonly');
    
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&prompt=select_account`;

    const responseUrl = await chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true
    });

    if (!responseUrl) throw new Error('Login window closed');

    const url = new URL(responseUrl);
    const hashParams = new URLSearchParams(url.hash.substring(1));
    const token = hashParams.get('access_token');

    if (!token) throw new Error('No access token found');

    const backendResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_token: token,
        access_token: token
      })
    });

    if (!backendResponse.ok) throw new Error('Backend login failed');

    const data = await backendResponse.json();

    await chrome.storage.local.set({ 
      sessionToken: data.session_token,
      user: data.user
    });

    return { success: true, user: data.user };
  } catch (err) {
    console.error('Extension Login Error:', err);
    return { success: false, error: err.message };
  }
}

async function syncOneItem(videoData) {
  const data = await chrome.storage.local.get('sessionToken');
  if (!data.sessionToken) return { success: false };

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