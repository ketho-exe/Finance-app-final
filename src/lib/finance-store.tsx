"use client";

import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  type MoneyCard,
  type Pot,
  type Transaction,
  type WishlistItem,
} from "@/lib/finance";
import { removeById, upsertById } from "@/lib/finance-store-actions";
import {
  cardFromRow,
  cardToRow,
  potFromRow,
  potToRow,
  salaryFromRow,
  salaryToRow,
  transactionFromRow,
  transactionToRow,
  wishlistFromRow,
  wishlistToRow,
} from "@/lib/supabase-finance";
import { createClient } from "@/lib/supabase-client";

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
  session: Session | null;
  usingSupabase: boolean;
  loading: boolean;
  error: string;
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
const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState<SupabaseClient | null>(() => (supabaseConfigured ? createClient() : null));
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cards, setCards] = useState<MoneyCard[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pots, setPots] = useState<Pot[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [salary, setSalary] = useState<SalarySettings>(defaultSalary);
  const userId = session?.user.id;
  const usingSupabase = Boolean(supabase && userId);

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setCards([]);
        setTransactions([]);
        setPots([]);
        setWishlist([]);
        setSalary(defaultSalary);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!supabase || !session?.user.id) return;

    let active = true;
    async function loadFinanceData() {
      if (!supabase || !session?.user.id) return;

      setLoading(true);
      setError("");

      const [cardResult, transactionResult, potResult, wishlistResult, salaryResult] = await Promise.all([
        supabase.from("cards").select("*").order("created_at", { ascending: false }),
        supabase.from("transactions").select("*").order("transaction_date", { ascending: false }),
        supabase.from("pots").select("*").order("created_at", { ascending: false }),
        supabase.from("wishlist_items").select("*").order("created_at", { ascending: false }),
        supabase.from("salary_settings").select("*").eq("user_id", session.user.id).maybeSingle(),
      ]);

      if (!active) return;

      const firstError = cardResult.error ?? transactionResult.error ?? potResult.error ?? wishlistResult.error ?? salaryResult.error;
      if (firstError) {
        setError(firstError.message);
        setLoading(false);
        return;
      }

      setCards((cardResult.data ?? []).map((row) => cardFromRow(row)));
      setTransactions((transactionResult.data ?? []).map((row) => transactionFromRow(row)));
      setPots((potResult.data ?? []).map((row) => potFromRow(row)));
      setWishlist((wishlistResult.data ?? []).map((row) => wishlistFromRow(row)));
      if (salaryResult.data) setSalary(salaryFromRow(salaryResult.data));
      setLoading(false);
    }

    loadFinanceData();

    return () => {
      active = false;
    };
  }, [session?.user.id, setCards, setPots, setSalary, setTransactions, setWishlist, supabase]);

  const persistCard = useCallback(async (card: MoneyCard) => {
    if (!supabase || !userId) return;
    const { data, error: saveError } = await supabase.from("cards").upsert(cardToRow(card, userId)).select().single();
    if (saveError) setError(saveError.message);
    if (data) setCards((items) => upsertById(items, cardFromRow(data)));
  }, [setCards, supabase, userId]);

  const persistTransaction = useCallback(async (transaction: Transaction) => {
    if (!supabase || !userId) return;
    const { data, error: saveError } = await supabase.from("transactions").upsert(transactionToRow(transaction, userId)).select().single();
    if (saveError) setError(saveError.message);
    if (data) setTransactions((items) => upsertById(items, transactionFromRow(data)));
  }, [setTransactions, supabase, userId]);

  const persistPot = useCallback(async (pot: Pot) => {
    if (!supabase || !userId) return;
    const { data, error: saveError } = await supabase.from("pots").upsert(potToRow(pot, userId)).select().single();
    if (saveError) setError(saveError.message);
    if (data) setPots((items) => upsertById(items, potFromRow(data)));
  }, [setPots, supabase, userId]);

  const persistWishlistItem = useCallback(async (item: WishlistItem) => {
    if (!supabase || !userId) return;
    const { data, error: saveError } = await supabase.from("wishlist_items").upsert(wishlistToRow(item, userId)).select().single();
    if (saveError) setError(saveError.message);
    if (data) setWishlist((items) => upsertById(items, wishlistFromRow(data)));
  }, [setWishlist, supabase, userId]);

  const persistSalary = useCallback(async (settings: SalarySettings) => {
    if (!supabase || !userId) return;
    const { error: saveError } = await supabase.from("salary_settings").upsert(salaryToRow(settings, userId));
    if (saveError) setError(saveError.message);
  }, [supabase, userId]);

  const value = useMemo<FinanceState>(
    () => ({
      cards,
      transactions,
      pots,
      wishlist,
      salary,
      session,
      usingSupabase,
      loading,
      error,
      saveCard: (card) => {
        setCards((items) => upsertById(items, card));
        void persistCard(card);
      },
      deleteCard: (id) => {
        setCards((items) => removeById(items, id));
        if (supabase && userId) void supabase.from("cards").delete().eq("id", id).eq("user_id", userId);
      },
      saveTransaction: (transaction) => {
        setTransactions((items) => upsertById(items, transaction));
        void persistTransaction(transaction);
      },
      deleteTransaction: (id) => {
        setTransactions((items) => removeById(items, id));
        if (supabase && userId) void supabase.from("transactions").delete().eq("id", id).eq("user_id", userId);
      },
      savePot: (pot) => {
        setPots((items) => upsertById(items, pot));
        void persistPot(pot);
      },
      deletePot: (id) => {
        setPots((items) => removeById(items, id));
        if (supabase && userId) void supabase.from("pots").delete().eq("id", id).eq("user_id", userId);
      },
      saveWishlistItem: (item) => {
        setWishlist((items) => upsertById(items, item));
        void persistWishlistItem(item);
      },
      deleteWishlistItem: (id) => {
        setWishlist((items) => removeById(items, id));
        if (supabase && userId) void supabase.from("wishlist_items").delete().eq("id", id).eq("user_id", userId);
      },
      setSalary: (settings) => {
        setSalary(settings);
        void persistSalary(settings);
      },
    }),
    [cards, transactions, pots, wishlist, salary, session, usingSupabase, loading, error, setCards, setTransactions, setPots, setWishlist, supabase, userId, setSalary, persistCard, persistPot, persistSalary, persistTransaction, persistWishlistItem],
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
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
