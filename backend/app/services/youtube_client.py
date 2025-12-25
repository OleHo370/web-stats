from googleapiclient.discovery import build
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")

class YouTubeClient:
    def __init__(self, access_token: str):
        self.access_token = access_token
        from google.oauth2.credentials import Credentials
        
        credentials = Credentials(token=access_token)
        self.youtube = build('youtube', 'v3', credentials=credentials)
    
    def get_watch_history(self, max_results: int = 50):

        try:
            request = self.youtube.activities().list(
                part="snippet,contentDetails",
                mine=True,
                maxResults=max_results
            )
            response = request.execute()
            
            watch_items = []
            for item in response.get('items', []):
                if item['snippet']['type'] == 'upload':
                    continue
                

                snippet = item['snippet']
                content_details = item.get('contentDetails', {})
                
                video_id = None
                if 'recommendation' in content_details:
                    video_id = content_details['recommendation'].get('resourceId', {}).get('videoId')
                elif 'playlistItem' in content_details:
                    video_id = content_details['playlistItem'].get('resourceId', {}).get('videoId')
                
                if video_id:
                    watch_items.append({
                        'video_id': video_id,
                        'watched_at': snippet.get('publishedAt')
                    })
            
            return watch_items
        except Exception as e:
            print(f"Error fetching watch history: {e}")
            return []
    
    def get_liked_videos(self, max_results: int = 50):

        try:
            request = self.youtube.videos().list(
                part="snippet,contentDetails",
                myRating="like",
                maxResults=max_results
            )
            response = request.execute()
            
            liked_items = []
            for item in response.get('items', []):
                liked_items.append({
                    'video_id': item['id'],
                    'watched_at': item['snippet'].get('publishedAt')
                })
            
            return liked_items
        except Exception as e:
            print(f"Error fetching liked videos: {e}")
            return []
    
    def get_video_details(self, video_ids: list):

        if not video_ids:
            return []
        
        try:
            video_ids_str = ','.join(video_ids[:50])
            
            request = self.youtube.videos().list(
                part="snippet,contentDetails,statistics",
                id=video_ids_str
            )
            response = request.execute()
            
            videos = []
            for item in response.get('items', []):
                snippet = item['snippet']
                content_details = item['contentDetails']
                
                duration_seconds = self._parse_duration(content_details.get('duration', ''))
                
                videos.append({
                    'id': item['id'],
                    'title': snippet.get('title'),
                    'channel_id': snippet.get('channelId'),
                    'channel_title': snippet.get('channelTitle'),
                    'duration_seconds': duration_seconds,
                    'category_id': snippet.get('categoryId'),
                    'published_at': snippet.get('publishedAt'),
                    'thumbnail_url': snippet.get('thumbnails', {}).get('medium', {}).get('url')
                })
            
            return videos
        except Exception as e:
            print(f"Error fetching video details: {e}")
            return []
    
    def _parse_duration(self, duration_str: str) -> int:
        """
        Convert ISO 8601 duration (PT15M33S) to seconds
        """
        import re
        
        if not duration_str:
            return 0
        
        pattern = r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?'
        match = re.match(pattern, duration_str)
        
        if not match:
            return 0
        
        hours = int(match.group(1) or 0)
        minutes = int(match.group(2) or 0)
        seconds = int(match.group(3) or 0)
        
        return hours * 3600 + minutes * 60 + seconds