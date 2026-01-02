from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.database import get_db
from app.models.video import Video
from app.models.watch import WatchHistory
from app.utils.auth import verify_session_token

router = APIRouter(prefix="/stats", tags=["Statistics"])

@router.get("/overview")
async def get_overview(authorization: str = Header(...), db: Session = Depends(get_db)):
    token = authorization.replace("Bearer ", "")
    user_id = verify_session_token(token)
    
    total_videos = db.query(func.count(func.distinct(WatchHistory.video_id))).filter(WatchHistory.user_id == user_id).scalar() or 0
    total_time = db.query(func.sum(WatchHistory.watch_time_seconds)).filter(WatchHistory.user_id == user_id).scalar() or 0
    total_channels = db.query(func.count(func.distinct(Video.channel_title))).join(WatchHistory, Video.id == WatchHistory.video_id).filter(WatchHistory.user_id == user_id).scalar() or 0

    total_sessions = db.query(func.count(WatchHistory.id)).filter(WatchHistory.user_id == user_id).scalar() or 0

    avg_watch_time = int(total_time / total_sessions) if total_sessions > 0 else 0
    
    return {
        "total_videos": total_videos,
        "total_watch_time_seconds": int(total_time),
        "total_channels": total_channels,
        "avg_watch_time": avg_watch_time, 
        "total_sessions": total_sessions
    }

@router.get("/channels")
async def get_top_channels(limit: int = 10, authorization: str = Header(...), db: Session = Depends(get_db)):
    token = authorization.replace("Bearer ", "")
    user_id = verify_session_token(token)
    
    results = db.query(
        Video.channel_title,
        func.count(WatchHistory.id).label('video_count')
    ).join(WatchHistory).filter(WatchHistory.user_id == user_id).group_by(Video.channel_title).order_by(desc('video_count')).limit(limit).all()
    
    return [{"channel_title": r[0], "video_count": r[1]} for r in results]

@router.get("/videos")
async def get_videos(limit: int = 50, authorization: str = Header(...), db: Session = Depends(get_db)):
    token = authorization.replace("Bearer ", "")
    user_id = verify_session_token(token)
    
    results = db.query(Video, WatchHistory).join(WatchHistory, Video.id == WatchHistory.video_id).filter(WatchHistory.user_id == user_id).order_by(desc(WatchHistory.watched_at)).limit(limit).all()
    
    return [{
        "id": v.id,
        "title": v.title,
        "channel_title": v.channel_title,
        "watch_time_seconds": w.watch_time_seconds,
        "duration_seconds": v.duration_seconds,
        "watched_at": w.watched_at.isoformat(),
        "thumbnail_url": v.thumbnail_url
    } for v, w in results]