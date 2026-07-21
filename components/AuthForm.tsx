"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";

function isValidKoreanPhone(v: string) {
  return /^01[0-9]-?\d{3,4}-?\d{4}$/.test(v.trim());
}

export default function AuthForm() {
  const { signUp, signIn } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!isValidKoreanPhone(phone)) { setError("Telefon raqamini to'g'ri kiriting."); return; }
    setBusy(true);
    const err = await signIn(phone, password);
    setBusy(false);
    if (err) setError(err);
  };

  const handleRegister = async () => {
    setError("");
    if (!name.trim()) { setError("Ismingizni kiriting."); return; }
    if (!isValidKoreanPhone(phone)) { setError("Koreya telefon raqamini to'g'ri kiriting (010-1234-5678)."); return; }
    if (password.length < 4) { setError("Parol kamida 4 ta belgidan iborat bo'lsin."); return; }
    if (password !== password2) { setError("Parollar mos kelmadi."); return; }
    setBusy(true);
    const err = await signUp(name, phone, password);
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border border-green-100 rounded-3xl p-6 shadow-xl">
        <div className="flex bg-green-50 rounded-xl p-1 mb-6">
          <button
            onClick={() => { setMode("login"); setError(""); }}
            className={`flex-1 py-2 rounded-lg text-sm font-bold ${mode === "login" ? "bg-white text-green-700 shadow" : "text-gray-400"}`}
          >Kirish</button>
          <button
            onClick={() => { setMode("register"); setError(""); }}
            className={`flex-1 py-2 rounded-lg text-sm font-bold ${mode === "register" ? "bg-white text-green-700 shadow" : "text-gray-400"}`}
          >Ro'yxatdan o'tish</button>
        </div>

        <h1 className="text-xl font-bold text-black mb-1">
          {mode === "login" ? "Xush kelibsiz" : "Hisob yarating"}
        </h1>
        <p className="text-sm text-gray-500 mb-4">
          {mode === "login" ? "Koreya telefon raqamingiz bilan kiring" : "Ro'yxatdan o'tish uchun Koreya telefon raqami kerak"}
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm font-semibold p-3 rounded-xl mb-3">{error}</div>
        )}

        {mode === "register" && (
          <input
            type="text"
            placeholder="To'liq ism"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-xl p-3 text-black mb-3"
          />
        )}

        <input
          type="text"
          placeholder="010-1234-5678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full border rounded-xl p-3 text-black mb-3"
        />

        <input
          type="password"
          placeholder="Parol"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-xl p-3 text-black mb-3"
        />

        {mode === "register" && (
          <input
            type="password"
            placeholder="Parolni tasdiqlang"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            className="w-full border rounded-xl p-3 text-black mb-3"
          />
        )}

        <button
          onClick={mode === "login" ? handleLogin : handleRegister}
          disabled={busy}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold"
        >
          {busy ? "Iltimos kuting..." : mode === "login" ? "Kirish" : "Ro'yxatdan o'tish"}
        </button>
      </div>
    </div>
  );
}