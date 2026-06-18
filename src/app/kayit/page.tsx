"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function KayitPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    setLoading(false);
    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Kayıt başarısız.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0f2a2e] to-[#1a4a52] px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <div className="text-3xl mb-1">🌀</div>
          <h1 className="font-bold text-lg">
            <span className="text-teal-700">MALİYET</span>
            <span className="text-gray-800">BULUT</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Yeni hesap oluşturun</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600">Ad Soyad</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="Adınız Soyadınız"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="ornek@eposta.com"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full mt-1 px-3 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
              placeholder="En az 6 karakter"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium rounded-md transition-colors disabled:opacity-50"
          >
            {loading ? "Oluşturuluyor..." : "Kayıt Ol"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          Zaten hesabınız var mı?{" "}
          <Link href="/giris" className="text-teal-600 font-medium hover:underline">
            Giriş yapın
          </Link>
        </p>
      </div>
    </div>
  );
}
