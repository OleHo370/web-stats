from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class GoogleLoginRequest(BaseModel):
    id_token: str
    access_token: str

class UserResponse(BaseModel):
    id: int
    google_id: str
    email: str
    name: Optional[str]
    picture: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class LoginResponse(BaseModel):
    user: UserResponse
    session_token: str
    message: str