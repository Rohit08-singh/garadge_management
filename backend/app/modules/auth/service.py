
from sqlalchemy import select
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.modules.auth.models import User
from app.modules.auth.schemas import (
    LoginRequest,
    TokenResponse,
    UserResponse,
    OperatorCreateRequest,
)

from app.core.security import (
    verify_password,
    create_access_token,
    hash_password,
)


def login_user(
    db: Session,
    login_data: LoginRequest,
) -> TokenResponse:

    # Find user by username
    statement = select(User).where(
        User.username == login_data.username
    )

    user = db.execute(statement).scalar_one_or_none()

    # Check whether user exists
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    # Check whether account is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is inactive",
        )

    # Verify password
    if not verify_password(
        login_data.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    # Generate JWT token
    access_token = create_access_token(
        user_id=user.id,
        role=user.role,
    )

    # Return token and user information
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserResponse.model_validate(user),
    )


def create_operator(
    db: Session,
    operator_data: OperatorCreateRequest,
) -> UserResponse:

    # Check whether username already exists
    existing_user = db.execute(
        select(User).where(
            User.username == operator_data.username
        )
    ).scalar_one_or_none()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username is already registered",
        )

    # Create operator account
    operator = User(
        username=operator_data.username,
        full_name=operator_data.full_name,
        phone=operator_data.phone,
        hashed_password=hash_password(operator_data.password),
        role="OPERATOR",
        is_active=True,
    )

    try:
        db.add(operator)
        db.commit()
        db.refresh(operator)

        return UserResponse.model_validate(operator)

    except Exception:
        db.rollback()
        raise
