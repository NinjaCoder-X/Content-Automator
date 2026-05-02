"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error ?? "Login failed");
      return;
    }
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="card p-8 w-full max-w-md animate-pop">
        <Link href="/" className="flex items-center gap-2 mb-8">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </span>
          <span className="font-semibold">AI Content Factory</span>
        </Link>
        <h1 className="text-2xl font-semibold mb-1">Welcome back</h1>
        <p className="text-sm text-muted mb-6">Log in to your dashboard.</p>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-1.5">
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="space-y-1.5">
            <label className="label">Password</label>
            <input
              className="input"
              type="password"
              required
              minLength={1}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {err && (
            <p className="text-sm text-danger" role="alert">
              {err}
            </p>
          )}
          <button className="btn btn-primary w-full" disabled={loading}>
            {loading ? "Signing in…" : "Log in"}
          </button>
        </form>
        <p className="text-sm text-muted mt-6 text-center">
          New here?{" "}
          <Link href="/signup" className="text-primary-400 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
