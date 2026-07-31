"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/lib/LanguageContext";

// Yetkazib berilgan ("📦 Jo'natildi") buyurtma ostida ko'rinadigan
// yulduzcha-baho + izoh blok. "order_reviews" jadvaliga yozadi (bir
// buyurtma uchun bitta baho - order_id ustida unique index bor).
//
// SQL (bir marta Supabase SQL Editor'da ishga tushiriladi):
// create table if not exists order_reviews (
//   id bigint generated always as identity primary key,
//   order_id bigint references orders(id) on delete cascade,
//   rating int not null check (rating between 1 and 5),
//   comment text,
//   created_at timestamptz default now()
// );
// create unique index if not exists order_reviews_order_id_idx on order_reviews(order_id);
export default function OrderRating({ orderId }: { orderId: number }) {
  const { t } = useLanguage();
  const [existingRating, setExistingRating] = useState<number | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("order_reviews").select("rating").eq("order_id", orderId).maybeSingle();
      if (!cancelled) {
        if (data) setExistingRating(data.rating);
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    const { error } = await supabase.from("order_reviews").insert({
      order_id: orderId,
      rating,
      comment: comment.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      alert("Xatolik: " + error.message);
      return;
    }
    setDone(true);
  };

  if (!loaded) return null;

  if (existingRating || done) {
    const shown = done ? rating : existingRating || 0;
    return (
      <div className="mt-2 pt-2 border-t">
        <p className="text-xs font-bold text-green-700">
          {t("rate_order_already")} {"⭐".repeat(shown)}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-2 pt-2 border-t">
      <p className="text-xs font-bold text-black mb-1.5">{t("rate_order_title")}</p>
      <div className="flex gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setRating(n)}
            aria-label={`${n} yulduz`}
            className="text-xl leading-none"
          >
            {n <= rating ? "⭐" : "☆"}
          </button>
        ))}
      </div>
      {rating > 0 && (
        <>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("rate_order_placeholder")}
            className="w-full border rounded-lg p-2 text-base text-black mb-2"
            rows={2}
          />
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-green-600 disabled:opacity-60 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
          >
            {submitting ? "..." : t("rate_order_submit")}
          </button>
        </>
      )}
    </div>
  );
}
