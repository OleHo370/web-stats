from sqlalchemy import Column, String, Integer, DateTime
from app.database import Base

class Video(Base):
    __tablename__ = "videos"

    id = Column(String, primary_key=True)
    title = Column(String, nullable=False)
    channel_id = Column(String, nullable=True)
    channel_title = Column(String, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    category_id = Column(String, nullable=True)
    published_at = Column(DateTime(timezone=True), nullable=True)
    thumbnail_url = Column(String, nullable=True)