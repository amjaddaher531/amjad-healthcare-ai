import os
import json
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException

_cred_json = os.getenv("FIREBASE_CREDENTIALS_JSON")

if not _cred_json:
    raise RuntimeError("FIREBASE_CREDENTIALS_JSON is not set")

if not firebase_admin._apps:
    cred_dict = json.loads(_cred_json)
    cred = credentials.Certificate(cred_dict)
    firebase_admin.initialize_app(cred)


def verify_firebase_token(id_token: str) -> dict:
    """
    يتحقق من صحة الـ ID Token اللي جاي من الفرونت اند (بعد تسجيل الدخول بجوجل).
    يرجع الـ decoded token اللي فيه uid, email, email_verified.
    """
    try:
        decoded_token = auth.verify_id_token(id_token)
        return decoded_token
    except auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="Token expired")
    except auth.InvalidIdTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Could not verify token")
