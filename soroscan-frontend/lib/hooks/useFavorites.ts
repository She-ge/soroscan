"use client";

import * as React from "react";

const FAVORITES_KEY = "soroscan-contract-favorites";

export function useFavorites() {
  const [favorites, setFavorites] = React.useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(FAVORITES_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    }
    return new Set();
  });

  const toggleFavorite = React.useCallback((contractId: string) => {
    setFavorites((prev) => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(contractId)) {
        newFavorites.delete(contractId);
      } else {
        newFavorites.add(contractId);
      }
      localStorage.setItem(FAVORITES_KEY, JSON.stringify([...newFavorites]));
      return newFavorites;
    });
  }, []);

  const isFavorite = React.useCallback(
    (contractId: string) => favorites.has(contractId),
    [favorites]
  );

  return { favorites, toggleFavorite, isFavorite };
}
