"use client";

import { useAuth } from "@/lib/AuthContext";
import BottomNav from "@/components/BottomNav";

export default function ProfilePage() {
  const { user, signOut } = useAuth();

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white p-4 md:p-8 pb-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-black mb-6">👤 Profil</h1>

        <div className="bg-white border border-green-100 rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-green-600 text-white flex items-center justify-center text-xl font-bold">
              {user?.name ? user.name.charAt(0).toUpperCase() : "?"}
            </div>
            <div>
              <p className="text-lg font-bold text-black">{user?.name}</p>
              <p className="text-gray-500">{user?.phone}</p>
            </div>
          </div>
        </div>

        <button
          onClick={signOut}
          className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-2xl font-bold"
        >
          Chiqish
        </button>
      </div>
      <BottomNav />
    </main>
  );
}