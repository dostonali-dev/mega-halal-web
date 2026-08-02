"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (isLoggedIn === "true") setLoggedIn(true);
  }, []);

  const handleLogin = () => {
    if (username === "admin" && password === "123456") {
      setLoggedIn(true);
      localStorage.setItem("adminLoggedIn", "true");
    } else {
      alert("Login yoki parol noto'g'ri");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    setLoggedIn(false);
  };

  if (!loggedIn) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-green-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-green-600 to-green-700 shadow-lg flex items-center justify-center overflow-hidden p-2">
              <img src="/icons/icon-512.png" alt="Mega Halal Admin" className="w-full h-full object-cover rounded-2xl" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-green-700 mb-6 text-center">
            Mega Halal Admin
          </h1>

          <input
            type="text"
            placeholder="Login"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-300 bg-gray-50 text-black p-3 rounded-xl mb-4"
          />

          <input
            type="password"
            placeholder="Parol"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 bg-gray-50 text-black p-3 rounded-xl mb-4"
          />

          <button onClick={handleLogin} className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl">
            Kirish
          </button>
        </div>
      </main>
    );
  }

  const menuItems = [
    { href: "/admin/products", icon: "🔍", label: "Mahsulotlar", desc: "Qidirish, tahrirlash, o'chirish" },
    { href: "/admin/products/new", icon: "➕", label: "Mahsulot qo'shish", desc: "Yangi mahsulot qo'shish" },
    { href: "/admin/products/import", icon: "📥", label: "Excel import", desc: "Excel fayldan ommaviy mahsulot qo'shish" },
    { href: "/admin/categories", icon: "🗂️", label: "Kategoriyalar", desc: "Kategoriyalarni boshqarish" },
    { href: "/admin/orders", icon: "📦", label: "Buyurtmalar", desc: "Kelgan buyurtmalarni ko'rish" },
    { href: "/admin/reports", icon: "📊", label: "Hisobot", desc: "Kunlik savdo, buyurtma va mijozlar statistikasi" },
    { href: "/admin/customers", icon: "👥", label: "Mijozlar", desc: "Ro'yxatdan o'tgan mijozlar ro'yhati" },
    { href: "/admin/banners", icon: "🖼️", label: "Bannerlar", desc: "Bosh sahifa bannerlari" },
    { href: "/admin/announcement", icon: "📢", label: "E'lon oynasi", desc: "Mijozlarga ko'rsatiladigan e'lon" },
    { href: "/admin/push", icon: "📣", label: "Push xabar", desc: "Mijozlar ilovasiga push bildirishnoma yuborish" },
  ];

  return (
    <main className="min-h-screen bg-green-50 p-6 md:p-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-600 to-green-700 shadow-lg flex items-center justify-center overflow-hidden p-1.5 flex-shrink-0">
            <img src="/icons/icon-512.png" alt="Mega Halal Admin" className="w-full h-full object-cover rounded-xl" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-black mb-1">Mega Halal Admin</h1>
            <p className="text-gray-500">Boshqarish paneli</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="bg-white border border-green-100 rounded-2xl p-5 shadow hover:shadow-md transition"
            >
              <div className="text-3xl mb-2">{item.icon}</div>
              <div className="font-bold text-black">{item.label}</div>
              <div className="text-xs text-gray-500 mt-1">{item.desc}</div>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <button onClick={handleLogout} className="text-gray-400 text-sm underline">
            🚪 Chiqish
          </button>
        </div>
      </div>
    </main>
  );
}