"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { formatSeoulDate, formatSeoulTime, seoulDateKey } from "@/lib/dateUtils";
import ProductImage from "@/components/ProductImage";

type OrderItemRow = {
  id: number;
  product_id: number | null;
  product_name: string | null;
  quantity: number;
  price: number;
  image?: string | null;
};

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [checkedLogin, setCheckedLogin] = useState(false);
  const [detailOrder, setDetailOrder] = useState<any | null>(null);
  const [detailItems, setDetailItems] = useState<OrderItemRow[]>([]);
  const [detailReview, setDetailReview] = useState<{ rating: number; comment: string | null; reply?: string | null } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (isLoggedIn !== "true") {
      router.push("/admin");
    } else {
      setCheckedLogin(true);
    }
  }, [router]);

  useEffect(() => {
    if (checkedLogin) loadOrders();
  }, [checkedLogin]);

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    setOrders(data || []);
  };

  const openOrderDetail = async (order: any) => {
    setDetailOrder(order);
    setDetailItems([]);
    setDetailReview(null);
    setReplyText("");
    setDetailLoading(true);

    const [{ data: itemRows }, { data: reviewRow }] = await Promise.all([
      supabase.from("order_items").select("id, product_id, product_name, quantity, price").eq("order_id", order.id),
      supabase.from("order_reviews").select("rating, comment, reply").eq("order_id", order.id).maybeSingle(),
    ]);

    if (itemRows && itemRows.length > 0) {
      const productIds = itemRows.map((r) => r.product_id).filter((id): id is number => id != null);
      let imageMap: Record<number, string | null> = {};
      if (productIds.length > 0) {
        const { data: productsData } = await supabase.from("products").select("id, image").in("id", productIds);
        (productsData || []).forEach((p: any) => {
          imageMap[p.id] = p.image;
        });
      }
      setDetailItems(itemRows.map((r) => ({ ...r, image: r.product_id != null ? imageMap[r.product_id] : null })));
    }
    if (reviewRow) setDetailReview(reviewRow);
    setDetailLoading(false);
  };

  const refreshDetailOrder = async (orderId: number) => {
    const { data } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
    if (data) setDetailOrder(data);
  };

  // Admin mijozning yozgan baho-izohiga javob yozganda: bazaga saqlaymiz va
  // mijozga (agar ro'yxatdan o'tgan bo'lsa - user_id bor bo'lsa) push
  // bildirishnoma yuboramiz. Push yuborish server tomonida (REST API kalit
  // brauzerga chiqmasligi uchun) - shu sabab alohida API route chaqiriladi.
  const sendReview = async (orderId: number, userId: string | null) => {
    if (!replyText.trim()) return;
    setSendingReply(true);
    const { error } = await supabase
      .from("order_reviews")
      .update({ reply: replyText.trim(), replied_at: new Date().toISOString() })
      .eq("order_id", orderId);

    if (error) {
      alert("Xatolik: " + error.message);
      setSendingReply(false);
      return;
    }

    setDetailReview((prev) => (prev ? { ...prev, reply: replyText.trim() } : prev));

    try {
      await fetch("/api/order/reply-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, userId, reply: replyText.trim() }),
      });
    } catch (e) {
      console.error("Push yuborishda xatolik:", e);
    }

    setSendingReply(false);
  };

  const statusColors: Record<string, string> = {
    "❌ Bekor qilindi": "status-cancelled",
    "📦 Jo'natildi": "status-shipped",
    "✅ To'landi": "status-paid",
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const latestDateKey = orders.length > 0 ? seoulDateKey(orders[0].created_at) : null;
  const latestDateLabel = orders.length > 0 ? formatSeoulDate(orders[0].created_at) : "";
  const latestGroupIds = orders.filter((o) => seoulDateKey(o.created_at) === latestDateKey).map((o) => o.id);
  const allLatestSelected = latestGroupIds.length > 0 && latestGroupIds.every((id) => selectedIds.has(id));
  const toggleSelectLatestDate = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allLatestSelected) {
        latestGroupIds.forEach((id) => next.delete(id));
      } else {
        latestGroupIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // Lotte Tekpe uchun — status matnlari koreyschaga o'giriladi
  const STATUS_KO: Record<string, string> = {
    "✅ To'landi": "결제완료",
    "📦 Jo'natildi": "배송완료",
    "❌ Bekor qilindi": "취소됨",
  };

  const handleExportExcel = async () => {
    const selectedOrders = orders.filter((o) => selectedIds.has(o.id));
    if (selectedOrders.length === 0) {
      alert("Avval eksport qilmoqchi bo'lgan buyurtmalarni belgilang (☑)");
      return;
    }
    setExporting(true);
    try {
      const XLSX = await import("xlsx");
      const rows = selectedOrders.map((o) => ({
        "주문번호": o.id,
        "날짜": formatSeoulDate(o.created_at),
        "시간": formatSeoulTime(o.created_at),
        "고객명": o.customer_name || "",
        "전화번호": o.phone || "",
        "주소": o.address_main || o.address || "",
        "상세주소": o.address_detail || "",
        "상품 목록": (o.order_text || "").replace(/\n/g, "; "),
        "총 금액 (₩)": o.total || 0,
        "상태": (o.status && STATUS_KO[o.status]) || "대기중",
        "비고": o.note || "",
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [
        { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 16 }, { wch: 14 },
        { wch: 30 }, { wch: 24 }, { wch: 40 }, { wch: 12 }, { wch: 14 }, { wch: 20 },
      ];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "주문내역");
      const today = new Date().toISOString().slice(0, 10);
      const fileName = `mega-halal-orders-${today}.xlsx`;

      // Native ilova ichida (TestFlight/App Store, Capacitor) bo'lsak, WebView'da
      // oddiy brauzer-uslubidagi yuklab olish ishlamaydi — shu sabab faylni
      // qurilma xotirasiga yozib, so'ng native "Ulashish" (Share) oynasini ochamiz,
      // shu orqali admin faylni Files ilovasiga saqlashi yoki to'g'ridan-to'g'ri
      // AirDrop/Mail/WhatsApp orqali Lotte hamkoriga yuborishi mumkin.
      // MUHIM: Share pluginida lokal fayl "files" massivi orqali beriladi — "url"
      // orqali emas ("url" faqat veb-havolalar uchun, lokal fayl uni e'tiborsiz
      // qoldiradi va shuning uchun avvalgi versiyada "saqlab bo'lmayapti" degan
      // muammo kelib chiqqan edi).
      const { Capacitor } = await import("@capacitor/core");
      if (Capacitor.isNativePlatform()) {
        const base64 = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
        const { Filesystem, Directory } = await import("@capacitor/filesystem");
        const { Share } = await import("@capacitor/share");

        const written = await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Cache,
        });

        await Share.share({
          title: fileName,
          files: [written.uri],
          dialogTitle: "Excel faylni saqlash yoki yuborish",
        });
      } else {
        XLSX.writeFile(wb, fileName);
      }
    } catch (e) {
      console.error(e);
      alert("Excel faylni tayyorlashda xatolik yuz berdi: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setExporting(false);
    }
  };

  // Buyurtmalarni kun bo'yicha guruhlash (Koreya vaqti bo'yicha)
  const groups: { dateKey: string; label: string; items: any[] }[] = [];
  for (const order of orders) {
    const key = seoulDateKey(order.created_at);
    const last = groups[groups.length - 1];
    if (last && last.dateKey === key) {
      last.items.push(order);
    } else {
      groups.push({ dateKey: key, label: formatSeoulDate(order.created_at), items: [order] });
    }
  }

  if (!checkedLogin) return null;

  return (
    <main className="p-6 md:p-8">
      <div className="flex items-center justify-between mb-3">
        <Link href="/admin" aria-label="Menyu" className="inline-flex items-center justify-center w-11 h-11 rounded-full flex-shrink-0" style={{ backgroundColor: "#dcfce7" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <button
          onClick={handleExportExcel}
          disabled={exporting || selectedIds.size === 0}
          className="bg-green-600 disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-xl"
        >
          {exporting ? "Tayyorlanmoqda..." : `📤 Excel yuklab olish${selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}`}
        </button>
      </div>
      <h1 className="text-3xl font-bold mb-3">📦 Buyurtmalar</h1>

      {orders.length > 0 && (
        <label className="flex items-center gap-2 mb-4 text-sm font-semibold text-gray-600 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={allLatestSelected}
            onChange={toggleSelectLatestDate}
            className="w-5 h-5"
          />
          Oxirgi sanani belgilash{latestDateLabel ? ` (${latestDateLabel})` : ""}
        </label>
      )}

      <div className="max-w-3xl">
        {groups.map((group) => (
          <div key={group.dateKey}>
            <div className="relative flex items-center py-4">
              <div className="flex-1 border-t-2 border-gray-200" />
              <span className="px-3 text-sm font-bold text-gray-500 whitespace-nowrap">{group.label}</span>
              <div className="flex-1 border-t-2 border-gray-200" />
            </div>

            <div className="space-y-3">
              {group.items.map((order) => {
                const statusClass = statusColors[order.status] || "status-pending";
                return (
                  <div key={order.id} className="bg-white rounded-2xl shadow border flex items-center">
                    <label
                      onClick={(e) => e.stopPropagation()}
                      className="pl-4 flex-shrink-0 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(order.id)}
                        onChange={() => toggleSelect(order.id)}
                        className="w-5 h-5"
                      />
                    </label>
                    <button
                      onClick={() => openOrderDetail(order)}
                      className="flex-1 p-4 flex items-center justify-between text-left min-w-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {order.receipt_image && (
                          <img src={order.receipt_image} alt="chek" className="w-10 h-10 object-cover rounded-lg border flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-black truncate">№{order.id} · {order.customer_name}</p>
                          <p className="text-xs text-gray-500 truncate">{order.phone} · {formatSeoulTime(order.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="font-bold text-green-700">{order.total?.toLocaleString()}₩</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusClass}`}>
                          {order.status || "⏳ Kutilmoqda"}
                        </span>
                        <span className="text-gray-400">›</span>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {detailOrder && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex justify-end"
          onClick={() => setDetailOrder(null)}
        >
          <div
            className="bg-white w-full max-w-md h-full overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10"
              style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)" }}
            >
              <h2 className="font-bold text-lg text-black truncate pr-2">№{detailOrder.id} · {detailOrder.customer_name}</h2>
              <button onClick={() => setDetailOrder(null)} className="text-gray-400 text-2xl leading-none px-2 flex-shrink-0">✕</button>
            </div>

            <div className="p-4">
              <p className="text-xs text-gray-400 mb-1">🕓 {formatSeoulDate(detailOrder.created_at)}, {formatSeoulTime(detailOrder.created_at)}</p>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-green-700 text-lg">{detailOrder.total?.toLocaleString()}₩</span>
                <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColors[detailOrder.status] || "status-pending"}`}>
                  {detailOrder.status || "⏳ Kutilmoqda"}
                </span>
              </div>
              <p className="text-black">📍 {detailOrder.address}</p>
              <p className="text-black">📞 {detailOrder.phone}</p>
              {detailOrder.note && <p className="mt-1 text-gray-700">📝 {detailOrder.note}</p>}

              <div className="mt-3 p-3 bg-gray-100 rounded-xl">
                <p className="font-semibold text-black mb-2">🛒 Mahsulotlar:</p>
                {detailLoading ? (
                  <p className="text-sm text-gray-400">Yuklanmoqda...</p>
                ) : detailItems.length > 0 ? (
                  <div className="space-y-2">
                    {detailItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 border-b border-gray-200 pb-2 last:border-b-0 last:pb-0">
                        <ProductImage image={item.image} alt={item.product_name || ""} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" compact />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-black truncate">{item.product_name}</p>
                          <p className="text-xs text-gray-500">{item.quantity} x {item.price.toLocaleString()}₩</p>
                        </div>
                        <span className="text-sm font-bold text-black flex-shrink-0">
                          {(item.quantity * item.price).toLocaleString()}₩
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <pre className="whitespace-pre-wrap text-sm text-black">{detailOrder.order_text}</pre>
                )}
              </div>

              {detailOrder.receipt_image && (
                <div className="mt-3">
                  <p className="font-semibold text-black mb-2">📷 To'lov cheki (kattalashtirish uchun bosing)</p>
                  <img
                    src={detailOrder.receipt_image}
                    alt="receipt"
                    onClick={() => setZoomedImage(detailOrder.receipt_image)}
                    className="max-w-[160px] rounded-xl border cursor-pointer"
                  />
                </div>
              )}

              {!detailLoading && detailReview && (
                <div className="mt-3 p-3 rounded-xl" style={{ backgroundColor: "#fefce8", border: "1px solid #fef08a" }}>
                  <p className="font-semibold mb-1" style={{ color: "#000000" }}>
                    ⭐ Mijoz bahosi: {"⭐".repeat(detailReview.rating)}
                  </p>
                  {detailReview.comment && (
                    <p className="text-sm whitespace-pre-line" style={{ color: "#374151" }}>💬 {detailReview.comment}</p>
                  )}

                  {detailReview.reply ? (
                    <div className="mt-2 pt-2" style={{ borderTop: "1px solid #fde68a" }}>
                      <p className="text-xs font-bold" style={{ color: "#166534" }}>🏪 Bizning javobimiz:</p>
                      <p className="text-sm whitespace-pre-line" style={{ color: "#166534" }}>{detailReview.reply}</p>
                    </div>
                  ) : (
                    <div className="mt-2 pt-2" style={{ borderTop: "1px solid #fde68a" }}>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Mijozga javob yozing..."
                        className="w-full border rounded-lg p-2 text-sm mb-2"
                        style={{ color: "#000000", backgroundColor: "#ffffff" }}
                        rows={2}
                      />
                      <button
                        onClick={() => sendReview(detailOrder.id, detailOrder.user_id)}
                        disabled={sendingReply || !replyText.trim()}
                        className="bg-green-600 disabled:opacity-60 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                      >
                        {sendingReply ? "..." : "Javobni yuborish"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {detailOrder.status !== "📦 Jo'natildi" && detailOrder.status !== "❌ Bekor qilindi" && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={async () => {
                      await supabase.from("orders").update({ status: "✅ To'landi" }).eq("id", detailOrder.id);
                      await fetch("/api/order/paid", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ orderNumber: detailOrder.id, status: "paid", userId: detailOrder.user_id }),
                      });
                      await refreshDetailOrder(detailOrder.id);
                      loadOrders();
                    }}
                    className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm"
                  >
                    ✅ To'landi
                  </button>
                  <button
                    onClick={async () => {
                      await supabase.from("orders").update({ status: "📦 Jo'natildi" }).eq("id", detailOrder.id);
                      await fetch("/api/order/paid", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ orderNumber: detailOrder.id, status: "shipped", userId: detailOrder.user_id }),
                      });
                      await refreshDetailOrder(detailOrder.id);
                      loadOrders();
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm"
                  >
                    📦 Jo'natildi
                  </button>
                  <button
                    onClick={async () => {
                      await supabase.from("orders").update({ status: "❌ Bekor qilindi" }).eq("id", detailOrder.id);
                      await fetch("/api/order/paid", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ orderNumber: detailOrder.id, status: "cancelled", userId: detailOrder.user_id }),
                      });
                      await refreshDetailOrder(detailOrder.id);
                      loadOrders();
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm"
                  >
                    ❌ Bekor qilindi
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {zoomedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setZoomedImage(null)}
        >
          <img src={zoomedImage} alt="chek katta" className="max-w-full max-h-full rounded-xl" />
        </div>
      )}
    </main>
  );
}
