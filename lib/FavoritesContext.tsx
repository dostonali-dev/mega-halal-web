"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

type FavoritesContextType = {
  favoriteIds: Set<number>;
  toggleFavorite: (productId: number) => void;
  loading: boolean;
};

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  const loadFavorites = async (userId: string) => {
    const { data, error } = await supabase.from("favorites").select("product_id").eq("user_id", userId);
    if (!error && data) {
      setFavoriteIds(new Set(data.map((f) => f.product_id)));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      loadFavorites(user.id);
    } else {
      setFavoriteIds(new Set());
      setLoading(false);
    }
  }, [user]);

  const toggleFavorite = async (productId: number) => {
    if (!user) return;

    const isFavorite = favoriteIds.has(productId);
    const next = new Set(favoriteIds);
    if (isFavorite) {
      next.delete(productId);
    } else {
      next.add(productId);
    }
    setFavoriteIds(next);

    if (isFavorite) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", productId);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, product_id: productId });
    }
  };

  return (
    <FavoritesContext.Provider value={{ favoriteIds, toggleFavorite, loading }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider");
  return ctx;
}