"use client";

import { useEffect, useState } from "react";

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("mhs_install_dismissed");
    if (dismissed) return;

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone;
    if (standalone) return;

    const iosDevice = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    setIsIOS(iosDevice);

    if (iosDevice) {
      setShowBanner(true);
      return;
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("mhs_install_dismissed", "true");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="bg-green-600 text-white rounded-2xl p-4 mb-6 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📲</span>
          <div>
            <p className="font-bold text-sm">Ilovani telefoningizga o'rnating</p>
            <p className="text-xs opacity-80">Tezroq va qulayroq foydalanish uchun</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button onClick={handleInstallClick} className="bg-white text-green-700 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap">
            O'rnatish
          </button>
          <button onClick={handleDismiss} className="text-white/80 text-lg px-1">✕</button>
        </div>
      </div>

      {showIOSInstructions && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowIOSInstructions(false)}
        >
          <div className="bg-white rounded-2xl p-6 max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-black mb-3">📲 Ilovani o'rnatish (iPhone)</h3>
            <ol className="text-sm text-black space-y-2 list-decimal pl-4">
              <li>Pastdagi <b>Share</b> (yuqoriga qarab turgan strelka) tugmasini bosing</li>
              <li><b>"Add to Home Screen"</b> ni tanlang</li>
              <li><b>"Add"</b> tugmasini bosing</li>
            </ol>
            <button
              onClick={() => setShowIOSInstructions(false)}
              className="mt-4 w-full bg-green-600 text-white py-2 rounded-xl font-bold"
            >
              Tushunarli
            </button>
          </div>
        </div>
      )}
    </>
  );
}