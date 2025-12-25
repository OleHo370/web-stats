console.log('YouTube Watch Stats Tracker: Content script loaded');

let currentVideoId = null;
let videoStartTime = null;
let watchThreshold = 30;


function getVideoId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('v');
}

function getVideoMetadata() {
  const videoId = getVideoId();
  if (!videoId) return null;

  const titleElement = document.querySelector('h1.ytd-video-primary-info-renderer yt-formatted-string') ||
                       document.querySelector('h1.title yt-formatted-string');
  const title = titleElement?.textContent?.trim() || 'Unknown Title';

  const channelElement = document.querySelector('ytd-channel-name a') ||
                        document.querySelector('#channel-name a');
  const channelTitle = channelElement?.textContent?.trim() || 'Unknown Channel';

  const videoElement = document.querySelector('video');
  const duration = videoElement ? Math.floor(videoElement.duration) : 0;


  const thumbnailElement = document.querySelector('meta[property="og:image"]');
  const thumbnail = thumbnailElement?.content || '';

  return {
    videoId,
    title,
    channelTitle,
    duration,
    thumbnail,
    watchedAt: new Date().toISOString(),
    url: window.location.href
  };
}


function trackVideoWatch() {
  const metadata = getVideoMetadata();
  if (!metadata) return;

  console.log('Tracking video watch:', metadata);


  chrome.runtime.sendMessage({
    type: 'VIDEO_WATCHED',
    data: metadata
  });
}

function monitorVideo() {
  const videoElement = document.querySelector('video');
  if (!videoElement) {
    setTimeout(monitorVideo, 1000);
    return;
  }

  console.log('Video player found, monitoring...');

  let watchTimer = null;

  videoElement.addEventListener('play', () => {
    const videoId = getVideoId();
    
    if (videoId !== currentVideoId) {
      currentVideoId = videoId;
      videoStartTime = Date.now();
      
      watchTimer = setTimeout(() => {
        console.log(`Video ${videoId} watched for ${watchThreshold}s, tracking...`);
        trackVideoWatch();
      }, watchThreshold * 1000);
    }
  });

  videoElement.addEventListener('pause', () => {
    if (watchTimer) {
      clearTimeout(watchTimer);
    }
  });

  videoElement.addEventListener('ended', () => {

    trackVideoWatch();
    currentVideoId = null;
  });
}

function checkPage() {
  if (window.location.pathname === '/watch') {
    monitorVideo();
  }
}

checkPage();

let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    currentVideoId = null;
    checkPage();
  }
}).observe(document, { subtree: true, childList: true });