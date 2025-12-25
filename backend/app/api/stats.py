from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database import get_db
from app.models.user import User
from app.models.video import Video
from app.models.watch import WatchHistory
from app.utils.auth import verify_session_token
from pydantic import BaseModel
from typing import List, Optional

router = APIRouter(prefix="/stats", tags=["Statistics"])

class OverviewStats(BaseModel):
    total_videos: int
    total_watch_time_seconds: int
    total_channels: int
    avg_video_duration: int

class ChannelStat(BaseModel):
    channel_title: str
    video_count: int

class VideoItem(BaseModel):
    id: str
    title: str
    channel_title: str
    duration_seconds: int
    watched_at: str
    thumbnail_url: Optional[str]

@router.get("/overview", response_model=OverviewStats)
async def get_overview_stats(
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    try:
        token = authorization.replace("Bearer ", "")
        user_id = verify_session_token(token)

        total_videos = db.query(WatchHistory).filter(
            WatchHistory.user_id == user_id
        ).count()
        
        total_duration = db.query(func.sum(Video.duration_seconds)).join(
            WatchHistory, Video.id == WatchHistory.video_id
        ).filter(
            WatchHistory.user_id == user_id
        ).scalar() or 0
        
        total_channels = db.query(func.count(func.distinct(Video.channel_id))).join(
            WatchHistory, Video.id == WatchHistory.video_id
        ).filter(
            WatchHistory.user_id == user_id
        ).scalar() or 0
        
        avg_duration = int(total_duration / total_videos) if total_videos > 0 else 0
        
        return OverviewStats(
            total_videos=total_videos,
            total_watch_time_seconds=int(total_duration),
            total_channels=total_channels,
            avg_video_duration=avg_duration
        )
        
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/channels", response_model=List[ChannelStat])
async def get_top_channels(
    authorization: str = Header(...),
    db: Session = Depends(get_db),
    limit: int = 10
):
    try:
        token = authorization.replace("Bearer ", "")
        user_id = verify_session_token(token)
        
        results = db.query(
            Video.channel_title,
            func.count(WatchHistory.id).label('count')
        ).join(
            WatchHistory, Video.id == WatchHistory.video_id
        ).filter(
            WatchHistory.user_id == user_id
        ).group_by(
            Video.channel_title
        ).order_by(
            desc('count')
        ).limit(limit).all()
        
        return [
            ChannelStat(channel_title=row[0] or "Unknown", video_count=row[1])
            for row in results
        ]
        
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/videos", response_model=List[VideoItem])
async def get_watch_history(
    authorization: str = Header(...),
    db: Session = Depends(get_db),
    limit: int = 50
):
    try:
        token = authorization.replace("Bearer ", "")
        user_id = verify_session_token(token)
        
        results = db.query(
            Video, WatchHistory.watched_at
        ).join(
            WatchHistory, Video.id == WatchHistory.video_id
        ).filter(
            WatchHistory.user_id == user_id
        ).order_by(
            desc(WatchHistory.watched_at)
        ).limit(limit).all()
        
        return [
            VideoItem(
                id=video.id,
                title=video.title,
                channel_title=video.channel_title or "Unknown",
                duration_seconds=video.duration_seconds or 0,
                watched_at=watched_at.isoformat(),
                thumbnail_url=video.thumbnail_url
            )
            for video, watched_at in results
        ]
        
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid token")