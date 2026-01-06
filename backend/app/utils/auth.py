from jose import JWTError, jwt
from datetime import datetime, timedelta
import os
import requests
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7

def verify_google_token(token: str) -> dict:
    try:
        response = requests.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            headers={'Authorization': f'Bearer {token}'},
            timeout=5
        )
        
        if response.status_code != 200:
            raise ValueError('Invalid Google token')
        
        user_info = response.json()
        
        return {
            "google_id": user_info['sub'],
            "email": user_info['email'],
            "name": user_info.get('name'),
            "picture": user_info.get('picture')
        }
    except Exception as e:
        raise ValueError(f"Google Token Verification failed: {str(e)}")

def create_session_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"sub": str(user_id), "exp": expire}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_session_token(token: str) -> int:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise ValueError("Invalid session")
        return int(user_id)
    except JWTError:
        raise ValueError("Session expired or invalid")