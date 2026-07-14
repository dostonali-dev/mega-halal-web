"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
  const isLoggedIn = localStorage.getItem("adminLoggedIn");

  if (isLoggedIn === "true") {
    setLoggedIn(true);
  }
}, []);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [image, setImage] = useState("");

  if (!loggedIn) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
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

          <button
            onClick={() => {
              if (
                username === "admin" &&
                password === "123456"
              ) {
                setLoggedIn(true);
                localStorage.setItem("adminLoggedIn", "true");
                localStorage.setItem("adminLoggedIn", "true");
                useEffect(() => {
  const isLoggedIn = localStorage.getItem("adminLoggedIn");

  if (isLoggedIn === "true") {
    setLoggedIn(true);
  }
}, []);
<button
  onClick={() => {
    localStorage.removeItem("adminLoggedIn");
    setLoggedIn(false);
  }}
>
  Chiqish
</button>
              } else {
                alert("Login yoki parol noto'g'ri");
              }
            }}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl"
          >
            Kirish
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="p-10">
      <h1 className="text-4xl font-bold">
  Mega Halal Admin Panel
</h1>

<p className="mt-4 text-green-600">
  Muvaffaqiyatli kirdingiz ✅
</p>

<div className="flex gap-3 mt-4 mb-6">
  <Link
    href="/admin"
    className="flex-1 bg-green-600 text-white text-center py-3 rounded-xl"
  >
    ➕ Mahsulotlar
  </Link>

  <Link
    href="/admin/orders"
    className="flex-1 bg-blue-600 text-white text-center py-3 rounded-xl"
  >
    📦 Buyurtmalar
  </Link>
  <button
    onClick={() => {
      localStorage.removeItem("adminLoggedIn");
      setLoggedIn(false);
    }}
    className="bg-red-600 text-white px-4 py-3 rounded-xl"
  >
    🚪 Chiqish
  </button>
</div>

      <div className="mt-8 max-w-md space-y-4">
        <input
          type="text"
          placeholder="Mahsulot nomi"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-3 rounded-xl bg-white text-black"
        />

        <input
          type="number"
          placeholder="Narxi"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-full border p-3 rounded-xl bg-white text-black"
        />

        <input
          type="text"
          placeholder="Kategoriya"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full border p-3 rounded-xl bg-white text-black"
        />

        <input
          type="text"
          placeholder="Rasm nomi"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          className="w-full border p-3 rounded-xl bg-white text-black"
        />

        <button
         onClick={async () => {
            const { error } = await supabase
  .from("products")
  .insert([
    {
      name,
      price: Number(price),
      category,
      image,
    },
  ]);

if (error) {
  alert("Xato: " + error.message);
  return;
}

alert("Mahsulot qo'shildi ✅");

setName("");
setPrice("");
setCategory("");
setImage("");
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl"
        >
          Mahsulot qo'shish
        </button>
      </div>
    </main>
  );
}