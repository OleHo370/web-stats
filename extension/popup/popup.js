const WEBAPP_URL = 'http://localhost:5173';

document.addEventListener('DOMContentLoaded', async () => {
  await updateUI();
  setupEventListeners();
});

async function updateUI() {
  const { sessionToken, user } = await chrome.storage.local.get(['sessionToken', 'user']);
  
  if (sessionToken) {
    document.getElementById('notLoggedIn').style.display = 'none';
    document.getElementById('loggedIn').style.display = 'block';
    if (user) {
      document.getElementById('userEmail').textContent = `Logged in as: ${user.email}`;
    }
  } else {
    document.getElementById('notLoggedIn').style.display = 'block';
    document.getElementById('loggedIn').style.display = 'none';
  }
}

function setupEventListeners() {
  document.getElementById('loginBtn').addEventListener('click', () => {
    const btn = document.getElementById('loginBtn');
    btn.textContent = 'Logging in...';
    btn.disabled = true;

    chrome.runtime.sendMessage({ type: 'GOOGLE_LOGIN' }, (response) => {
      if (response && response.success) {
        updateUI();
      } else {
        alert('Login failed: ' + (response?.error || 'Unknown error'));
        btn.textContent = 'Sign in with Google';
        btn.disabled = false;
      }
    });
  });

  document.getElementById('openDashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: WEBAPP_URL });
  });

  document.getElementById('logoutBtn').addEventListener('click', async () => {
    await chrome.storage.local.remove(['sessionToken', 'user']);
    updateUI();
  });
}