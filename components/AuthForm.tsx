"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import { LANGUAGES } from "@/lib/i18n";
import { useBackButtonClose } from "@/lib/useBackButtonClose";

function isValidKoreanPhone(v: string) {
  return /^01[0-9]-?\d{3,4}-?\d{4}$/.test(v.trim());
}

export default function AuthForm() {
  const { signIn, continueAsGuest, sendVerificationCode, verifyCode, completeRegistration, completePasswordReset } =
    useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  // Ro'yxatdan o'tish ikki bosqichli: avval forma, keyin telefonga
  // yuborilgan kodni tasdiqlash.
  const [registerStep, setRegisterStep] = useState<"form" | "code">("form");
  const [registerCode, setRegisterCode] = useState("");

  // "Parolni unutdingizmi" oynasi ham bosqichli: raqam -> kod -> tayyor.
  const [forgotStep, setForgotStep] = useState<"phone" | "code" | "done">("phone");
  const [forgotPhone, setForgotPhone] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotError, setForgotError] = useState("");

  // Android "orqaga" tugmasi bosilganda, "parolni unutdingizmi" oynasi
  // ochiq bo'lsa, ilovadan chiqib ketish o'rniga shu oynani yopish uchun.
  useBackButtonClose(showForgotPassword, () => setShowForgotPassword(false));

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setForgotStep("phone");
    setForgotPhone("");
    setForgotCode("");
    setForgotError("");
  };

  const handleLogin = async () => {
    setError("");
    if (!isValidKoreanPhone(phone)) { setError(t("auth_error_invalid_phone")); return; }
    setBusy(true);
    const err = await signIn(phone, password);
    setBusy(false);
    if (err) setError(t("auth_error_incorrect"));
  };

  // Register - 1-bosqich: forma to'g'ri to'ldirilgan bo'lsa, telefonga kod yuboradi.
  const handleRegisterSendCode = async () => {
    setError("");
    if (!name.trim()) { setError(t("auth_error_enter_name")); return; }
    if (!isValidKoreanPhone(phone)) { setError(t("auth_error_invalid_phone_register")); return; }
    if (password.length < 4) { setError(t("auth_error_password_short")); return; }
    if (password !== password2) { setError(t("auth_error_password_mismatch")); return; }
    setBusy(true);
    const err = await sendVerificationCode(phone, "signup");
    setBusy(false);
    if (err) { setError(err); return; }
    setRegisterCode("");
    setRegisterStep("code");
  };

  // Register - 2-bosqich: kodni tasdiqlaydi va hisobni yaratadi.
  const handleRegisterVerify = async () => {
    setError("");
    if (registerCode.trim().length !== 6) { setError(t("auth_error_code_invalid")); return; }
    setBusy(true);
    const { verifyId, error: verifyErr } = await verifyCode(phone, registerCode.trim(), "signup");
    if (verifyErr || !verifyId) {
      setBusy(false);
      setError(verifyErr || t("auth_error_code_invalid"));
      return;
    }
    const regErr = await completeRegistration(name, phone, password, verifyId);
    setBusy(false);
    if (regErr) setError(regErr);
  };

  const handleResendRegisterCode = async () => {
    setError("");
    setBusy(true);
    const err = await sendVerificationCode(phone, "signup");
    setBusy(false);
    if (err) setError(err);
  };

  // "Parolni unutdingizmi" - 1-bosqich: raqamga kod yuboradi.
  const handleForgotSendCode = async () => {
    setForgotError("");
    if (!isValidKoreanPhone(forgotPhone)) { setForgotError(t("auth_error_invalid_phone")); return; }
    setBusy(true);
    const err = await sendVerificationCode(forgotPhone, "reset");
    setBusy(false);
    if (err) { setForgotError(err); return; }
    setForgotCode("");
    setForgotStep("code");
  };

  // "Parolni unutdingizmi" - 2-bosqich: kodni tasdiqlaydi, tizim o'zi yangi
  // parol yaratib, uni SMS orqali yuboradi.
  const handleForgotVerify = async () => {
    setForgotError("");
    if (forgotCode.trim().length !== 6) { setForgotError(t("auth_error_code_invalid")); return; }
    setBusy(true);
    const { verifyId, error: verifyErr } = await verifyCode(forgotPhone, forgotCode.trim(), "reset");
    if (verifyErr || !verifyId) {
      setBusy(false);
      setForgotError(verifyErr || t("auth_error_code_invalid"));
      return;
    }
    const resetErr = await completePasswordReset(forgotPhone, verifyId);
    setBusy(false);
    if (resetErr) { setForgotError(resetErr); return; }
    setForgotStep("done");
  };

  const handleForgotResendCode = async () => {
    setForgotError("");
    setBusy(true);
    const err = await sendVerificationCode(forgotPhone, "reset");
    setBusy(false);
    if (err) setForgotError(err);
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
              onClick={() => { setMode("register"); setRegisterStep("form"); setError(""); }}
              className={`flex-1 py-2 rounded-lg text-sm font-bold ${mode === "register" ? "bg-white text-green-700 shadow" : "text-gray-400"}`}
            >{t("auth_tab_register")}</button>
          </div>

          {mode === "login" && (
            <>
              <h1 className="text-xl font-bold text-black mb-1">{t("auth_welcome_title")}</h1>
              <p className="text-sm text-gray-500 mb-4">{t("auth_welcome_sub")}</p>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm font-semibold p-3 rounded-xl mb-3">{error}</div>
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

              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="block text-right w-full text-xs text-green-700 font-semibold mb-3 -mt-1"
              >
                {t("auth_forgot_password")}
              </button>

              <button
                onClick={handleLogin}
                disabled={busy}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold"
              >
                {busy ? t("auth_please_wait") : t("auth_signin_button")}
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
            </>
          )}

          {mode === "register" && registerStep === "form" && (
            <>
              <h1 className="text-xl font-bold text-black mb-1">{t("auth_create_title")}</h1>
              <p className="text-sm text-gray-500 mb-4">{t("auth_create_sub")}</p>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm font-semibold p-3 rounded-xl mb-3">{error}</div>
              )}

              <input
                type="text"
                placeholder={t("auth_fullname_placeholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border rounded-xl p-3 text-black mb-3"
              />
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
              <input
                type="password"
                placeholder={t("auth_confirm_password_placeholder")}
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                className="w-full border rounded-xl p-3 text-black mb-3"
              />

              <button
                onClick={handleRegisterSendCode}
                disabled={busy}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold"
              >
                {busy ? t("auth_please_wait") : t("auth_send_code_button")}
              </button>
            </>
          )}

          {mode === "register" && registerStep === "code" && (
            <>
              <h1 className="text-xl font-bold text-black mb-1">{t("auth_code_title")}</h1>
              <p className="text-sm text-gray-500 mb-1">{t("auth_code_sub")}</p>
              <p className="text-sm text-green-700 font-semibold mb-4">{phone}</p>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm font-semibold p-3 rounded-xl mb-3">{error}</div>
              )}

              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder={t("auth_code_placeholder")}
                value={registerCode}
                onChange={(e) => setRegisterCode(e.target.value.replace(/[^0-9]/g, ""))}
                className="w-full border rounded-xl p-3 text-black mb-3 text-center tracking-[0.3em] text-lg font-bold"
              />

              <button
                onClick={handleRegisterVerify}
                disabled={busy}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold mb-3"
              >
                {busy ? t("auth_please_wait") : t("auth_verify_button")}
              </button>

              <div className="flex justify-between text-xs font-semibold">
                <button type="button" onClick={() => { setRegisterStep("form"); setError(""); }} className="text-gray-500">
                  {t("auth_back_to_form")}
                </button>
                <button type="button" onClick={handleResendRegisterCode} disabled={busy} className="text-green-700">
                  {t("auth_resend_code")}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {showForgotPassword && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={closeForgotPassword}
        >
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            {forgotStep === "phone" && (
              <>
                <h3 className="font-bold text-black text-lg mb-2">{t("auth_forgot_password_phone_title")}</h3>
                <p className="text-sm text-gray-600 mb-4">{t("auth_forgot_password_phone_sub")}</p>

                {forgotError && (
                  <div className="bg-red-50 text-red-600 text-sm font-semibold p-3 rounded-xl mb-3">{forgotError}</div>
                )}

                <input
                  type="text"
                  placeholder="010-1234-5678"
                  value={forgotPhone}
                  onChange={(e) => setForgotPhone(e.target.value)}
                  className="w-full border rounded-xl p-3 text-black mb-4"
                />

                <button
                  onClick={handleForgotSendCode}
                  disabled={busy}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold mb-2"
                >
                  {busy ? t("auth_please_wait") : t("auth_send_code_button")}
                </button>
                <button
                  onClick={closeForgotPassword}
                  className="w-full bg-gray-100 text-gray-600 py-2.5 rounded-xl font-bold"
                >
                  {t("auth_forgot_password_close")}
                </button>
              </>
            )}

            {forgotStep === "code" && (
              <>
                <h3 className="font-bold text-black text-lg mb-2">{t("auth_code_title")}</h3>
                <p className="text-sm text-gray-600 mb-1">{t("auth_code_sub")}</p>
                <p className="text-sm text-green-700 font-semibold mb-4">{forgotPhone}</p>

                {forgotError && (
                  <div className="bg-red-50 text-red-600 text-sm font-semibold p-3 rounded-xl mb-3">{forgotError}</div>
                )}

                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder={t("auth_code_placeholder")}
                  value={forgotCode}
                  onChange={(e) => setForgotCode(e.target.value.replace(/[^0-9]/g, ""))}
                  className="w-full border rounded-xl p-3 text-black mb-4 text-center tracking-[0.3em] text-lg font-bold"
                />

                <button
                  onClick={handleForgotVerify}
                  disabled={busy}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white py-3 rounded-xl font-bold mb-2"
                >
                  {busy ? t("auth_please_wait") : t("auth_verify_button")}
                </button>

                <div className="flex justify-between text-xs font-semibold mb-2">
                  <button type="button" onClick={() => { setForgotStep("phone"); setForgotError(""); }} className="text-gray-500">
                    {t("auth_back_to_form")}
                  </button>
                  <button type="button" onClick={handleForgotResendCode} disabled={busy} className="text-green-700">
                    {t("auth_resend_code")}
                  </button>
                </div>

                <button
                  onClick={closeForgotPassword}
                  className="w-full bg-gray-100 text-gray-600 py-2.5 rounded-xl font-bold"
                >
                  {t("auth_forgot_password_close")}
                </button>
              </>
            )}

            {forgotStep === "done" && (
              <>
                <h3 className="font-bold text-black text-lg mb-2">{t("auth_forgot_password_done_title")}</h3>
                <p className="text-sm text-gray-600 mb-4">{t("auth_forgot_password_done_message")}</p>
                <button
                  onClick={closeForgotPassword}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-bold"
                >
                  {t("auth_forgot_password_done_close")}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
