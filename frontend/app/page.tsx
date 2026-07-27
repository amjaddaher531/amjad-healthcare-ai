"use client";

import { useState } from "react";
import { Stethoscope, Sparkles, BarChart3, LogIn, MessageCircle, ShieldCheck } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import AgentTimeline from "@/components/AgentTimeline";
import ReportView from "@/components/ReportView";
import type { PipelineResult } from "@/lib/types";
import Link from "next/link";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

// إعدادات فايربيس المباشرة
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState(""); // أو نعتبرها User ID / كلمة المرور حسب رغبتك
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [files, setFiles] = useState<File[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // دالة تسجيل الدخول عبر فايربيس
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);

    try {
      // تسجيل الدخول باستخدام الإيميل وكلمة المرور/معرف العميل
      await signInWithEmailAndPassword(auth, email, password);
      setIsAuthenticated(true); // الانتقال للواجهة الرئيسية بعد النجاح
    } catch (err: any) {
      setError("فشل تسجيل الدخول: تأكد من صحة البريد الإلكتروني أو معرف العميل.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setIsAuthenticated(false);
      setError("انتهت جلسة تسجيل الدخول، يرجى إعادة تسجيل الدخول.");
      return;
    }

    setAnalyzing(true);
    setError(forNull => null);
    setResult(null);

    try {
      const token = await currentUser.getIdToken();

      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const response = await fetch("https://amjad-healthcare-ai.onrender.com/api/analyze", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });

      if (response.status === 403) {
        throw new Error("عذراً، اشتراكك غير فعال أو انتهى. يرجى التجديد للتفعيل.");
      }

      if (!response.ok) {
        throw new Error("فشل في معالجة المستندات عبر خادم الذكاء الاصطناعي.");
      }

      const res: PipelineResult = await response.json();
      setResult(res);
    } catch (e: any) {
      setError(e.message ?? "Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  // 1. إذا لم يتم تسجيل الدخول، اعرض صفحة تسجيل الدخول الأولية
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-6 py-10 text-slate-100">
        <div className="w-full max-w-md rounded-xl border border-ink-800 bg-ink-900/60 p-8 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="rounded-full bg-teal-500/10 p-3 mb-3">
              <Stethoscope className="h-8 w-8 text-teal-400" />
            </div>
            <h1 className="font-display text-xl font-bold text-slate-50">Amjad Healthcare AI</h1>
            <p className="text-xs text-slate-400 mt-1">منصة التذكير والترميز الطبي المتقدمة</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">البريد الإلكتروني (Email)</label>
              <input
                type="email5"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-md border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">معرف العميل أو كلمة المرور (User ID / Password)</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-md border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            </div>

            {error && (
              <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400 text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full flex items-center justify-center gap-2 rounded-md bg-teal-500 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-teal-400 disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" />
              {authLoading ? "جاري التحقق..." : "تسجيل الدخول (Login)"}
            </button>
          </form>

          {/* عبارة "إذا ما عندك حساب سجل الان" والرابط إلى واتساب */}
          <div className="mt-6 text-center border-t border-ink-800 pt-4">
            <p className="text-xs text-slate-400">
              إذا ما عندك حساب؟{" "}
              <a
                href="https://wa.me/971XXXXXXXXX" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-400 font-medium hover:underline"
              >
                سجل الآن عبر واتساب
              </a>
            </p>
          </div>

          {/* الأزرار السفلية (واتساب و Amjad AI) */}
          <div className="mt-6 flex items-center justify-center gap-3">
            <a
              href="https://wa.me/971XXXXXXXXX"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-emerald-600/40 bg-emerald-600/10 px-3 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-600/20"
            >
              <MessageCircle className="h-4 w-4" /> واتساب الدعم
            </a>
            <a
              href="https://amjad-healthcare-ai.onrender.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-teal-600/40 bg-teal-600/10 px-3 py-2 text-xs font-medium text-teal-400 hover:bg-teal-600/20"
            >
              <Sparkles className="h-4 w-4" /> Amjad AI
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 2. الواجهة الرئيسية (تظهر بعد تسجيل الدخول الناجح)
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <header className="flex items-center justify-between border-b border-ink-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-md bg-teal-500/10 p-2">
            <Stethoscope className="h-5 w-5 text-teal-400" />
          </div>
          <div>
            <h1 className="font-display text-lg font-semibold text-slate-50">Amjad Healthcare AI</h1>
            <p className="text-xs text-slate-500">Multi-agent medical coding &amp; audit platform</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-xs font-medium text-red-400 hover:text-red-300 border border-red-500/20 px-3 py-1.5 rounded-md"
          >
            تسجيل الخروج
          </button>
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-md border border-ink-700 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-teal-600 hover:text-teal-300"
          >
            <BarChart3 className="h-3.5 w-3.5" /> Performance Dashboard
          </Link>
        </div>
      </header>

      {!result && (
        <section className="mt-10">
          <div className="mb-6">
            <h2 className="font-display text-2xl font-semibold text-slate-50">
              An entire coding department, in one upload.
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Upload progress notes, operative reports, radiology or lab results, discharge summaries, or
              insurance documents. Nine specialized agents extract, code, bill, audit, and verify — with
              every code traced back to its source evidence.
            </p>
          </div>

          <FileUpload files={files} onChange={setFiles} disabled={analyzing} />

          <button
            onClick={handleAnalyze}
            disabled={files.length === 0 || analyzing}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-teal-500 px-5 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Sparkles className="h-4 w-4" />
            {analyzing ? "Analyzing…" : "Analyze"}
          </button>

          {error && (
            <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          {analyzing && (
            <div className="mt-10 rounded-lg border border-ink-700 bg-ink-900/40 p-6">
              <h3 className="font-display mb-6 text-sm font-medium text-slate-200">Agent Activity</h3>
              <AgentTimeline events={[]} />
              <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-teal-400" />
                Running full pipeline — this typically takes 30–90 seconds depending on document volume.
              </p>
            </div>
          )}
        </section>
      )}

      {result && (
        <section className="mt-10">
          <button
            onClick={() => {
              setResult(null);
              setFiles([]);
            }}
            className="mb-6 text-xs font-medium text-teal-400 hover:text-teal-300"
          >
            ← Analyze new documents
          </button>
          <ReportView result={result} />
        </section>
      )}
    </div>
  );
}
