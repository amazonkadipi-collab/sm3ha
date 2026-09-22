import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const result = mode === "login"
        ? await supabase.auth.signInWithPassword({ email: email.trim(), password })
        : await supabase.auth.signUp({ email: email.trim(), password, options: { emailRedirectTo: window.location.origin } });

      if (result.error) throw result.error;
      if (mode === "signup" && !result.data.session) {
        setMessage("تم إنشاء الحساب. تحقق من بريدك الإلكتروني لتأكيد الحساب ثم سجّل الدخول.");
        return;
      }
      navigate("/");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذر تسجيل الدخول.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main dir="rtl" className="min-h-[calc(100vh-72px)] px-5 py-16">
      <div className="mx-auto max-w-md rounded-[28px] border border-[#756590]/10 bg-white/80 p-7 shadow-sm">
        <Link href="/" className="text-sm font-bold text-[#756590]">← العودة للرئيسية</Link>
        <h1 className="mt-8 text-3xl font-bold text-[#514568]">{mode === "login" ? "تسجيل الدخول" : "إنشاء حساب"}</h1>
        <p className="mt-2 text-sm leading-7 text-[#81768f]">الحسابات الآن تُدار مباشرة بواسطة Supabase Auth.</p>
        <form onSubmit={submit} className="mt-7 space-y-4">
          <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="البريد الإلكتروني" className="w-full rounded-xl border border-[#756590]/15 px-4 py-3 outline-none" />
          <input type="password" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="كلمة المرور" className="w-full rounded-xl border border-[#756590]/15 px-4 py-3 outline-none" />
          <Button type="submit" disabled={busy} className="w-full">{busy ? "جارٍ التنفيذ…" : mode === "login" ? "دخول" : "إنشاء الحساب"}</Button>
        </form>
        {message && <p className="mt-4 rounded-xl bg-[#f6f1fa] p-3 text-sm leading-6 text-[#514568]">{message}</p>}
        <button type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")} className="mt-5 text-sm font-bold text-[#756590]">
          {mode === "login" ? "ليس لديك حساب؟ إنشاء حساب" : "لديك حساب؟ تسجيل الدخول"}
        </button>
      </div>
    </main>
  );
}
