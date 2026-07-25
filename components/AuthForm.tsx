"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import { LANGUAGES } from "@/lib/i18n";

const STORE_PHONE = "010-2132-2202";
const STORE_TELEGRAM = "https://t.me/megahalalsuppermarket";

function isValidKoreanPhone(v: string) {
  return /^01[0-9]-?\d{3,4}-?\d{4}$/.test(v.trim());
}

export default function AuthForm() {
  const { signUp, signIn, continueAsGuest } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleLogin = async () => {
    setError("");
    if (!isValidKoreanPhone(phone)) { setError(t("auth_error_invalid_phone")); return; }
    setBusy(true);
    const err = await signIn(phone, password);
    setBusy(false);
    if (err) setError(t("auth_error_incorrect"));
  };

  const handleRegister = async () => {
    setError("");
    if (!name.trim()) { setError(t("auth_error_enter_name")); return; }
    if (!isValidKoreanPhone(phone)) { setError(t("auth_error_invalid_phone_register")); return; }
    if (password.length < 4) { setError(t("auth_error_password_short")); return; }
    if (password !== password2) { setError(t("auth_error_password_mismatch")); return; }
    setBusy(true);
    const err = await signUp(name, phone, password);
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <div className="login-screen relative min-h-screen flex items-center justify-center p-4 overflow-hidden bg-green-900">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url(/images/login-bg.jpg)",
          filter: "brightness(0.75)",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/5 to-black/40" />

      <div className="relative z-10 w-full max-w-sm">
        <div className="flex justify-center gap-1.5 mb-4">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`w-9 h-9 rounded-full text-base flex items-center justify-center border transition ${
                language === lang.code ? "border-green-600 bg-green-600 scale-105" : "border-white/70 bg-white/90"
              }`}
              aria-label={lang.label}
            >
              {lang.flag}
            </button>
          ))}
        </div>

        <div className="bg-gradient-to-br from-green-600/45 to-green-700/45 backdrop-blur-md rounded-t-3xl pt-8 pb-10 flex flex-col items-center shadow-xl">
          <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center overflow-hidden">
            <img src="/icons/icon-192.png" alt="Mega Halal Supermarket" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-white font-extrabold text-lg mt-3 text-center px-6">Mega Halal Supermarket</h1>
        </div>

        <div className="auth-glass-panel border border-white/20 border-t-0 rounded-b-3xl p-6 shadow-xl -mt-1">
          <div className="flex bg-green-50 rounded-xl p-1 mb-6">
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-bold ${mode === "login" ? "bg-white text-green-700 shadow" : "text-gray-400"}`}
            >{t("auth_tab_login")}</button>
            <button
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-bold ${mode === "register" ? "bg-white text-green-700 shadow" : "text-gray-400"}`}
            >{t("auth_tab_register")}</button>
          </div>

          <h1 className="text-xl font-bold text-black mb-1">
            {mode === "login" ? t("auth_welcome_title") : t("auth_create_title")}
          </h1>
          <p className="text-sm text-gray-500 mb-4">
            {mode === "login" ? t("auth_welcome_sub") : t("auth_create_sub")}
          </p>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm font-semibold p-3 rounded-xl mb-3">{error}</div>
          )}

          {mode === "register" && (
            <input
              type="text"
              placeholder={t("auth_fullname_placeholder")}
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
            placeholder={t("auth_password_placeholder")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded-xl p-3 text-black mb-3"
          />

          {mode === "register" && (
            <input
              type="password"
              placeholder={t("auth_confirm_password_placeholder")}
              value={password2}
              onChange={(e) => setPassword2(e.target.value)}
              className="w-full border rounded-xl p-3 text-black mb-3"
            />
          )}

          {mode === "login" && (
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="block text-right w-full text-xs text-green-700 font-semibold mb-3 -mt-1"
            >
              {t("auth_forgot_password")}
            </button>
          )}

          <button
            onClick={mode === "login" ? handleLogin : handleRegister}
            disabled={busy}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold"
          >
            {busy ? t("auth_please_wait") : mode === "login" ? t("auth_signin_button") : t("auth_register_button")}
          </button>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-semibold">{t("auth_or_divider")}</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            onClick={continueAsGuest}
            className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 py-3 rounded-xl font-bold"
          >
            {t("auth_guest_button")}
          </button>
        </div>
      </div>

      {showForgotPassword && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setShowForgotPassword(false)}
        >
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-black text-lg mb-2">{t("auth_forgot_password_title")}</h3>
            <p className="text-sm text-gray-600 mb-4">{t("auth_forgot_password_message")}</p>
            <div className="space-y-2 mb-4">
              <a href={`tel:${STORE_PHONE}`} className="block bg-gray-100 rounded-xl p-3 text-black font-semibold text-center">
                📱 {STORE_PHONE}
              </a>
              <a href={STORE_TELEGRAM} target="_blank" rel="noreferrer" className="block bg-blue-500 text-white rounded-xl p-3 text-center font-semibold">
                ✈️ Telegram
              </a>
            </div>
            <button
              onClick={() => setShowForgotPassword(false)}
              className="w-full bg-gray-100 text-gray-600 py-2.5 rounded-xl font-bold"
            >
              {t("auth_forgot_password_close")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
