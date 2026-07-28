"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import AuthForm from "@/components/AuthForm";
import BottomNav from "@/components/BottomNav";
import EdgeSwipeBack from "@/components/EdgeSwipeBack";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading, guestMode } = useAuth();

  if (pathname.startsWith("/admin")) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#000000" }}>
        <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: "#86efac" }}>
          Mega Supermarket
        </h1>
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
