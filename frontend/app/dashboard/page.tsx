"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Stethoscope, Mail, KeyRound, ArrowRight, MessageCircle, Bot } from "lucide-react";

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
      router.push("/"); // فتح باقي النظام كما هو عند النجاح
    } catch (err: any) {
      setError("فشل التحقق من البيانات. تأكد من البريد الإلكتروني أو الـ Client ID.");
    } finally {
      setLoading(false);
    }
  };

  const whatsappUrl = "https://wa.me/971585436940";
  const botpressUrl = "https://cdn.botpress.cloud/webchat/v2.3/shareable.html?configUrl=https://files.bpcontent.cloud/2025/01/25/23/20250125230347-DC8S01WC.json";

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4 py-12">
      <div className="w-full max-w-md space-y-6 rounded-xl border border-ink-800 bg-ink-900/50 p-8 shadow-xl backdrop-blur-md">
        
        {/* العبارة الترحيبية */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/10 text-teal-400">
            <Stethoscope className="h-6 w-6" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-50">أهلاً بك في منصة الرعاية الذكية</h2>
          <p className="mt-2 text-sm text-slate-400">يرجى تسجيل الدخول باستخدام البريد الإلكتروني ومعرف العميل (Client ID)</p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-400 border border-red-500/20">
            {error}
          </div>
        )}

        {/* نموذج تسجيل الدخول */}
        <form className="space-y-4" onSubmit={handleLogin}>
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">البريد الإلكتروني</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
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
            <label className="block text-xs font-medium text-slate-300 mb-1">Client ID (معرف العميل)</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                <KeyRound className="h-4 w-4" />
              </div>
              <input
                type="text"
                required
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="w-full rounded-lg border border-ink-700 bg-ink-950 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                placeholder="أدخل الـ Client ID الخاص بك"
              />
            </div>
          </div>

          {/* زر تسجيل الدخول تحت المربعات */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 transition-all"
          >
            {loading ? "جاري التحقق..." : "تسجيل الدخول"}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        {/* عبارة إذا ليس لديك حساب سجل الآن */}
        <div className="text-center pt-2">
          <p className="text-xs text-slate-400">
            إذا ليس لديك حساب؟{" "}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal-400 font-medium hover:underline inline-flex items-center gap-1"
            >
              سجل الآن عبر الواتساب
            </a>
          </p>
        </div>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-ink-800"></div>
          <span className="flex-shrink mx-4 text-xs text-slate-500">أو تواصل عبر</span>
          <div className="flex-grow border-t border-ink-800"></div>
        </div>

        {/* الزرين الإضافيين في الأسفل (واتساب و Amjad AI برابط البوت) */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-ink-800 transition-colors"
          >
            <MessageCircle className="h-4 w-4 text-green-400" />
            تواصل واتساب
          </a>
          
          <a
            href={botpressUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg border border-ink-700 bg-ink-950 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-ink-800 transition-colors"
          >
            <Bot className="h-4 w-4 text-teal-400" />
            Amjad AI
          </a>
        </div>

      </div>
    </div>
  );
}
