let totalWatchTime = 0;
let currentVideoId = new URLSearchParams(window.location.search).get('v');
const INITIAL_THRESHOLD = 5;

async function syncToBackend() {
  const videoId = new URLSearchParams(window.location.search).get('v');
  
  if (!videoId || !chrome.runtime?.id) return;

  const videoElement = document.querySelector('video');
  
  const title = document.querySelector('h1.ytd-watch-metadata')?.textContent?.trim() || 
                document.querySelector('h1.ytd-video-primary-info-renderer')?.textContent?.trim() || 
                'Unknown Title';
                
  const channel = document.querySelector('ytd-channel-name a')?.textContent?.trim() || 
                  document.querySelector('#channel-name a')?.textContent?.trim() || 
                  'Unknown Channel';

  const metadata = {
    videoId: videoId,
    title: title,
    channelTitle: channel,
    duration: Math.floor(totalWatchTime),
    videoDuration: videoElement ? Math.floor(videoElement.duration) : 0,
    thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
    watchedAt: new Date().toISOString()
  };

  try {
    chrome.runtime.sendMessage({ type: 'VIDEO_WATCHED', data: metadata });
    console.log(`Update Sent: ${totalWatchTime}s`);
  } catch (err) {
    console.warn("Sync failed");
  }
}

setInterval(() => {
  const video = document.querySelector('video');
  const activeVideoId = new URLSearchParams(window.location.search).get('v');

  if (activeVideoId !== currentVideoId) {
    console.log("Video changed. Resetting counter.");
    currentVideoId = activeVideoId;
    totalWatchTime = 0;
    return;
  }

  if (video && !video.paused && document.visibilityState === 'visible' && activeVideoId) {
    totalWatchTime += 1;

    if (totalWatchTime >= INITIAL_THRESHOLD) {
      syncToBackend();
    }
  }
}, 1000);

console.log("1-Second Sync Tracker Active");