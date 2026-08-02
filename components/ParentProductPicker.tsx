"use client";

import { useEffect, useRef, useState } from "react";

type ProductOption = { id: number; name: string };

// Mahsulotlar soni ko'p bo'lganda oddiy <select> ichidan "bosh mahsulot"ni
// topish qiyin bo'lib qolgani uchun - qidiruv maydoni bilan ishlaydigan
// tanlov komponenti. Hech narsa tanlanmagan bo'lsa - qidiruv inputi va
// mos keluvchi mahsulotlar ro'yxati (dropdown) ko'rsatiladi; tanlangandan
// keyin - tanlangan mahsulot nomi va uni bekor qilish (✕) tugmasi chiqadi.
export default function ParentProductPicker({
  options,
  value,
  onChange,
}: {
  options: ProductOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  const selected = options.find((p) => String(p.id) === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const q = query.trim().toLowerCase();
  const filtered = (q ? options.filter((p) => p.name.toLowerCase().includes(q)) : options).slice(0, 50);

  return (
    <div className="relative" ref={wrapRef}>
      {selected ? (
        <div className="w-full border p-3 rounded-xl bg-white text-black flex items-center justify-between gap-2">
          <span className="truncate">{selected.name}</span>
          <button
            type="button"
            onClick={() => {
              onChange("");
              setQuery("");
            }}
            aria-label="Bekor qilish"
            className="text-red-500 font-bold flex-shrink-0 px-2"
          >
            ✕
          </button>
        </div>
      ) : (
        <input
          type="text"
          placeholder="🔍 Bosh mahsulotni qidirish uchun nom yozing..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="w-full border p-3 rounded-xl bg-white text-black"
        />
      )}

      {open && !selected && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border rounded-xl shadow-lg max-h-64 overflow-y-auto">
          {filtered.length === 0 && <p className="p-3 text-sm text-gray-400">Mahsulot topilmadi</p>}
          {filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                onChange(String(p.id));
                setQuery("");
                setOpen(false);
              }}
              className="w-full text-left p-3 text-black hover:bg-green-50 border-b last:border-b-0"
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
