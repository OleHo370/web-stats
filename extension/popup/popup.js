const WEBAPP_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:8000';

document.addEventListener('DOMContentLoaded', async () => {
  await loadStats();
  setupEventListeners();
});

async function loadStats() {
  const { sessionToken } = await chrome.storage.local.get('sessionToken');
  
  if (sessionToken) {
    document.getElementById('notLoggedIn').style.display = 'none';
    document.getElementById('loggedIn').style.display = 'block';
    
    chrome.runtime.sendMessage({ type: 'GET_STATS' }, (response) => {
      if (response) {
        document.getElementById('queueSize').textContent = response.queueSize;
        document.getElementById('totalTracked').textContent = response.totalTracked;
      }
    });
  } else {
    document.getElementById('notLoggedIn').style.display = 'block';
    document.getElementById('loggedIn').style.display = 'none';
  }
}

function setupEventListeners() {

  document.getElementById('loginBtn').addEventListener('click', async () => {

    const token = prompt('Paste your session token from the web app:');
    
    if (token && token.trim()) {
      await chrome.storage.local.set({ sessionToken: token.trim() });

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token.trim()}`
          }
        });
        
        if (response.ok) {
          alert('Login successful! Extension is now connected.');
          loadStats();
        } else {
          alert('Invalid token. Please copy the correct token from the web app.');
          await chrome.storage.local.remove('sessionToken');
        }
      } catch (error) {
        alert('Could not connect to server. Make sure the backend is running.');
        await chrome.storage.local.remove('sessionToken');
      }
    } else {
      chrome.tabs.create({ url: WEBAPP_URL });
    }
  });

  document.getElementById('syncBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('syncBtn');
    const status = document.getElementById('syncStatus');
    
    btn.disabled = true;
    btn.textContent = 'Syncing...';
    
    chrome.runtime.sendMessage({ type: 'SYNC_NOW' }, (response) => {
      btn.disabled = false;
      btn.textContent = 'Sync Now';
      
      if (response && response.success) {
        status.className = 'status success';
        status.textContent = 'Synced successfully!';
        loadStats();
      } else {
        status.className = 'status error';
        status.textContent = 'Sync failed';
      }
      
      setTimeout(() => {
        status.textContent = '';
        status.className = 'status';
      }, 3000);
    });
  });

  document.getElementById('openDashboard')?.addEventListener('click', () => {
    chrome.tabs.create({ url: WEBAPP_URL });
  });

  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    if (confirm('Are you sure you want to logout?')) {
      await chrome.storage.local.remove('sessionToken');
      alert('Logged out successfully');
      loadStats();
    }
  });
}