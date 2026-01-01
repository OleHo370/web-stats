from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import List, Optional
from pydantic import BaseModel

from app.database import get_db
from app.models.video import Video
from app.models.watch import WatchHistory
from app.utils.auth import verify_session_token

router = APIRouter(prefix="/ingest", tags=["Ingestion"])

# Data models for validation
class ExtensionVideoData(BaseModel):
    videoId: str
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
            try:
                watched_at_dt = datetime.fromisoformat(v.watchedAt.replace('Z', '+00:00'))
            except Exception:
                watched_at_dt = datetime.utcnow()

            existing_watch = db.query(WatchHistory).filter(
                WatchHistory.user_id == user_id,
                WatchHistory.video_id == v.videoId,
                WatchHistory.watched_at >= datetime.utcnow() - timedelta(seconds=15)
            ).order_by(WatchHistory.watched_at.desc()).first()

            if existing_watch:
                if v.duration > (existing_watch.watch_time_seconds or 0):
                    existing_watch.watch_time_seconds = v.duration
                    existing_watch.watched_at = watched_at_dt 
            else:
                new_watch = WatchHistory(
                    user_id=user_id,
                    video_id=v.videoId,
                    watched_at=watched_at_dt,
                    watch_time_seconds=v.duration
                )
                db.add(new_watch)

        db.commit()
        return {"status": "success", "processed": len(request.videos)}

    except Exception as e:
        db.rollback()
        print(f"Ingestion Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")