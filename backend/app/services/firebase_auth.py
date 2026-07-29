import os
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException

# قراءة مسار ملف الـ Service Account من متغير البيئة
_cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH")

if not _cred_path:
    raise RuntimeError("FIREBASE_CREDENTIALS_PATH is not set in .env")

# تهيئة Firebase Admin SDK مرة وحدة بس عند أول استيراد للملف
if not firebase_admin._apps:
    cred = credentials.Certificate(_cred_path)
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
