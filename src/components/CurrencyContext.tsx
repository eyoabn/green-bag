"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type Currency = "ETB" | "USD";

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  formatPrice: (priceInETB: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("ETB");
  const EXCHANGE_RATE = 120; // 1 USD = 120 ETB

  // Persist currency selection
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("arenguade_currency");
      if (stored === "ETB" || stored === "USD") {
        setCurrencyState(stored);
      }
    }
  }, []);

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    if (typeof window !== "undefined") {
      localStorage.setItem("arenguade_currency", newCurrency);
    }
  };

  const formatPrice = (priceInETB: number) => {
    if (currency === "USD") {
      const priceInUSD = priceInETB / EXCHANGE_RATE;
      return `$${priceInUSD.toFixed(2)}`;
    }
    return `${priceInETB.toLocaleString()} ETB`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
