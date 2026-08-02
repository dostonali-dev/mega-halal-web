"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { phoneToEmail, normalizePhone } from "@/lib/phone";

type Profile = {
  id: string;
  name: string;
  phone: string;
  address?: string | null;
  addressDetail?: string | null;
  addressImage?: string | null;
  avatar?: string | null;
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
  sendVerificationCode: (phone: string, purpose: "signup" | "reset") => Promise<string | null>;
  verifyCode: (phone: string, code: string, purpose: "signup" | "reset") => Promise<{ verifyId?: string; error?: string }>;
  completeRegistration: (name: string, phone: string, password: string, verifyId: string) => Promise<string | null>;
  completePasswordReset: (phone: string, verifyId: string) => Promise<string | null>;
  updateAddress: (data: { address?: string | null; addressDetail?: string | null; addressImage?: string | null }) => Promise<string | null>;
  updateAvatar: (avatarUrl: string | null) => Promise<string | null>;
  updatePassword: (newPassword: string) => Promise<string | null>;
  updatePhone: (newPhone: string) => Promise<string | null>;
  updateName: (newName: string) => Promise<string | null>;
  deleteAccount: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType | null>(null);

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
        avatar: data.avatar_url,
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
    const digits = normalizePhone(phone);
    const email = phoneToEmail(digits);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return error.message;
    if (!data.user) return "Ro'yxatdan o'tishda xatolik.";

    const { error: profileError } = await supabase.from("profiles").insert({
      id: data.user.id,
      name,
      phone: digits,
    });
    if (profileError) return profileError.message;

    setUser({ id: data.user.id, name, phone: digits });
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

  // Mijozning o'z profil rasmini o'rnatishi/o'zgartirishi uchun - rasm
  // avval Supabase Storage'ga yuklanib, shu yerga faqat public URL beriladi
  // (yoki o'chirish uchun null).
  const updateAvatar = async (avatarUrl: string | null) => {
    if (!user) return "Avval tizimga kiring.";
    const { error } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
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
    const digits = normalizePhone(newPhone);

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("phone", digits)
      .neq("id", user.id)
      .maybeSingle();
    if (existing) return "Bu raqam allaqachon ro'yxatdan o'tgan.";

    const newEmail = phoneToEmail(digits);
    const { error: authError } = await supabase.auth.updateUser({ email: newEmail });
    if (authError) return authError.message;

    const { error: profileError } = await supabase.from("profiles").update({ phone: digits }).eq("id", user.id);
    if (profileError) return profileError.message;

    setUser((prev) => (prev ? { ...prev, phone: digits } : prev));
    return null;
  };

  const updateName = async (newName: string) => {
    if (!user) return "Avval tizimga kiring.";
    if (!newName.trim()) return "Ism bo'sh bo'lishi mumkin emas.";
    const { error } = await supabase.from("profiles").update({ name: newName.trim() }).eq("id", user.id);
    if (error) return error.message;
    setUser((prev) => (prev ? { ...prev, name: newName.trim() } : prev));
    return null;
  };

  // Ro'yxatdan o'tish yoki parolni tiklash uchun telefon raqamiga SMS orqali
  // 6 xonali tasdiqlash kodi yuborishni so'raydi.
  const sendVerificationCode = async (phone: string, purpose: "signup" | "reset") => {
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, purpose }),
      });
      const data = await res.json();
      if (!res.ok) return data.error || "Kod yuborishda xatolik.";
      return null;
    } catch {
      return "Tarmoq xatoligi. Internetni tekshiring.";
    }
  };

  // Foydalanuvchi kiritgan kodni serverda tekshiradi. Muvaffaqiyatli bo'lsa,
  // keyingi qadam (ro'yxatdan o'tish yoki parol tiklash) uchun kerak bo'ladigan
  // "verifyId"ni qaytaradi.
  const verifyCode = async (phone: string, code: string, purpose: "signup" | "reset") => {
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, purpose }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || "Kod noto'g'ri." };
      return { verifyId: data.verifyId as string };
    } catch {
      return { error: "Tarmoq xatoligi. Internetni tekshiring." };
    }
  };

  // Telefon tasdiqlangandan keyin hisobni serverda yaratadi, so'ng shu
  // ma'lumotlar bilan avtomatik tizimga kiritadi.
  const completeRegistration = async (name: string, phone: string, password: string, verifyId: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password, verifyId }),
      });
      const data = await res.json();
      if (!res.ok) return data.error || "Ro'yxatdan o'tishda xatolik.";
      return await signIn(phone, password);
    } catch {
      return "Tarmoq xatoligi. Internetni tekshiring.";
    }
  };

  // Telefon tasdiqlangandan keyin, tizim o'zi yangi parol yaratib, uni SMS
  // orqali foydalanuvchiga yuboradi (admin aralashuvisiz).
  const completePasswordReset = async (phone: string, verifyId: string) => {
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, verifyId }),
      });
      const data = await res.json();
      if (!res.ok) return data.error || "Xatolik yuz berdi.";
      return null;
    } catch {
      return "Tarmoq xatoligi. Internetni tekshiring.";
    }
  };

  const deleteAccount = async () => {
    if (!user) return "Avval tizimga kiring.";

    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) return "Sessiya topilmadi, qaytadan tizimga kiring.";

    try {
      const res = await fetch("/api/auth/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });
      const data = await res.json();
      if (!res.ok) return data.error || "Hisobni o'chirishda xatolik.";
    } catch {
      return "Tarmoq xatoligi. Internetni tekshiring.";
    }

    // signOut() (raw supabase.auth.signOut() emas) — bu boshqa contextlarga
    // (masalan savatcha) "mhs-signed-out" hodisasini yuborib, shu qurilmadagi
    // eski hisobga tegishli lokal ma'lumotlarni ham tozalaydi.
    await signOut();
    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        guestMode,
        continueAsGuest,
        exitGuest,
        signUp,
        signIn,
        signOut,
        sendVerificationCode,
        verifyCode,
        completeRegistration,
        completePasswordReset,
        updateAddress,
        updateAvatar,
        updatePassword,
        updatePhone,
        updateName,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}