"use client";

import { useState, useEffect } from "react";
import { Stethoscope, Sparkles, BarChart3, LogIn, MessageCircle, CreditCard, Loader2 } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import AgentTimeline from "@/components/AgentTimeline";
import ReportView from "@/components/ReportView";
import CaseIntakeForm, { emptyCaseForm, type CaseFormData } from "@/components/CaseIntakeForm";
import type { PipelineResult } from "@/lib/types";
import Link from "next/link";
import { initializeApp, getApps } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  type User,
} from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

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
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

const SUBSCRIBE_URL = "https://amjaddaher.lemonsqueezy.com/checkout/buy/106088ce-6dab-4cf0-a86c-b8ff3de2d0a7";

type SubStatus = "checking" | "active" | "inactive";

export default function HomePage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authInitializing, setAuthInitializing] = useState(true);
  const [subStatus, setSubStatus] = useState<SubStatus>("checking");

  const [files, setFiles] = useState<File[]>([]);
  const [caseForm, setCaseForm] = useState<CaseFormData>(emptyCaseForm());
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthUser(user);
      setAuthInitializing(false);

      if (!user) {
        setSubStatus("checking");
        return;
      }

      setSubStatus("checking");
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        const isActive = userDoc.exists() && userDoc.data()?.subscriptionActive === true;
        setSubStatus(isActive ? "active" : "inactive");
      } catch {
        setSubStatus("inactive");
      }
    });

    return () => unsubscribe();
  }, []);

  const isAuthenticated = !!authUser;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError("Login failed: please check your email or client ID.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError("Google sign-in failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setResult(null);
    setFiles([]);
    setCaseForm(emptyCaseForm());
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError("Your session has expired. Please log in again.");
      return;
    }

    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const token = await currentUser.getIdToken();

      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });
      formData.append("case_form", JSON.stringify(caseForm));

      const response = await fetch("https://amjad-healthcare-ai.onrender.com/api/analyze", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formData,
      });

      if (response.status === 403) {
        setSubStatus("inactive");
        throw new Error("Sorry, your subscription is inactive or has expired. Please renew to activate.");
      }

      if (!response.ok) {
        throw new Error("Failed to process documents through the AI server.");
      }

      const res: PipelineResult = await response.json();
      setResult(res);
    } catch (e: any) {
      setError(e.message ?? "Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  if (authInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950">
        <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-6 py-10 text-slate-100">
        <div className="w-full max-w-md rounded-xl border border-ink-800 bg-ink-900/60 p-8 shadow-2xl backdrop-blur-md">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="rounded-full bg-teal-500/10 p-3 mb-3">
              <Stethoscope className="h-8 w-8 text-teal-400" />
            </div>
            <h1 className="font-display text-xl font-bold text-slate-50">Amjad Healthcare AI</h1>
            <p className="text-xs text-slate-400 mt-1">Advanced medical coding and audit platform</p>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={authLoading}
            className="w-full flex items-center justify-center gap-2 rounded-md border border-ink-700 bg-white py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-slate-100 disabled:opacity-50"
          >
            <svg className="h-4 w-4" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.5-.4-3.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.6 5.1 29.6 3 24 3c-7.7 0-14.3 4.3-17.7 10.7z"/>
              <path fill="#4CAF50" d="M24 45c5.5 0 10.4-1.9 14.2-5.1l-6.6-5.4C29.6 36 26.9 37 24 37c-5.3 0-9.7-3.4-11.3-8l-6.6 5.1C9.6 40.6 16.2 45 24 45z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.5l6.6 5.4C41.5 35.6 45 30.3 45 24c0-1.4-.1-2.5-.4-3.5z"/>
            </svg>
            {authLoading ? "Verifying…" : "Continue with Google"}
          </button>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-ink-800" />
            <span className="text-[10px] uppercase tracking-wide text-slate-500">or</span>
            <div className="h-px flex-1 bg-ink-800" />
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-md border border-ink-700 bg-ink-950 px-3 py-2 text-sm text-slate-100 focus:border-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Client ID / Password</label>
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
              {authLoading ? "Verifying…" : "Login"}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-ink-800 pt-4">
            <p className="text-xs text-slate-400">
              Don't have an account?{" "}
              <a href="https://wa.me/971585436940" target="_blank" rel="noopener noreferrer" className="text-teal-400 font-medium hover:underline">Register now via WhatsApp</a>
            </p>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <a href="https://wa.me/971585436940" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-emerald-600/40 bg-emerald-600/10 px-3 py-2 text-xs font-medium text-emerald-400 hover:bg-emerald-600/20">
              <MessageCircle className="h-4 w-4" /> WhatsApp Support
            </a>
            <a href="https://cdn.botpress.cloud/webchat/v2.3/shareable.html?configUrl=https://files.bpcontent.cloud/2025/01/25/23/20250125230347-DC8S01WC.json" target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-teal-600/40 bg-teal-600/10 px-3 py-2 text-xs font-medium text-teal-400 hover:bg-teal-600/20">
              <Sparkles className="h-4 w-4" /> Amjad AI
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (subStatus === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-950">
        <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
      </div>
    );
  }

  if (subStatus === "inactive") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-ink-950 px-6 py-10 text-slate-100">
        <div className="w-full max-w-md rounded-xl border border-ink-800 bg-ink-900/60 p-8 text-center shadow-2xl backdrop-blur-md">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-teal-500/10">
            <CreditCard className="h-7 w-7 text-teal-400" />
          </div>
          <h1 className="font-display text-xl font-bold text-slate-50">Activate your subscription</h1>
          <p className="mt-2 text-sm text-slate-400">
            Signed in as <span className="text-slate-200">{authUser?.email}</span>. Your account doesn't have
            an active subscription yet — subscribe to start analyzing cases with AMJAD AI.
          </p>

          <a
            href={SUBSCRIBE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-teal-500 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-teal-400"
          >
            <Sparkles className="h-4 w-4" /> Subscribe now — AED 199/month
          </a>

          <p className="mt-3 text-xs text-slate-500">
            Already subscribed? It can take a few minutes to activate.{" "}
            <button
              onClick={() => window.location.reload()}
              className="text-teal-400 hover:underline"
            >
              Refresh status
            </button>
          </p>

          <button
            onClick={handleLogout}
            className="mt-6 text-xs font-medium text-red-400 hover:text-red-300"
          >
            Log out
          </button>

          <div className="mt-6 border-t border-ink-800 pt-4">
            <a href="https://wa.me/971585436940" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:underline">
              <MessageCircle className="h-4 w-4" /> Need help? Contact WhatsApp Support
            </a>
          </div>
        </div>
      </div>
    );
  }

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
            onClick={handleLogout}
            className="text-xs font-medium text-red-400 hover:text-red-300 border border-red-500/20 px-3 py-1.5 rounded-md"
          >
            Log out
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
        <section className="mt-10 space-y-10">
          <div>
            <h2 className="font-display text-2xl font-semibold text-slate-50">
              An entire coding department, in one upload.
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-400">
              Fill in the case details, upload the supporting documents, and let nine specialized agents
              extract, code, bill, audit, and verify — with every code traced back to its source evidence.
            </p>
          </div>

          <CaseIntakeForm value={caseForm} onChange={setCaseForm} disabled={analyzing} />

          <div>
            <h3 className="font-display mb-4 text-sm font-semibold text-slate-200">Supporting Documents</h3>
            <FileUpload files={files} onChange={setFiles} disabled={analyzing} />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={files.length === 0 || analyzing}
            className="inline-flex items-center gap-2 rounded-md bg-teal-500 px-5 py-2.5 text-sm font-semibold text-ink-950 transition-colors hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Sparkles className="h-4 w-4" />
            {analyzing ? "Analyzing…" : "Submit case"}
          </button>

          {error && (
            <p className="rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          {analyzing && (
            <div className="rounded-lg border border-ink-700 bg-ink-900/40 p-6">
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
              setCaseForm(emptyCaseForm());
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
