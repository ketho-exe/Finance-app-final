"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  cards as sampleCards,
  pots as samplePots,
  transactions as sampleTransactions,
  wishlist as sampleWishlist,
  type MoneyCard,
  type Pot,
  type Transaction,
  type WishlistItem,
} from "@/lib/finance";
import { removeById, upsertById } from "@/lib/finance-store-actions";

export type SalarySettings = {
  gross: number;
  pension: number;
  studentLoan: "none" | "plan1" | "plan2" | "plan5";
};

type FinanceState = {
  cards: MoneyCard[];
  transactions: Transaction[];
  pots: Pot[];
  wishlist: WishlistItem[];
  salary: SalarySettings;
  saveCard: (card: MoneyCard) => void;
  deleteCard: (id: string) => void;
  saveTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  savePot: (pot: Pot) => void;
  deletePot: (id: string) => void;
  saveWishlistItem: (item: WishlistItem) => void;
  deleteWishlistItem: (id: string) => void;
  setSalary: (settings: SalarySettings) => void;
};

const defaultSalary: SalarySettings = {
  gross: 52000,
  pension: 5,
  studentLoan: "plan2",
};

const FinanceContext = createContext<FinanceState | null>(null);

function readStored<T>(key: string, fallback: T) {
  if (typeof window === "undefined") return fallback;

  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function useStoredState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readStored(key, fallback));

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [cards, setCards] = useStoredState("ledgerly.cards", sampleCards);
  const [transactions, setTransactions] = useStoredState("ledgerly.transactions", sampleTransactions);
  const [pots, setPots] = useStoredState("ledgerly.pots", samplePots);
  const [wishlist, setWishlist] = useStoredState("ledgerly.wishlist", sampleWishlist);
  const [salary, setSalary] = useStoredState("ledgerly.salary", defaultSalary);

  const value = useMemo<FinanceState>(
    () => ({
      cards,
      transactions,
      pots,
      wishlist,
      salary,
      saveCard: (card) => setCards((items) => upsertById(items, card)),
      deleteCard: (id) => setCards((items) => removeById(items, id)),
      saveTransaction: (transaction) => setTransactions((items) => upsertById(items, transaction)),
      deleteTransaction: (id) => setTransactions((items) => removeById(items, id)),
      savePot: (pot) => setPots((items) => upsertById(items, pot)),
      deletePot: (id) => setPots((items) => removeById(items, id)),
      saveWishlistItem: (item) => setWishlist((items) => upsertById(items, item)),
      deleteWishlistItem: (id) => setWishlist((items) => removeById(items, id)),
      setSalary,
    }),
    [cards, transactions, pots, wishlist, salary, setCards, setTransactions, setPots, setWishlist, setSalary],
  );

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>;
}

export function useFinance() {
  const context = useContext(FinanceContext);

  if (!context) {
    throw new Error("useFinance must be used inside FinanceProvider");
  }

  return context;
}

export function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
