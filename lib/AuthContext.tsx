"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  name: string;
  phone: string;
  address?: string | null;
  addressDetail?: string | null;
  addressImage?: string | null;
};

type AuthContextType = {
  user: Profile | null;
  loading: boolean;
  guestMode: boolean;
  continueAsGuest: () => void;
  exitGuest: () => void;
  signUp: (name: string, phone: string, password: string) => Promise<string | null>;
  signIn: (phone: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  updateAddress: (data: { address?: string | null; addressDetail?: string | null; addressImage?: string | null }) => Promise<string | null>;
  updatePassword: (newPassword: string) => Promise<string | null>;
  updatePhone: (newPhone: string) => Promise<string | null>;
  deleteAccount: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function phoneToEmail(phone: string) {
  const digits = phone.replace(/[^0-9]/g, "");
  return `${digits}@megahalal.local`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [guestMode, setGuestMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("mhs_guest_mode");
    if (stored === "true") setGuestMode(true);
  }, []);

  const continueAsGuest = () => {
    localStorage.setItem("mhs_guest_mode", "true");
    setGuestMode(true);
  };

  const exitGuest = () => {
    localStorage.removeItem("mhs_guest_mode");
    setGuestMode(false);
  };

  const loadProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (data) {
      setUser({
        id: data.id,
        name: data.name,
        phone: data.phone,
        address: data.address,
        addressDetail: data.address_detail,
        addressImage: data.address_image,
      });
    }
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
    exitGuest();
    return null;
  };

  const signIn = async (phone: string, password: string) => {
    const email = phoneToEmail(phone);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return "Telefon raqami yoki parol noto'g'ri.";
    exitGuest();
    return null;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    exitGuest();
    if (typeof window !== "undefined") {
      // Boshqa contextlarga (savatcha va h.k.) shu foydalanuvchiga tegishli
      // lokal ma'lumotlarni tozalash kerakligini bildiramiz — mehmon bo'lib
      // kirganda avvalgi akkauntning savatchasi ko'rinib qolmasligi uchun.
      window.dispatchEvent(new Event("mhs-signed-out"));
    }
  };

  const updateAddress = async (fields: { address?: string | null; addressDetail?: string | null; addressImage?: string | null }) => {
    if (!user) return "Avval tizimga kiring.";
    const { error } = await supabase
      .from("profiles")
      .update({
        address: fields.address ?? null,
        address_detail: fields.addressDetail ?? null,
        address_image: fields.addressImage ?? null,
      })
      .eq("id", user.id);
    if (error) return error.message;
    await loadProfile(user.id);
    return null;
  };

  const updatePassword = async (newPassword: string) => {
    if (!user) return "Avval tizimga kiring.";
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return error.message;
    return null;
  };

  const updatePhone = async (newPhone: string) => {
    if (!user) return "Avval tizimga kiring.";

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("phone", newPhone)
      .neq("id", user.id)
      .maybeSingle();
    if (existing) return "Bu raqam allaqachon ro'yxatdan o'tgan.";

    const newEmail = phoneToEmail(newPhone);
    const { error: authError } = await supabase.auth.updateUser({ email: newEmail });
    if (authError) return authError.message;

    const { error: profileError } = await supabase.from("profiles").update({ phone: newPhone }).eq("id", user.id);
    if (profileError) return profileError.message;

    setUser((prev) => (prev ? { ...prev, phone: newPhone } : prev));
    return null;
  };

  const deleteAccount = async () => {
    if (!user) return "Avval tizimga kiring.";
    await supabase.from("addresses").delete().eq("user_id", user.id);
    await supabase.from("favorites").delete().eq("user_id", user.id);
    const { error } = await supabase.from("profiles").delete().eq("id", user.id);
    if (error) return error.message;
    await supabase.auth.signOut();
    setUser(null);
    return null;
  };

  return (
    <AuthContext.Provider value={{ user, loading, guestMode, continueAsGuest, exitGuest, signUp, signIn, signOut, updateAddress, updatePassword, updatePhone, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}