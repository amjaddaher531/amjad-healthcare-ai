from fastapi import Header, HTTPException
from app.services.firebase_auth import verify_firebase_token


async def get_current_user(authorization: str = Header(...)) -> dict:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or malformed token")

    token = authorization.split("Bearer ")[1]
    decoded = verify_firebase_token(token)

    return {
        "uid": decoded["uid"],
        "email": decoded.get("email"),
        "email_verified": decoded.get("email_verified", False),
    }
