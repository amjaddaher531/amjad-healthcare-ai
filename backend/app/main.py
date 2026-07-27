"""
Amjad Healthcare AI — backend entrypoint.

Run locally:
    cd backend
    pip install -r requirements.txt
    cp .env.example .env    # then add your ANTHROPIC_API_KEY
    uvicorn app.main:app --reload --port 8000
"""
import json
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
import firebase_admin
from firebase_admin import credentials, auth, firestore

from app.config import get_settings
from app.db.database import init_db
from app.api.routes_analyze import router as analyze_router
from app.api.routes_feedback import router as feedback_router

settings = get_settings()

# تهيئة Firebase Admin (تدعم متغير Vercel أو الملف المحلي)
if not firebase_admin._apps:
    try:
        cred_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
        if cred_json:
            cred_dict = json.loads(cred_json)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
        else:
            cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "firebase-credentials.json")
            if os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
            else:
                firebase_admin.initialize_app()
    except Exception as e:
        print(f"Warning: Firebase Admin initialization failed: {e}")

db = firestore.client() if firebase_admin._apps else None


# دالة التحقق من التوكن وحالة الاشتراك الفعالة
async def verify_user_and_subscription(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication code missing or format incorrect.")
    
    token = authorization.split(" ")[1]
    
    try:
        # التحقق من صحة التوكن عبر Firebase Auth
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token['uid']

        if not db:
            raise HTTPException(status_code=500, detail="قاعدة بيانات الحسابات غير متصلة بالباك-إند.")

        # جلب بيانات المستخدم من Firestore للتحقق من الاشتراك
        user_ref = db.collection('users').document(uid)
        user_doc = user_ref.get()

        if not user_doc.exists:
            raise HTTPException(status_code=403, detail="The user account does not exist in the system.")

        user_data = user_doc.to_dict()
        is_active = user_data.get('subscriptionActive', False)

        if not is_active:
            raise HTTPException(status_code=403, detail="Sorry, the subscription is currently inactive.")

        return uid
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"فشل التحقق من الهوية: {str(e)}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="Amjad Healthcare AI",
    description="Multi-agent AI platform for medical coding, billing, RCM, claims review, and audit.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# تضمين الراوترز
app.include_router(analyze_router)
app.include_router(feedback_router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "Amjad Healthcare AI", "ai_configured": bool(settings.anthropic_api_key)}


# مثال على مسار محمي يتطلب اشتراكاً فعالاً وتوكن صحيح
@app.get("/api/protected-check")
async def protected_check(user_id: str = Depends(verify_user_and_subscription)):
    return {"status": "authorized", "user_id": user_id, "message": "الاشتراك فعال وصحيح."}
