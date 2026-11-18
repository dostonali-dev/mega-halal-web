"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { fetchAllRows } from "@/lib/fetchAllRows";
import BarcodeScannerModal from "@/components/BarcodeScannerModal";

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  image?: string | null;
  description?: string | null;
  stock?: number | null;
  in_stock?: boolean | null;
  supplier?: string | null;
  discount_price?: number | null;
  is_hot?: boolean | null;
  hidden?: boolean | null;
  product_code?: string | null;
  keywords?: string | null;
  expiry_date?: string | null;
  created_at?: string | null;
};

type BulkAction = "" | "move" | "delete" | "in_stock" | "out_of_stock" | "hide" | "show" | "discount" | "remove_discount";

type SortBy = "" | "price_asc" | "price_desc" | "sales_desc" | "newest" | "expiry_asc";

type Category = { id: number; name: string; icon: string | null };

const OPEN_GROUP_KEY = "admin_products_open_group";
const SCROLL_Y_KEY = "admin_products_scroll_y";
const DAY_MS = 86400000;

export default function AdminProductsPage() {
  const router = useRouter();
  const [checkedLogin, setCheckedLogin] = useState(false);

  const [products, setProducts] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [adminSearch, setAdminSearch] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem(OPEN_GROUP_KEY) || null;
  });

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkAction, setBulkAction] = useState<BulkAction>("");
  const [bulkTargetCategory, setBulkTargetCategory] = useState("");
  const [bulkDiscountPercent, setBulkDiscountPercent] = useState("");
  const [bulkBusy, setBulkBusy] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [loadError, setLoadError] = useState("");

  // Tez-tez ishlatiladigan chiplar (qidiruv tagidagi gorizontal qator).
  const [activeChips, setActiveChips] = useState<Set<string>>(new Set());

  // "⚙️" tugmasi bilan ochiladigan qo'shimcha filtrlar (bottom sheet).
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterStockMin, setFilterStockMin] = useState("");
  const [filterStockMax, setFilterStockMax] = useState("");
  const [filterZeroStock, setFilterZeroStock] = useState(false);
  const [filterNotSelling, setFilterNotSelling] = useState(false);
  const [filterNoImage, setFilterNoImage] = useState(false);
  const [filterNoDescription, setFilterNoDescription] = useState(false);
  const [filterNoBarcode, setFilterNoBarcode] = useState(false);
  const [filterHiddenOnly, setFilterHiddenOnly] = useState(false);
  const [filterNewOnly, setFilterNewOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortBy>("");

  // Sotuv statistikasi ("eng ko'p sotilgan" va "30 kunda sotilmagan"
  // filtrlari uchun) - order_items jadvalidan bir marta yuklab olinadi.
  const [salesCounts, setSalesCounts] = useState<Record<number, number>>({});
  const [lastSaleAt, setLastSaleAt] = useState<Record<number, number>>({});

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("adminLoggedIn");
    if (isLoggedIn !== "true") router.push("/admin");
    else setCheckedLogin(true);
  }, [router]);

  // Qaysi kategoriya ochiq turgani sessiya davomida saqlanadi - tahrirlashga
  // kirib qaytganda kategoriya yopilib, boshiga qaytib ketmasligi uchun.
  useEffect(() => {
    if (openGroup) sessionStorage.setItem(OPEN_GROUP_KEY, openGroup);
    else sessionStorage.removeItem(OPEN_GROUP_KEY);
  }, [openGroup]);

  const loadProducts = async () => {
    // Supabase bir so'rovda standart holatda faqat 1000 tagacha qator
    // qaytaradi — fetchAllRows barchasini sahifalab (1000 tadan) yuklaydi,
    // shunda katalog 1000 tadan katta bo'lsa ham hech biri tushib qolmaydi.
    try {
      const data = await fetchAllRows<Product>("products", "id", false);
      setLoadError("");
      setProducts(data);
      setTotalCount(data.length);
    } catch (e: any) {
      console.error(e);
      setLoadError(e?.message || String(e));
    }
  };
  const loadCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*").order("name");
    if (!error) setCategoriesList(data || []);
  };

  // "Eng ko'p sotilgan" va "30 kunda sotilmagan" filtrlari uchun har bir
  // mahsulotning jami sotilgan soni va oxirgi sotilgan sanasini hisoblaymiz.
  const loadSalesData = async () => {
    try {
      const rows = await fetchAllRows<any>("order_items", "id", false);
      const counts: Record<number, number> = {};
      const last: Record<number, number> = {};
      for (const r of rows) {
        if (r.product_id == null) continue;
        counts[r.product_id] = (counts[r.product_id] || 0) + (r.quantity || 0);
        const t = r.created_at ? new Date(r.created_at).getTime() : 0;
        if (t && (!last[r.product_id] || t > last[r.product_id])) last[r.product_id] = t;
      }
      setSalesCounts(counts);
      setLastSaleAt(last);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (checkedLogin) {
      loadProducts();
      loadCategories();
      loadSalesData();
    }
  }, [checkedLogin]);

  // Mahsulotlar yuklanib, ochiq kategoriya kengaygandan keyin, tahrirlashga
  // ketishdan oldingi skroll pozitsiyasini tiklaymiz.
  useEffect(() => {
    if (!checkedLogin || products.length === 0) return;
    const savedY = sessionStorage.getItem(SCROLL_Y_KEY);
    if (savedY) {
      sessionStorage.removeItem(SCROLL_Y_KEY);
      requestAnimationFrame(() => {
        window.scrollTo({ top: Number(savedY), behavior: "auto" });
      });
    }
  }, [checkedLogin, products]);

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Bu mahsulotni o'chirmoqchimisiz?")) return;
    await supabase.from("products").delete().eq("id", id);
    loadProducts();
  };

  const toggleInStock = async (p: Product) => {
    const newValue = p.in_stock === false ? true : false;
    const { error } = await supabase.from("products").update({ in_stock: newValue }).eq("id", p.id);
    if (error) { alert("Xatolik: " + error.message); return; }
    loadProducts();
  };

  const toggleHot = async (p: Product) => {
    const newValue = !p.is_hot;
    const { error } = await supabase.from("products").update({ is_hot: newValue }).eq("id", p.id);
    if (error) { alert("Xatolik: " + error.message); return; }
    loadProducts();
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectGroup = (groupProducts: Product[]) => {
    const ids = groupProducts.map((p) => p.id);
    const allSelected = ids.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        ids.forEach((id) => next.delete(id));
      } else {
        ids.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
    setBulkAction("");
    setBulkTargetCategory("");
    setBulkDiscountPercent("");
  };

  const applyBulkAction = async () => {
    if (selectedIds.size === 0) { alert("Avval kamida bitta mahsulotni belgilang."); return; }
    if (!bulkAction) { alert("Amal turini tanlang."); return; }
    const ids = Array.from(selectedIds);

    if (bulkAction === "move") {
      if (!bulkTargetCategory) { alert("Qaysi kategoriyaga o'tkazishni tanlang."); return; }
      if (!confirm(`${ids.length} ta mahsulotni "${bulkTargetCategory}" kategoriyasiga o'tkazmoqchimisiz?`)) return;
      setBulkBusy(true);
      const { error } = await supabase.from("products").update({ category: bulkTargetCategory }).in("id", ids);
      setBulkBusy(false);
      if (error) { alert("Xatolik: " + error.message); return; }
    } else if (bulkAction === "delete") {
      if (!confirm(`${ids.length} ta mahsulotni butunlay o'chirmoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi!`)) return;
      setBulkBusy(true);
      const { error } = await supabase.from("products").delete().in("id", ids);
      setBulkBusy(false);
      if (error) { alert("Xatolik: " + error.message); return; }
    } else if (bulkAction === "in_stock" || bulkAction === "out_of_stock") {
      setBulkBusy(true);
      const { error } = await supabase.from("products").update({ in_stock: bulkAction === "in_stock" }).in("id", ids);
      setBulkBusy(false);
      if (error) { alert("Xatolik: " + error.message); return; }
    } else if (bulkAction === "hide" || bulkAction === "show") {
      setBulkBusy(true);
      const { error } = await supabase.from("products").update({ hidden: bulkAction === "hide" }).in("id", ids);
      setBulkBusy(false);
      if (error) {
        alert(
          "Xatolik: " + error.message +
          "\n\nEslatma: bazangizda \"hidden\" ustuni bo'lmasa, avval Supabase SQL Editor'da quyidagini ishga tushiring:\nALTER TABLE products ADD COLUMN IF NOT EXISTS hidden boolean DEFAULT false;"
        );
        return;
      }
    } else if (bulkAction === "discount") {
      const percent = Number(bulkDiscountPercent);
      if (!percent || percent <= 0 || percent >= 100) { alert("Chegirma foizini to'g'ri kiriting (masalan 30)."); return; }
      if (!confirm(`${ids.length} ta mahsulotga ${percent}% chegirma qo'ymoqchimisiz?`)) return;
      setBulkBusy(true);
      const targets = products.filter((p) => ids.includes(p.id));
      for (const p of targets) {
        const newDiscount = Math.max(0, Math.round(p.price * (1 - percent / 100)));
        await supabase.from("products").update({ discount_price: newDiscount }).eq("id", p.id);
      }
      setBulkBusy(false);
    } else if (bulkAction === "remove_discount") {
      setBulkBusy(true);
      const { error } = await supabase.from("products").update({ discount_price: null }).in("id", ids);
      setBulkBusy(false);
      if (error) { alert("Xatolik: " + error.message); return; }
    }

    clearSelection();
    await loadProducts();
  };

  // Eng ko'p sotilgan top-30 mahsulot (sotuv soni bo'yicha) - "⭐ Top" chip
  // shu ro'yxatga kiruvchilarnigina ko'rsatadi.
  const topSellingIds = new Set(
    Object.entries(salesCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30)
      .map(([id]) => Number(id))
  );

  const supplierOptions = [...new Set(
    products.map((p) => (p.supplier || "").trim()).filter((s) => s !== "")
  )].sort();

  const toggleChip = (key: string) => {
    setActiveChips((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const now = Date.now();

  const matchesFilters = (p: Product) => {
    // Tez chiplar - bir nechtasi yoqilsa, hammasi bajarilishi kerak (AND).
    if (activeChips.has("hot") && !p.is_hot) return false;
    if (activeChips.has("discount") && !(p.discount_price != null && p.discount_price > 0 && p.discount_price < p.price)) return false;
    if (activeChips.has("expiry")) {
      if (!p.expiry_date) return false;
      const days = Math.ceil((new Date(p.expiry_date).getTime() - now) / DAY_MS);
      if (days > 30) return false;
    }
    if (activeChips.has("lowstock")) {
      if (p.stock == null || p.stock <= 0 || p.stock > 10) return false;
    }
    if (activeChips.has("topselling") && !topSellingIds.has(p.id)) return false;

    // Qo'shimcha filtrlar (⚙️ oynasi).
    if (filterSupplier && (p.supplier || "").trim() !== filterSupplier) return false;
    if (filterStockMin !== "" && (p.stock ?? 0) < Number(filterStockMin)) return false;
    if (filterStockMax !== "" && (p.stock ?? 0) > Number(filterStockMax)) return false;
    if (filterZeroStock && p.stock !== 0) return false;
    if (filterNotSelling) {
      const createdAt = p.created_at ? new Date(p.created_at).getTime() : 0;
      const createdRecently = createdAt > 0 && now - createdAt < 30 * DAY_MS;
      if (createdRecently) return false; // yangi mahsulotga adolatsiz bo'lmasin
      const last = lastSaleAt[p.id];
      if (last && now - last < 30 * DAY_MS) return false;
    }
    if (filterNoImage && p.image) return false;
    if (filterNoDescription && p.description && p.description.trim() !== "") return false;
    if (filterNoBarcode && p.product_code && p.product_code.trim() !== "") return false;
    if (filterHiddenOnly && p.hidden !== true) return false;
    if (filterNewOnly) {
      const createdAt = p.created_at ? new Date(p.created_at).getTime() : 0;
      if (!createdAt || now - createdAt > 7 * DAY_MS) return false;
    }
    return true;
  };

  const hasActiveFilters =
    activeChips.size > 0 ||
    filterSupplier !== "" ||
    filterStockMin !== "" ||
    filterStockMax !== "" ||
    filterZeroStock ||
    filterNotSelling ||
    filterNoImage ||
    filterNoDescription ||
    filterNoBarcode ||
    filterHiddenOnly ||
    filterNewOnly;

  const searchedProducts = products.filter((p) => {
    const q = adminSearch.toLowerCase();
    const textOk = !q ||
      p.name.toLowerCase().includes(q) ||
      (p.product_code || "").toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q) ||
      (p.keywords || "").toLowerCase().includes(q);
    return textOk && matchesFilters(p);
  });

  let filteredProducts = searchedProducts;
  if (sortBy) {
    filteredProducts = [...filteredProducts].sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      if (sortBy === "sales_desc") return (salesCounts[b.id] || 0) - (salesCounts[a.id] || 0);
      if (sortBy === "newest") {
        const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
        const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
        return tb - ta;
      }
      if (sortBy === "expiry_asc") {
        const ea = a.expiry_date ? new Date(a.expiry_date).getTime() : Infinity;
        const eb = b.expiry_date ? new Date(b.expiry_date).getTime() : Infinity;
        return ea - eb;
      }
      return 0;
    });
  }

  const showFlatList = adminSearch.trim() !== "" || hasActiveFilters || sortBy !== "";

  const clearAdvancedFilters = () => {
    setFilterSupplier("");
    setFilterStockMin("");
    setFilterStockMax("");
    setFilterZeroStock(false);
    setFilterNotSelling(false);
    setFilterNoImage(false);
    setFilterNoDescription(false);
    setFilterNoBarcode(false);
    setFilterHiddenOnly(false);
    setFilterNewOnly(false);
    setSortBy("");
  };

  const clearAllFilters = () => {
    setAdminSearch("");
    setActiveChips(new Set());
    clearAdvancedFilters();
  };

  const knownCategoryNames = categoriesList.map((c) => c.name);
  const orphanCategories = [...new Set(products.map((p) => p.category))].filter(
    (name) => !knownCategoryNames.includes(name)
  );
  const productGroups = [...knownCategoryNames, ...orphanCategories];

  const QUICK_CHIPS: { key: string; label: string }[] = [
    { key: "hot", label: "🔥 Hot" },
    { key: "discount", label: "% Chegirma" },
    { key: "expiry", label: "⏰ Muddati oz qolgan" },
    { key: "lowstock", label: "📦 Kam qoldiq" },
    { key: "topselling", label: "⭐ Eng ko'p sotilgan" },
  ];

  const ADVANCED_TOGGLES: { key: string; label: string; value: boolean; set: (v: boolean) => void }[] = [
    { key: "zeroStock", label: "🚫 Qoldiq tugagan (0)", value: filterZeroStock, set: setFilterZeroStock },
    { key: "notSelling", label: "💤 30 kunda sotilmagan", value: filterNotSelling, set: setFilterNotSelling },
    { key: "noImage", label: "🖼️ Rasmsiz", value: filterNoImage, set: setFilterNoImage },
    { key: "noDescription", label: "📝 Tavsifsiz", value: filterNoDescription, set: setFilterNoDescription },
    { key: "noBarcode", label: "🔖 Shtrix-kodsiz", value: filterNoBarcode, set: setFilterNoBarcode },
    { key: "hiddenOnly", label: "🙈 Yashirin/nofaol", value: filterHiddenOnly, set: setFilterHiddenOnly },
    { key: "newOnly", label: "🆕 Yangi qo'shilgan (7 kun)", value: filterNewOnly, set: setFilterNewOnly },
  ];

  if (!checkedLogin) return null;

  return (
    <main className="p-6 md:p-10">
      <div className="flex items-center justify-between">
        <Link href="/admin" aria-label="Menyu" className="inline-flex items-center justify-center w-11 h-11 rounded-full flex-shrink-0" style={{ backgroundColor: "#dcfce7" }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <Link href="/admin/products/import" className="text-blue-600 text-sm font-bold underline">📥 Excel import</Link>
      </div>
      <h1 className="text-3xl font-bold mt-3 mb-1">Mahsulotlar</h1>
      {totalCount !== null && (
        <p className="text-xs text-gray-400 mb-4">
          Yuklandi: {products.length} / bazada jami: {totalCount}
        </p>
      )}
      {loadError && (
        <div className="rounded-xl p-3 text-sm font-bold mb-4" style={{ backgroundColor: "#fee2e2", color: "#991b1b" }}>
          Yuklashda xatolik: {loadError}
        </div>
      )}

      <div className="max-w-2xl">
        <div className="relative mb-2">
          <input
            type="text"
            placeholder="🔎 Mahsulot nomi yoki kodi bo'yicha qidirish..."
            value={adminSearch}
            onChange={(e) => setAdminSearch(e.target.value)}
            className="w-full border p-3 pr-24 rounded-xl bg-white text-black"
          />
          <div className="absolute top-1/2 right-2 -translate-y-1/2 flex gap-1.5">
            <button
              onClick={() => setShowFilterSheet(true)}
              aria-label="Qo'shimcha filtrlar"
              className={`relative w-10 h-10 rounded-lg flex items-center justify-center text-lg ${hasActiveFilters ? "bg-blue-600 text-white" : ""}`}
              style={!hasActiveFilters ? { backgroundColor: "#2a2a2a", color: "#ffffff" } : undefined}
            >
              ⚙️
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                  •
                </span>
              )}
            </button>
            <button
              onClick={() => setShowScanner(true)}
              aria-label="Barkodni kamera bilan skanerlash"
              className="w-10 h-10 rounded-lg bg-green-600 text-white flex items-center justify-center text-lg"
            >
              📷
            </button>
          </div>
        </div>

        {/* Tez-tez ishlatiladigan chiplar - bitta bosishda yoqiladi/o'chadi. */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-3 -mx-1 px-1">
          {QUICK_CHIPS.map((chip) => (
            <button
              key={chip.key}
              onClick={() => toggleChip(chip.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-colors ${
                activeChips.has(chip.key)
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white text-gray-600 border-gray-300"
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {showFlatList && (
          <div className="flex items-center justify-between mb-3 px-1">
            <p className="text-xs font-bold text-gray-500">Topildi: {filteredProducts.length}</p>
            <button onClick={clearAllFilters} className="text-xs font-bold text-red-500">✕ Tozalash</button>
          </div>
        )}

        {showScanner && (
          <BarcodeScannerModal
            onScan={(code) => {
              setAdminSearch(code);
              setShowScanner(false);
            }}
            onClose={() => setShowScanner(false)}
          />
        )}

        {showFilterSheet && (
          <div
            className="fixed inset-0 z-50 flex items-end justify-center"
            style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
            onClick={() => setShowFilterSheet(false)}
          >
            <div
              className="bg-white w-full max-w-2xl rounded-t-2xl p-5 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-black">Qo'shimcha filtrlar</h2>
                <button onClick={() => setShowFilterSheet(false)} className="text-gray-400 text-2xl leading-none">✕</button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 px-1">🏭 Firma</label>
                  <select
                    value={filterSupplier}
                    onChange={(e) => setFilterSupplier(e.target.value)}
                    className="w-full border p-3 rounded-xl bg-white text-black mt-1"
                  >
                    <option value="">Barchasi</option>
                    {supplierOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 px-1">📦 Qoldiq oralig'i</label>
                  <div className="flex gap-2 mt-1">
                    <input
                      type="number"
                      placeholder="Min"
                      value={filterStockMin}
                      onChange={(e) => setFilterStockMin(e.target.value)}
                      className="w-full border p-3 rounded-xl bg-white text-black"
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={filterStockMax}
                      onChange={(e) => setFilterStockMax(e.target.value)}
                      className="w-full border p-3 rounded-xl bg-white text-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 px-1">↕️ Saralash</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    className="w-full border p-3 rounded-xl bg-white text-black mt-1"
                  >
                    <option value="">Standart</option>
                    <option value="price_asc">Narx: arzondan qimmatga</option>
                    <option value="price_desc">Narx: qimmatdan arzonga</option>
                    <option value="sales_desc">Eng ko'p sotilgan</option>
                    <option value="newest">Yangi qo'shilgan</option>
                    <option value="expiry_asc">Muddati yaqin</option>
                  </select>
                </div>

                <div className="space-y-2 pt-2 border-t">
                  {ADVANCED_TOGGLES.map((item) => (
                    <label key={item.key} className="flex items-center gap-2 p-2.5 rounded-xl bg-gray-50">
                      <input
                        type="checkbox"
                        checked={item.value}
                        onChange={(e) => item.set(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <span className="text-sm font-semibold text-black">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  onClick={clearAdvancedFilters}
                  className="flex-1 font-bold py-3 rounded-xl"
                  style={{ backgroundColor: "#2a2a2a", color: "#ffffff" }}
                >
                  Tozalash
                </button>
                <button onClick={() => setShowFilterSheet(false)} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl">
                  Qo'llash ({filteredProducts.length})
                </button>
              </div>
            </div>
          </div>
        )}

        <div
          className={`bg-gray-50 border rounded-xl p-4 mb-4 space-y-3 ${selectedIds.size > 0 ? "sticky z-30 shadow-lg" : ""}`}
          style={selectedIds.size > 0 ? { top: "calc(env(safe-area-inset-top, 0px) + 8px)" } : undefined}
        >
          <p className="text-sm font-bold text-black">
            📋 Ommaviy amal {selectedIds.size > 0 ? `— ${selectedIds.size} ta mahsulot belgilangan` : "(pastdan mahsulot(lar)ni belgilang)"}
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value as BulkAction)}
              className="flex-1 border p-2.5 rounded-xl bg-white text-black text-sm"
            >
              <option value="">Amal turini tanlang...</option>
              <option value="move">📂 Boshqa kategoriyaga o'tkazish</option>
              <option value="in_stock">✅ Sotuvda bor qilish</option>
              <option value="out_of_stock">🚫 Sotuvda yo'q qilish</option>
              <option value="hide">🙈 Berkitish (mijozlarga ko'rinmasin)</option>
              <option value="show">👁️ Ochish (mijozlarga ko'rinsin)</option>
              <option value="discount">💸 Chegirma qo'yish (%)</option>
              <option value="remove_discount">♻️ Chegirmani olib tashlash</option>
              <option value="delete">🗑️ O'chirish</option>
            </select>
            {bulkAction === "move" && (
              <select
                value={bulkTargetCategory}
                onChange={(e) => setBulkTargetCategory(e.target.value)}
                className="flex-1 border p-2.5 rounded-xl bg-white text-black text-sm"
              >
                <option value="">Qaysi kategoriyaga?</option>
                {categoriesList.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            )}
            {bulkAction === "discount" && (
              <input
                type="number"
                placeholder="Chegirma foizi (masalan 30)"
                value={bulkDiscountPercent}
                onChange={(e) => setBulkDiscountPercent(e.target.value)}
                className="flex-1 border p-2.5 rounded-xl bg-white text-black text-sm"
              />
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={applyBulkAction}
              disabled={bulkBusy || selectedIds.size === 0 || !bulkAction}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-40 text-white text-sm font-bold py-2.5 rounded-xl"
            >
              {bulkBusy ? "Bajarilmoqda..." : "✅ Bajarish"}
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={clearSelection}
                className="px-4 text-sm font-bold rounded-xl"
                style={{ backgroundColor: "#2a2a2a", color: "#ffffff" }}
              >
                Bekor qilish
              </button>
            )}
          </div>
        </div>

        {showFlatList ? (
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 px-1">
              <input
                type="checkbox"
                checked={filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.has(p.id))}
                onChange={() => toggleSelectGroup(filteredProducts)}
              />
              Filtr natijalarining barchasini belgilash
            </label>
            {filteredProducts.map((p) => (
              <ProductRow key={p.id} p={p} selected={selectedIds.has(p.id)} onToggleSelect={toggleSelect} onDelete={handleDeleteProduct} onToggleStock={toggleInStock} onToggleHot={toggleHot} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {productGroups.map((groupName) => {
              const groupProducts = products.filter((p) => p.category === groupName);
              return (
                <div key={groupName} className="bg-white border rounded-xl overflow-hidden">
                  <div className="w-full p-4 flex justify-between items-center gap-2">
                    <button onClick={() => setOpenGroup(openGroup === groupName ? null : groupName)} className="flex-1 flex justify-between items-center text-left min-w-0">
                      <span className="font-bold text-black truncate">{groupName}</span>
                      <span className="text-green-700 text-xl ml-2 flex-shrink-0">{openGroup === groupName ? "−" : "+"}</span>
                    </button>
                    <label
                      className="flex items-center gap-1.5 flex-shrink-0 py-2 pl-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        className="w-5 h-5"
                        checked={groupProducts.length > 0 && groupProducts.every((p) => selectedIds.has(p.id))}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelectGroup(groupProducts);
                        }}
                      />
                      <span className="text-[11px] font-bold text-gray-500 whitespace-nowrap">barchasi</span>
                    </label>
                  </div>
                  {openGroup === groupName && (
                    <div className="px-4 pb-4 space-y-3 border-t pt-3">
                      {groupProducts.map((p) => (
                        <ProductRow key={p.id} p={p} selected={selectedIds.has(p.id)} onToggleSelect={toggleSelect} onDelete={handleDeleteProduct} onToggleStock={toggleInStock} onToggleHot={toggleHot} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function ProductRow({ p, selected, onToggleSelect, onDelete, onToggleStock, onToggleHot }: {
  p: Product;
  selected: boolean;
  onToggleSelect: (id: number) => void;
  onDelete: (id: number) => void;
  onToggleStock: (p: Product) => void;
  onToggleHot: (p: Product) => void;
}) {
  return (
    <div className={`border rounded-xl p-3 flex items-center gap-3 ${selected ? "ring-2 ring-green-500 bg-green-50" : ""}`}>
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelect(p.id)}
        className="flex-shrink-0 w-4 h-4"
      />
      {p.image ? (
        <img src={p.image} alt={p.name} className="w-14 h-14 object-cover rounded-lg border flex-shrink-0" />
      ) : (
        <div className="w-14 h-14 rounded-lg border bg-gray-100 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">Rasm yo'q</div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-black">
          {p.name} {p.hidden ? <span className="text-xs font-bold text-gray-400">🙈 berkitilgan</span> : null}
        </p>
        <p className="text-sm text-gray-500">
          {p.price.toLocaleString()}₩ · Soni: {p.stock ?? 0}{p.supplier ? ` · 🏭 ${p.supplier}` : ""}{p.product_code ? ` · 🔖 ${p.product_code}` : ""}
        </p>
        {p.expiry_date && (() => {
          const daysLeft = Math.ceil((new Date(p.expiry_date).getTime() - Date.now()) / 86400000);
          // Muddat yaqinlashgan sari rang va matn tobora "jiddiylashib" boradi:
          // 30 kun -> sariq, 15 kun -> to'q sariq, 7 kun -> qizil-sariq (har
          // kuni hisoblanadi), 0 dan kichik -> muddati o'tgan (qizil).
          let color = "#9ca3af";
          let suffix = "";
          if (daysLeft < 0) {
            color = "#dc2626";
            suffix = " — muddati o'tgan!";
          } else if (daysLeft <= 7) {
            color = "#ef4444";
            suffix = ` — ${daysLeft === 0 ? "bugun tugaydi" : `${daysLeft} kunda tugaydi`}`;
          } else if (daysLeft <= 15) {
            color = "#f97316";
            suffix = ` — ${daysLeft} kun qoldi`;
          } else if (daysLeft <= 30) {
            color = "#eab308";
            suffix = ` — ${daysLeft} kun qoldi`;
          }
          return (
            <p className="text-xs font-bold mt-0.5" style={{ color }}>
              ⏳ Muddati: {p.expiry_date}{suffix}
            </p>
          );
        })()}
      </div>
      <div className="flex flex-col items-end gap-2">
        <button onClick={() => onToggleStock(p)} className={`text-xs font-bold px-3 py-1 rounded-full ${p.in_stock === false ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
          {p.in_stock === false ? "Sotuvda yo'q" : "Sotuvda bor"}
        </button>
        <button
          onClick={() => onToggleHot(p)}
          className={`text-xs font-bold px-3 py-1 rounded-full ${p.is_hot ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"}`}
        >
          {p.is_hot ? "🔥 HOT" : "HOT belgilash"}
        </button>
        <div className="flex gap-2">
          <Link
            href={`/admin/products/${p.id}`}
            onClick={() => sessionStorage.setItem(SCROLL_Y_KEY, String(window.scrollY))}
            className="text-blue-600 text-xs font-bold underline"
          >
            Tahrirlash
          </Link>
          <button onClick={() => onDelete(p.id)} className="text-red-500 text-xs font-bold underline">O'chirish</button>
        </div>
      </div>
    </div>
  );
}
