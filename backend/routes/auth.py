from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database import get_db, User
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timedelta
import os, uuid, shutil

import bcrypt as _bcrypt
from jose import JWTError, jwt

MEDIA_DIR = os.path.join(os.path.dirname(__file__), "..", "media")

router = APIRouter(prefix="/api/auth", tags=["auth"])

SECRET_KEY = os.getenv("JWT_SECRET", "hpys-dev-secret-change-in-prod")
ALGORITHM = "HS256"
TOKEN_EXPIRE_DAYS = 7

bearer_scheme = HTTPBearer(auto_error=False)


def hash_pin(pin: str) -> str:
    return _bcrypt.hashpw(pin.encode(), _bcrypt.gensalt()).decode()


def verify_pin(pin: str, hashed: str) -> bool:
    try:
        return _bcrypt.checkpw(pin.encode(), hashed.encode())
    except Exception:
        return False


def create_token(user_id: int) -> str:
    expire = datetime.utcnow() + timedelta(days=TOKEN_EXPIRE_DAYS)
    return jwt.encode({"sub": str(user_id), "exp": expire}, SECRET_KEY, algorithm=ALGORITHM)


def _decode_token(token: str) -> int:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise ValueError
        return int(user_id)
    except (JWTError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user_id = _decode_token(credentials.credentials)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


class RegisterBody(BaseModel):
    name: str
    username: str
    email: Optional[str] = None
    pin: str


class LoginBody(BaseModel):
    username: str
    pin: str


class UpdateMeBody(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None


class ChangePinBody(BaseModel):
    old_pin: str
    new_pin: str


class UpdateUserBody(BaseModel):
    role: Optional[str] = None
    name: Optional[str] = None


def _user_dict(u: User) -> dict:
    return {
        "id": u.id,
        "name": u.name,
        "username": u.username,
        "email": getattr(u, "email", None),
        "role": u.role,
        "avatar_url": getattr(u, "avatar_url", None),
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }


@router.post("/register", status_code=201)
def register(body: RegisterBody, db: Session = Depends(get_db)):
    if not body.pin.isdigit() or len(body.pin) != 6:
        raise HTTPException(status_code=400, detail="PIN must be exactly 6 digits")

    user_count = db.query(User).count()
    role = "admin" if user_count == 0 else "viewer"

    existing = db.query(User).filter(User.username == body.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        name=body.name,
        username=body.username,
        email=body.email.strip() if body.email else None,
        pin_hash=hash_pin(body.pin),
        role=role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _user_dict(user)


@router.post("/login")
def login(body: LoginBody, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_pin(body.pin, user.pin_hash):
        raise HTTPException(status_code=401, detail="Invalid username or PIN")
    token = create_token(user.id)
    return {"access_token": token, "token_type": "bearer", "user": _user_dict(user)}


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return _user_dict(current_user)


@router.patch("/me")
def update_me(
    body: UpdateMeBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.name is not None and body.name.strip():
        current_user.name = body.name.strip()
    if body.email is not None:
        current_user.email = body.email.strip() if body.email.strip() else None
    db.commit()
    db.refresh(current_user)
    return _user_dict(current_user)


@router.patch("/me/pin")
def change_pin(
    body: ChangePinBody,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_pin(body.old_pin, current_user.pin_hash):
        raise HTTPException(status_code=400, detail="Current PIN is incorrect")
    if not body.new_pin.isdigit() or len(body.new_pin) != 6:
        raise HTTPException(status_code=400, detail="New PIN must be exactly 6 digits")
    current_user.pin_hash = hash_pin(body.new_pin)
    db.commit()
    return {"ok": True}


@router.post("/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    allowed_exts = {".jpg", ".jpeg", ".png", ".webp", ".heic"}
    ext = os.path.splitext(file.filename or "")[1].lower() or ".jpg"
    if ext not in allowed_exts:
        raise HTTPException(status_code=400, detail="Only image files are allowed (jpg, png, webp, heic)")

    avatars_dir = os.path.join(MEDIA_DIR, "avatars")
    os.makedirs(avatars_dir, exist_ok=True)

    # Delete old avatar file if it exists
    old_url = getattr(current_user, "avatar_url", None)
    if old_url:
        old_path = os.path.join(MEDIA_DIR, old_url.lstrip("/media/").lstrip("media/"))
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except Exception:
                pass

    filename = f"avatar_{current_user.id}_{uuid.uuid4()}{ext}"
    file_path = os.path.join(avatars_dir, filename)
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    current_user.avatar_url = f"/media/avatars/{filename}"
    db.commit()
    db.refresh(current_user)
    return _user_dict(current_user)


@router.delete("/me/avatar")
def delete_avatar(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    old_url = getattr(current_user, "avatar_url", None)
    if old_url:
        old_path = os.path.join(MEDIA_DIR, old_url.lstrip("/media/").lstrip("media/"))
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except Exception:
                pass
    current_user.avatar_url = None
    db.commit()
    return {"ok": True}


@router.get("/users")
def list_users(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.created_at).all()
    return [_user_dict(u) for u in users]


@router.patch("/users/{user_id}")
def update_user(
    user_id: int,
    body: UpdateUserBody,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if body.role and body.role not in ("admin", "viewer"):
        raise HTTPException(status_code=400, detail="Role must be 'admin' or 'viewer'")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if body.role is not None and body.role != user.role:
        if user.role == "admin" and body.role == "viewer":
            admin_count = db.query(User).filter(User.role == "admin").count()
            if admin_count <= 1:
                raise HTTPException(status_code=400, detail="Cannot demote the last admin")
        user.role = body.role
    if body.name is not None and body.name.strip():
        user.name = body.name.strip()
    db.commit()
    db.refresh(user)
    return _user_dict(user)


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"ok": True}
