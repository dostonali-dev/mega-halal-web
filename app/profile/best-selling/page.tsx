"use client";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/lib/CartContext";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/lib/LanguageContext";
import PageHeader from "@/components/PageHeader";
import ProductRow from "@/components/ProductRow";
import { fetchProductSalesCounts, fetchUserPurchaseHistory, buildGlobalBestSellers } from "@/lib/salesStats";

export default function BestSellingPage() {
  const { products } = useCart();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [myTopIds, setMyTopIds] = useState<number[]>([]);
  const [globalSalesCounts, setGlobalSalesCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (user) {
        const history = await fetchUserPurchaseHistory(user.id);
        setMyTopIds(history.mostPurchasedIds);
      }
      const counts = await fetchProductSalesCounts();
      setGlobalSalesCounts(counts);
      setLoading(false);
    })();
  }, [user]);

  const myTopProducts = useMemo(
    () => myTopIds.map((id) => products.find((p) => p.id === id)).filter((p): p is NonNullable<typeof p> => Boolean(p)),
    [myTopIds, products]
  );

  const globalBestSellers = useMemo(
    () => buildGlobalBestSellers(products, globalSalesCounts, 12),
    [products, globalSalesCounts]
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-green-50 to-white pb-10">
      <PageHeader title={`🛒 ${t("profile_menu_best_selling")}`} />
      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {loading && <p className="text-gray-400 text-sm">{t("orders_loading")}</p>}
        {!loading && myTopProducts.length > 0 && (
          <ProductRow title={t("cart_most_purchased_title")} products={myTopProducts} />
        )}
        {!loading && globalBestSellers.length > 0 && (
          <ProductRow title={t("best_selling_title")} products={globalBestSellers} />
        )}
        {!loading && myTopProducts.length === 0 && globalBestSellers.length === 0 && (
          <p className="text-gray-400 text-center mt-10">{t("orders_empty")}</p>
        )}
      </div>
    </main>
  );
}
