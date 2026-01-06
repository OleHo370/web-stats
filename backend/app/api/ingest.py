from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from pydantic import BaseModel

from app.database import get_db
from app.models.video import Video
from app.models.watch import WatchHistory
from app.utils.auth import verify_session_token

router = APIRouter(prefix="/ingest", tags=["Ingestion"])

SESSION_TIMEOUT_SECONDS = 300
last_session_tracker: Dict[str, str] = {}

class ExtensionVideoData(BaseModel):
    videoId: str
    sessionInstanceId: str
    title: str
    channelTitle: str
    duration: int
    videoDuration: Optional[int]
    thumbnail: str
    watchedAt: str

class ExtensionSyncRequest(BaseModel):
    videos: List[ExtensionVideoData]

@router.post("/extension")
async def sync_from_extension(
    request: ExtensionSyncRequest,
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    try:
        token = authorization.replace("Bearer ", "")
        user_id = verify_session_token(token)
        now = datetime.now() 

        for v in request.videos:
            video = db.query(Video).filter(Video.id == v.videoId).first()
            if not video:
                video = Video(
                    id=v.videoId,
                    title=v.title,
                    channel_title=v.channelTitle,
                    duration_seconds=v.videoDuration or 0,
                    thumbnail_url=v.thumbnail
                )
                db.add(video)
                db.flush()
            else:
                is_placeholder = video.title.lower() in ["youtube", "loading...", "watching...", ""]
                if is_placeholder or (video.title != v.title and v.title.lower() not in ["youtube", "loading..."]):
                    video.title = v.title
                
                if v.videoDuration and v.videoDuration > (video.duration_seconds or 0):
                    video.duration_seconds = v.videoDuration

                if video.channel_title != v.channelTitle and v.channelTitle not in ["YouTube Channel", "Unknown Channel"]:
                    video.channel_title = v.channelTitle

            tracker_key = f"{user_id}_{v.videoId}"
            previous_sid = last_session_tracker.get(tracker_key)
            force_new = previous_sid is not None and previous_sid != v.sessionInstanceId
            last_session_tracker[tracker_key] = v.sessionInstanceId

            existing_watch = None
            if not force_new:
                existing_watch = db.query(WatchHistory).filter(
                    WatchHistory.user_id == user_id,
                    WatchHistory.video_id == v.videoId,
                    WatchHistory.last_updated >= now - timedelta(seconds=SESSION_TIMEOUT_SECONDS)
                ).order_by(WatchHistory.last_updated.desc()).first()

            if existing_watch and not force_new:
                existing_watch.watch_time_seconds = (existing_watch.watch_time_seconds or 0) + v.duration
                existing_watch.last_updated = now
            else:
                new_watch = WatchHistory(
                    user_id=user_id,
                    video_id=v.videoId,
                    watched_at=now,
                    last_updated=now,
                    watch_time_seconds=v.duration
                )
                db.add(new_watch)
        
        db.commit()
        return {"status": "success"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))