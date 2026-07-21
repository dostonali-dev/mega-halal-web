"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

type Profile = { id: string; name: string; phone: string };

type AuthContextType = {
  user: Profile | null;
  loading: boolean;
  signUp: (name: string, phone: string, password: string) => Promise<string | null>;
  signIn: (phone: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function phoneToEmail(phone: string) {
  const digits = phone.replace(/[^0-9]/g, "");
  return `${digits}@megahalal.local`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) setUser({ id: data.id, name: data.name, phone: data.phone });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setUser(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const signUp = async (name: string, phone: string, password: string) => {
    const email = phoneToEmail(phone);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return error.message;
    if (!data.user) return "Ro'yxatdan o'tishda xatolik.";

    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      name,
      phone,
    });
    if (profileError) return profileError.message;

    setUser({ id: data.user.id, name, phone });
    return null;
  };

  const signIn = async (phone: string, password: string) => {
    const email = phoneToEmail(phone);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return "Telefon raqami yoki parol noto'g'ri.";
    return null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}