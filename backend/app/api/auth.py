from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.auth import GoogleLoginRequest, LoginResponse, UserResponse
from app.utils.auth import verify_google_token, create_session_token, verify_session_token
from datetime import datetime

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=LoginResponse)
async def login(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    """
    Login with Google OAuth
    """
    try:
        user_info = verify_google_token(request.id_token)
        
        user = db.query(User).filter(User.google_id == user_info["google_id"]).first()
        
        if user:
            user.access_token = request.access_token
            user.last_login = datetime.utcnow()
            user.name = user_info.get("name")
            user.picture = user_info.get("picture")
        else:
            user = User(
                google_id=user_info["google_id"],
                email=user_info["email"],
                name=user_info.get("name"),
                picture=user_info.get("picture"),
                access_token=request.access_token
            )
            db.add(user)
        
        db.commit()
        db.refresh(user)
        
        session_token = create_session_token(user.id)
        
        return LoginResponse(
            user=UserResponse.from_orm(user),
            session_token=session_token,
            message="Login successful"
        )
        
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Login failed: {str(e)}")

@router.get("/me", response_model=UserResponse)
async def get_current_user(
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    try:
        token = authorization.replace("Bearer ", "")
        user_id = verify_session_token(token)
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return UserResponse.from_orm(user)
        
    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

@router.post("/logout")
async def logout():
    return {"message": "Logout successful. Please delete your session token."}
