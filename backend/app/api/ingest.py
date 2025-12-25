from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import datetime

from app.database import get_db
from app.models.user import User
from app.models.video import Video
from app.models.watch import WatchHistory
from app.utils.auth import verify_session_token
from app.services.youtube_client import YouTubeClient

router = APIRouter(prefix="/ingest", tags=["Data Ingestion"])

class SyncResponse(BaseModel):
    message: str
    videos_fetched: int
    watch_records_created: int

class ExtensionVideoData(BaseModel):
    videoId: str
    title: str
    channelTitle: str
    duration: int
    thumbnail: str
    watchedAt: str
    url: str

class ExtensionSyncRequest(BaseModel):
    videos: List[ExtensionVideoData]

class ExtensionSyncResponse(BaseModel):
    message: str
    videos_synced: int
    new_videos: int
    new_watch_records: int

@router.post("/history", response_model=SyncResponse)
async def sync_watch_history(
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):

    try:
        token = authorization.replace("Bearer ", "")
        user_id = verify_session_token(token)
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.access_token:
            raise HTTPException(status_code=401, detail="User not authenticated")
        
        yt_client = YouTubeClient(user.access_token)

        print("Fetching liked videos...")
        watch_items = yt_client.get_liked_videos(max_results=50)
        
        if not watch_items:
            return SyncResponse(
                message="No videos found",
                videos_fetched=0,
                watch_records_created=0
            )
        
        video_ids = [item['video_id'] for item in watch_items]
        
        print(f"Fetching details for {len(video_ids)} videos...")
        video_details = yt_client.get_video_details(video_ids)
        
        videos_added = 0
        for video_data in video_details:
            existing_video = db.query(Video).filter(Video.id == video_data['id']).first()
            
            if not existing_video:
                video = Video(
                    id=video_data['id'],
                    title=video_data['title'],
                    channel_id=video_data['channel_id'],
                    channel_title=video_data['channel_title'],
                    duration_seconds=video_data['duration_seconds'],
                    category_id=video_data['category_id'],
                    published_at=datetime.fromisoformat(video_data['published_at'].replace('Z', '+00:00')) if video_data['published_at'] else None,
                    thumbnail_url=video_data['thumbnail_url']
                )
                db.add(video)
                videos_added += 1
        
        db.commit()
        
        watch_records_added = 0
        for item in watch_items:
            existing_watch = db.query(WatchHistory).filter(
                WatchHistory.user_id == user_id,
                WatchHistory.video_id == item['video_id']
            ).first()
            
            if not existing_watch:
                watched_at = datetime.fromisoformat(item['watched_at'].replace('Z', '+00:00')) if item['watched_at'] else datetime.utcnow()
                
                watch_record = WatchHistory(
                    user_id=user_id,
                    video_id=item['video_id'],
                    watched_at=watched_at
                )
                db.add(watch_record)
                watch_records_added += 1
        
        db.commit()
        
        return SyncResponse(
            message="Watch history synced successfully",
            videos_fetched=videos_added,
            watch_records_created=watch_records_added
        )
        
    except Exception as e:
        db.rollback()
        print(f"Error syncing history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to sync history: {str(e)}")

@router.post("/extension", response_model=ExtensionSyncResponse)
async def sync_from_extension(
    request: ExtensionSyncRequest,
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):

    try:
        token = authorization.replace("Bearer ", "")
        user_id = verify_session_token(token)
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        videos_added = 0
        watch_records_added = 0
        
        for video_data in request.videos:
            video = db.query(Video).filter(Video.id == video_data.videoId).first()
            
            if not video:
                video = Video(
                    id=video_data.videoId,
                    title=video_data.title,
                    channel_title=video_data.channelTitle,
                    duration_seconds=video_data.duration,
                    thumbnail_url=video_data.thumbnail
                )
                db.add(video)
                videos_added += 1
            
            watched_at = datetime.fromisoformat(video_data.watchedAt.replace('Z', '+00:00'))
            
            existing_watch = db.query(WatchHistory).filter(
                WatchHistory.user_id == user_id,
                WatchHistory.video_id == video_data.videoId,
                WatchHistory.watched_at == watched_at
            ).first()
            
            if not existing_watch:
                watch_record = WatchHistory(
                    user_id=user_id,
                    video_id=video_data.videoId,
                    watched_at=watched_at
                )
                db.add(watch_record)
                watch_records_added += 1
        
        db.commit()
        
        return ExtensionSyncResponse(
            message="Extension data synced successfully",
            videos_synced=len(request.videos),
            new_videos=videos_added,
            new_watch_records=watch_records_added
        )
        
    except ValueError as e:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        db.rollback()
        print(f"Error syncing extension data: {e}")
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")
