let secondsSinceLastSync = 0;
let currentVideoId = null; 
let sessionInstanceId = null;

function getRealVideoId() {
  const player = document.querySelector('#movie_player') || document.querySelector('.html5-video-player');
  if (player && typeof player.getVideoData === 'function') {
    const data = player.getVideoData();
    if (data && data.video_id) return data.video_id;
  }

  const miniPlayer = document.querySelector('ytd-miniplayer');
  if (miniPlayer && !miniPlayer.hidden) {
    const miniId = miniPlayer.getAttribute('video-id');
    if (miniId) return miniId;
  }

  return new URLSearchParams(window.location.search).get('v') || currentVideoId;
}

function getActiveVideo() {
  const mainVideo = document.querySelector('video.html5-main-video');
  const miniVideo = document.querySelector('ytd-miniplayer video');
  if (miniVideo && !miniVideo.paused) return miniVideo;
  if (mainVideo && !mainVideo.paused) return mainVideo;
  return miniVideo || mainVideo;
}

function getCleanTitle() {
  const miniTitle = document.querySelector('ytd-miniplayer .title')?.textContent?.trim();
  if (miniTitle && miniTitle.toLowerCase() !== 'youtube') return miniTitle;

  const mainTitle = document.querySelector('h1.ytd-watch-metadata')?.textContent?.trim();
  if (mainTitle) return mainTitle;

  return document.title.replace('- YouTube', '').trim();
}

function getChannelName() {
  const miniChannel = document.querySelector('ytd-miniplayer .channel-name')?.textContent?.trim();
  if (miniChannel) return miniChannel;

  const mainChannel = document.querySelector('#upload-info #channel-name a')?.textContent?.trim();
  return mainChannel || 'YouTube Channel';
}

async function syncToBackend() {
  const videoId = getRealVideoId();
  if (!videoId || secondsSinceLastSync === 0 || !chrome.runtime?.id) return;

  const metadata = {
    videoId: videoId,
    sessionInstanceId: sessionInstanceId,
    title: getCleanTitle(),
    channelTitle: getChannelName(),
    duration: secondsSinceLastSync,
    videoDuration: getActiveVideo() ? Math.floor(getActiveVideo().duration) : 0,
    thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
    watchedAt: new Date().toISOString()
  };

  chrome.runtime.sendMessage({ type: 'VIDEO_WATCHED', data: metadata }, (response) => {
    if (response && response.success) {
      secondsSinceLastSync = 0;
    }
  });
}

setInterval(() => {
  const video = getActiveVideo();
  const freshVideoId = getRealVideoId();

  if (freshVideoId && freshVideoId !== currentVideoId) {
    console.log(`[Extension] Video Swap: ${currentVideoId} -> ${freshVideoId}`);
    currentVideoId = freshVideoId;
    secondsSinceLastSync = 0;
    sessionInstanceId = Math.random().toString(36).substring(2, 15);
    return;
  }

  if (video && !video.paused && !video.ended) {
    secondsSinceLastSync += 1;
    syncToBackend();
  }
}, 1000);