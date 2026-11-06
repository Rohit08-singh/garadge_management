from getpass import getpass

from sqlalchemy import select

from app.database.connection import SessionLocal
from app.modules.auth.models import User
from app.core.security import hash_password


def create_owner():
    db = SessionLocal()

    try:
        print("\n=== Create Garage Owner Account ===")

        # Get owner details
        username = input("Enter owner username: ").strip()
        full_name = input("Enter owner's full name: ").strip()
        phone = input("Enter owner's phone number: ").strip() or None

        password = getpass("Enter owner password: ")
        confirm_password = getpass("Confirm owner password: ")

        # Validate input
        if not username or not full_name:
            print("Username and full name are required.")
            return

        if len(password) < 8:
            print("Password must contain at least 8 characters.")
            return

        if password != confirm_password:
            print("Passwords do not match.")
            return

        # Check existing username
        existing_user = db.execute(
            select(User).where(User.username == username)
        ).scalar_one_or_none()

        if existing_user:
            print("This username is already registered.")
            return

        # Create owner
        owner = User(
            username=username,
            full_name=full_name,
            phone=phone,
            hashed_password=hash_password(password),
            role="OWNER",
            is_active=True,
        )

        db.add(owner)
        db.commit()
        db.refresh(owner)

        print("\nOwner account created successfully!")
        print("Owner ID:", owner.id)
        print("Username:", owner.username)
        print("Role:", owner.role)

    except Exception as error:
        db.rollback()
        print("Error creating owner:", error)

    finally:
        db.close()


if __name__ == "__main__":
    create_owner()