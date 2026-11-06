from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.modules.auth.schemas import LoginRequest, TokenResponse
from app.modules.auth.service import login_user
from app.core.dependencies import get_current_owner
from app.modules.auth.models import User
from app.modules.auth.schemas import OperatorCreateRequest, UserResponse
from app.modules.auth.service import create_operator


from app.modules.auth.schemas import UserResponse
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db

from app.core.dependencies import get_current_owner, get_current_user
from app.modules.auth.models import User

from app.modules.auth.schemas import (
    LoginRequest,
    TokenResponse,
    OperatorCreateRequest,
    UserResponse,
)

from app.modules.auth.service import login_user, create_operator

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

@router.post(
    "/operators",
    response_model=UserResponse,
    status_code=201,
)
def register_operator(
    operator_data: OperatorCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_owner),
):
    return create_operator(db, operator_data)


@router.get("/me", response_model=UserResponse)
def get_my_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.post("/login", response_model=TokenResponse)
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db),
):
    
    
    return login_user(db, login_data)