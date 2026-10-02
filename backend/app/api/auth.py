from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.api.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin, UserOut, TokenResponse
from app.core.security import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Authentication & User Management"])

def _ensure_demo_user(db: Session):
    """Ensure starter demo user exists for quick instant demo testing."""
    demo_email = "demo@kitchenos.ai"
    existing = db.query(User).filter(User.email == demo_email).first()
    if not existing:
        demo = User(
            email=demo_email,
            hashed_password=hash_password("password123"),
            full_name="Chef Alex (Demo)",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
            is_active=True,
            created_at=datetime.now(timezone.utc).replace(tzinfo=None)
        )
        db.add(demo)
        db.commit()

@router.post("/register", response_model=TokenResponse)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    """Register a new Kitchen OS user account."""
    email_clean = user_in.email.strip().lower()
    
    # Check if user already exists
    existing = db.query(User).filter(User.email == email_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists"
        )

    # Hash password and create user
    hashed = hash_password(user_in.password)
    user = User(
        email=email_clean,
        hashed_password=hashed,
        full_name=user_in.full_name or email_clean.split("@")[0].capitalize(),
        is_active=True,
        created_at=datetime.now(timezone.utc).replace(tzinfo=None)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate JWT access token
    token = create_access_token({"sub": str(user.id), "email": user.email})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )

@router.post("/login", response_model=TokenResponse)
def login(creds: UserLogin, db: Session = Depends(get_db)):
    """Authenticate with email & password and retrieve JWT access token."""
    _ensure_demo_user(db)

    email_clean = creds.email.strip().lower()
    user = db.query(User).filter(User.email == email_clean).first()

    if not user or not verify_password(creds.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated"
        )

    # Generate JWT access token
    token = create_access_token({"sub": str(user.id), "email": user.email})

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=UserOut.model_validate(user)
    )

@router.get("/me", response_model=UserOut)
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Retrieve profile of currently authenticated user."""
    return current_user
