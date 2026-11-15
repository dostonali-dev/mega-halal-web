"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import AuthForm from "@/components/AuthForm";
import BottomNav from "@/components/BottomNav";
import EdgeSwipeBack from "@/components/EdgeSwipeBack";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, guestMode } = useAuth();
  const [videoFailed, setVideoFailed] = useState(false);
  const [videoDone, setVideoDone] = useState(false);

  useEffect(() => {
    // Agar "video tugadi" hodisasi biror sababdan ishlamay qolsa
    // (masalan brauzer autoplay'ni bloklasa), ilova abadiy intro
    // ekranida qolib ketmasligi uchun xavfsizlik taymeri.
    const timer = setTimeout(() => setVideoDone(true), 6000);
    return () => clearTimeout(timer);
  }, []);

  if (pathname.startsWith("/admin")) return <>{children}</>;

  const showIntroVideo = !videoFailed && !videoDone;

  if (showIntroVideo || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#000000" }}>
        {showIntroVideo ? (
          <video
            src="/videos/mega-intro.mp4"
            autoPlay
            muted
            playsInline
            onEnded={() => setVideoDone(true)}
            onError={() => setVideoFailed(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "#86efac" }}>
            Mega Supermarket
          </h1>
        )}
      </div>
    );
  }

  if (!user && !guestMode) return <AuthForm />;

  return (
    <>
      <EdgeSwipeBack />
      {children}
      <BottomNav />
    </>
  );
}
