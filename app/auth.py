import jwt
from datetime import datetime, timedelta
from typing import Optional
from passlib.context import CryptContext
from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.declarative import declarative_base
from app.database import get_db
from sqlalchemy.orm import Session
from app.models.user import User



# 보안 설정
SECRET_KEY = "your_secret_key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60  # 60분 만료

# 비밀번호 해시/검증 설정
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str):
    return pwd_context.hash(password)

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

# 토큰 생성
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# 토큰 검증
def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# FastAPI OAuth2 인증 연동
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")  # tokenUrl 경로 주의

# 현재 로그인된 사용자 추출
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    print(f"[DEBUG] Authorization 토큰 수신됨: {token}")  # ✅ 이 줄 추가

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_uid: str = payload.get("sub")
        print(f"[DEBUG] JWT sub 값: {user_uid}")  # ✅ 이 줄 추가
        if user_uid is None:
            raise credentials_exception
    except JWTError as e:
        print(f"[DEBUG] JWT 오류 발생: {e}")  # ✅ 이 줄 추가
        raise credentials_exception

    user = db.query(User).filter(User.user_uid == user_uid).first()
    if user is None:
        print(f"[DEBUG] user_uid={user_uid} 에 해당하는 유저 없음")  # ✅ 이 줄 추가
        raise credentials_exception

    print(f"[DEBUG] 인증 성공: user_uid={user.user_uid}")
    return user
