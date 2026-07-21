"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import AuthForm from "@/components/AuthForm";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  if (pathname.startsWith("/admin")) return <>{children}</>;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Yuklanmoqda...
      </div>
    );
  }

  if (!user) return <AuthForm />;

  return <>{children}</>;
}