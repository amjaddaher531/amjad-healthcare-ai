"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import {
  Stethoscope,
  Mail,
  KeyRound,
  ArrowRight,
  MessageCircle,
  Bot,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [clientId, setClientId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email, clientId);
      router.push("/");
    } catch (err: any) {
      setError(
        "Authentication failed. Please verify your email address and Client ID."
      );
    } finally {
      setLoading(false);
    }
  };

  const whatsappUrl = "https://wa.me/971585436940";
  const botpressUrl =
    "https://cdn.botpress.cloud/webchat/v2.3/shareable.html?configUrl=https://files.bpcontent.cloud/2025/01/25/23/20250125230347-DC8S01WC.json";

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-ink-800 bg-ink-900/50 p-8 shadow-xl backdrop-blur-md">

        {/* Welcome Section */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/10 text-teal-400">
            <Stethoscope className="h-6 w-6" />
          </div>

          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-50">
            Welcome to Amjad Healthcare AI
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Secure access to your AI-powered medical coding, auditing, and revenue cycle management platform.
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-center text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Email Address
            </label>

            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500">
                <Mail className="h-4 w-4" />
              </div>

              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="name@example.com"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-300">
              Client ID
            </label>

            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500">
                <KeyRound className="h-4 w-4" />
              </div>

              <input
                type="text"
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="Enter your Client ID"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* Register */}
        <div className="pt-2 text-center">
          <p className="text-xs text-slate-400">
            Don't have an account?{" "}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-teal-400 hover:underline"
            >
              Register via WhatsApp
            </a>
          </p>
        </div>

        <div className="relative flex items-center py-2">
          <div className="flex-grow border-t border-ink-800"></div>
          <span className="mx-4 flex-shrink text-xs text-slate-500">
            Or connect with
          </span>
          <div className="flex-grow border-t border-ink-800"></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-ink-800"
          >
            <MessageCircle className="h-4 w-4 text-green-400" />
            WhatsApp
          </a>

          
            href={botpressUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-xs font-medium text-slate-200 transition-colors hover:bg-ink-800"
          >
            <Bot className="h-4 w-4 text-teal-400" />
            Amjad AI
          </a>
        </div>

      </div>
    </div>
  );
}
