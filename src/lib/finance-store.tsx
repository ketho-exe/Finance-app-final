"use client";

import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  type PensionTiming,
  type MoneyCard,
  type Pot,
  type Transaction,
  type WishlistItem,
} from "@/lib/finance";
import { type Budget, type Subscription } from "@/lib/finance-insights";
import { deriveCardBalances, hydrateLocalSnapshot, removeById, toLocalSnapshot, upsertById } from "@/lib/finance-store-actions";
import {
  cardFromRow,
  cardToRow,
  customCategoryFromRow,
  customCategoryToRow,
  csvTemplateFromRow,
  csvTemplateToRow,
  potFromRow,
  potToRow,
  reportExportFromRow,
  reportExportToRow,
  salaryFromRow,
  salaryToRow,
  budgetFromRow,
  budgetToRow,
  subscriptionFromRow,
  subscriptionToRow,
  transactionFromRow,
  transactionToRow,
  wishlistFromRow,
  wishlistToRow,
} from "@/lib/supabase-finance";
import { createClient } from "@/lib/supabase-client";

export type SalarySettings = {
  gross: number;
  pension: number;
  pensionTiming: PensionTiming;
  studentLoan: "none" | "plan1" | "plan2" | "plan5";
  paydayDay: number;
  incomeCardId?: string;
};

export type CustomCategory = {
  id: string;
  name: string;
  colour: string;
};

export type CsvTemplate = {
  id: string;
  bankName: string;
  columns: string[];
  mapping: Record<string, string>;
};

export type ReportExport = {
  id: string;
  reportMonth: string;
  format: string;
  createdAt: string;
  summary: Record<string, unknown>;
};

type FinanceState = {
  cards: MoneyCard[];
  transactions: Transaction[];
  pots: Pot[];
  wishlist: WishlistItem[];
  salary: SalarySettings;
  budgets: Budget[];
  subscriptions: Subscription[];
  customCategories: CustomCategory[];
  categoryOptions: string[];
  csvTemplates: CsvTemplate[];
  reportExports: ReportExport[];
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
  saveBudget: (budget: Budget) => void;
  deleteBudget: (id: string) => void;
  saveSubscription: (subscription: Subscription) => void;
  deleteSubscription: (id: string) => void;
  saveCustomCategory: (category: CustomCategory) => void;
  deleteCustomCategory: (id: string) => void;
  saveCsvTemplate: (template: CsvTemplate) => void;
  saveReportExport: (report: ReportExport) => void;
};

const defaultSalary: SalarySettings = {
  gross: 52000,
  pension: 5,
  pensionTiming: "before-tax",
  studentLoan: "plan2",
  paydayDay: 25,
  incomeCardId: undefined,
};

const FinanceContext = createContext<FinanceState | null>(null);
const supabaseConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const localStorageKey = "ledgerly.finance.v1";

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState<SupabaseClient | null>(() => (supabaseConfigured ? createClient() : null));
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [localReady, setLocalReady] = useState(supabaseConfigured);
  const [cards, setCards] = useState<MoneyCard[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [pots, setPots] = useState<Pot[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [salary, setSalary] = useState<SalarySettings>(defaultSalary);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [csvTemplates, setCsvTemplates] = useState<CsvTemplate[]>([]);
  const [reportExports, setReportExports] = useState<ReportExport[]>([]);
  const userId = session?.user.id;
  const usingSupabase = Boolean(supabase && userId);
  const balancedCards = useMemo(() => deriveCardBalances(cards, transactions), [cards, transactions]);

  useEffect(() => {
    if (supabaseConfigured || typeof window === "undefined") return;

    queueMicrotask(() => {
      const snapshot = hydrateLocalSnapshot(window.localStorage.getItem(localStorageKey));
      if (snapshot) {
        setCards(snapshot.cards);
        setTransactions(snapshot.transactions);
        setPots(snapshot.pots);
        setWishlist(snapshot.wishlist);
        setSalary(snapshot.salary);
        setBudgets(snapshot.budgets);
        setSubscriptions(snapshot.subscriptions);
        setCustomCategories(snapshot.customCategories);
        setCsvTemplates(snapshot.csvTemplates);
        setReportExports(snapshot.reportExports);
      }
      setLocalReady(true);
    });
  }, []);

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
        setBudgets([]);
        setSubscriptions([]);
        setCustomCategories([]);
        setCsvTemplates([]);
        setReportExports([]);
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

      const [cardResult, transactionResult, potResult, wishlistResult, salaryResult, budgetResult, subscriptionResult, categoryResult, csvTemplateResult, reportResult] = await Promise.all([
        supabase.from("cards").select("*").order("created_at", { ascending: false }),
        supabase.from("transactions").select("*").order("transaction_date", { ascending: false }),
        supabase.from("pots").select("*").order("created_at", { ascending: false }),
        supabase.from("wishlist_items").select("*").order("created_at", { ascending: false }),
        supabase.from("salary_settings").select("*").eq("user_id", session.user.id).maybeSingle(),
        supabase.from("budgets").select("*").order("created_at", { ascending: false }),
        supabase.from("subscriptions").select("*").eq("active", true).order("created_at", { ascending: false }),
        supabase.from("categories").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }),
        supabase.from("csv_templates").select("*").order("created_at", { ascending: false }),
        supabase.from("report_exports").select("*").order("created_at", { ascending: false }),
      ]);

      if (!active) return;

      const firstError = cardResult.error ?? transactionResult.error ?? potResult.error ?? wishlistResult.error ?? salaryResult.error ?? budgetResult.error ?? subscriptionResult.error ?? categoryResult.error ?? csvTemplateResult.error ?? reportResult.error;
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
      setBudgets((budgetResult.data ?? []).map((row) => budgetFromRow(row)));
      setSubscriptions((subscriptionResult.data ?? []).map((row) => subscriptionFromRow(row)));
      setCustomCategories((categoryResult.data ?? []).map((row) => customCategoryFromRow(row)));
      setCsvTemplates((csvTemplateResult.data ?? []).map((row) => csvTemplateFromRow(row)));
      setReportExports((reportResult.data ?? []).map((row) => reportExportFromRow(row)));
      setLoading(false);
    }

    loadFinanceData();

    return () => {
      active = false;
    };
  }, [session?.user.id, setBudgets, setCards, setPots, setSalary, setSubscriptions, setTransactions, setWishlist, supabase]);

  const persistCard = useCallback(async (card: MoneyCard) => {
    if (!supabase || !userId) return;
    const { data, error: saveError } = await supabase.from("cards").upsert(cardToRow(card, userId)).select().single();
    if (saveError) setError(saveError.message);
    if (data) {
      setError("");
      setCards((items) => upsertById(items, cardFromRow(data)));
    }
  }, [setCards, supabase, userId]);

  const persistTransaction = useCallback(async (transaction: Transaction) => {
    if (!supabase || !userId) return;
    const { data, error: saveError } = await supabase.from("transactions").upsert(transactionToRow(transaction, userId)).select().single();
    if (saveError) setError(saveError.message);
    if (data) {
      setError("");
      setTransactions((items) => upsertById(items, transactionFromRow(data)));
    }
  }, [setTransactions, supabase, userId]);

  const persistPot = useCallback(async (pot: Pot) => {
    if (!supabase || !userId) return;
    const { data, error: saveError } = await supabase.from("pots").upsert(potToRow(pot, userId)).select().single();
    if (saveError) setError(saveError.message);
    if (data) {
      setError("");
      setPots((items) => upsertById(items, potFromRow(data)));
    }
  }, [setPots, supabase, userId]);

  const persistWishlistItem = useCallback(async (item: WishlistItem) => {
    if (!supabase || !userId) return;
    const { data, error: saveError } = await supabase.from("wishlist_items").upsert(wishlistToRow(item, userId)).select().single();
    if (saveError) setError(saveError.message);
    if (data) {
      setError("");
      setWishlist((items) => upsertById(items, wishlistFromRow(data)));
    }
  }, [setWishlist, supabase, userId]);

  const persistSalary = useCallback(async (settings: SalarySettings) => {
    if (!supabase || !userId) return;
    const { error: saveError } = await supabase.from("salary_settings").upsert(salaryToRow(settings, userId));
    if (!saveError) {
      setError("");
      return;
    }

    if (saveError.code === "PGRST204") {
      const { error: retryError } = await supabase.from("salary_settings").upsert(salaryToRow(settings, userId, { includeExtendedColumns: false }));
      setError(retryError ? retryError.message : "");
      return;
    }

    setError(saveError.message);
  }, [supabase, userId]);

  const persistBudget = useCallback(async (budget: Budget) => {
    if (!supabase || !userId) return;
    const { data, error: saveError } = await supabase.from("budgets").upsert(budgetToRow(budget, userId)).select().single();
    if (saveError) setError(saveError.message);
    if (data) {
      setError("");
      setBudgets((items) => upsertById(items, budgetFromRow(data)));
    }
  }, [setBudgets, supabase, userId]);

  const persistSubscription = useCallback(async (subscription: Subscription) => {
    if (!supabase || !userId) return;
    const { data, error: saveError } = await supabase.from("subscriptions").upsert(subscriptionToRow(subscription, userId)).select().single();
    if (saveError) setError(saveError.message);
    if (data) {
      setError("");
      setSubscriptions((items) => upsertById(items, subscriptionFromRow(data)));
    }
  }, [setSubscriptions, supabase, userId]);

  const persistCustomCategory = useCallback(async (category: CustomCategory) => {
    if (!supabase || !userId) return;
    const { data, error: saveError } = await supabase.from("categories").upsert(customCategoryToRow(category, userId)).select().single();
    if (saveError) setError(saveError.message);
    if (data) setCustomCategories((items) => upsertById(items, customCategoryFromRow(data)));
  }, [setCustomCategories, supabase, userId]);

  const persistCsvTemplate = useCallback(async (template: CsvTemplate) => {
    if (!supabase || !userId) return;
    const { data, error: saveError } = await supabase.from("csv_templates").upsert(csvTemplateToRow(template, userId)).select().single();
    if (saveError) setError(saveError.message);
    if (data) setCsvTemplates((items) => upsertById(items, csvTemplateFromRow(data)));
  }, [setCsvTemplates, supabase, userId]);

  const persistReportExport = useCallback(async (report: ReportExport) => {
    if (!supabase || !userId) return;
    const { data, error: saveError } = await supabase.from("report_exports").insert(reportExportToRow(report, userId)).select().single();
    if (saveError) setError(saveError.message);
    if (data) setReportExports((items) => upsertById(items, reportExportFromRow(data)));
  }, [setReportExports, supabase, userId]);

  const categoryOptions = useMemo(() => {
    const defaults = ["Income", "Rent", "Bills", "Groceries", "Eating out", "Transport", "Shopping", "Travel", "Health", "Entertainment", "Savings", "Transfer"];
    return Array.from(new Set([...defaults, ...customCategories.map((category) => category.name)])).sort((a, b) => a.localeCompare(b));
  }, [customCategories]);

  const persistLocal = useCallback((overrides: Partial<Parameters<typeof toLocalSnapshot>[0]>) => {
    if (supabaseConfigured || !localReady || typeof window === "undefined") return;
    window.localStorage.setItem(
      localStorageKey,
      JSON.stringify(toLocalSnapshot({
        cards,
        transactions,
        pots,
        wishlist,
        salary,
        budgets,
        subscriptions,
        customCategories,
        csvTemplates,
        reportExports,
        ...overrides,
      })),
    );
  }, [budgets, cards, csvTemplates, customCategories, localReady, pots, reportExports, salary, subscriptions, transactions, wishlist]);

  const deleteFromSupabase = useCallback(async (table: string, id: string) => {
    if (!supabase || !userId) return true;
    const { error: deleteError } = await supabase.from(table).delete().eq("id", id).eq("user_id", userId);
    if (deleteError) {
      setError(deleteError.message);
      return false;
    }
    setError("");
    return true;
  }, [supabase, userId]);

  const value = useMemo<FinanceState>(
    () => ({
      cards: balancedCards,
      transactions,
      pots,
      wishlist,
      salary,
      budgets,
      subscriptions,
      customCategories,
      categoryOptions,
      csvTemplates,
      reportExports,
      session,
      usingSupabase,
      loading,
      error,
      saveCard: (card) => {
        const nextCards = upsertById(cards, card);
        setCards(nextCards);
        persistLocal({ cards: nextCards });
        void persistCard(card);
      },
      deleteCard: async (id) => {
        if (await deleteFromSupabase("cards", id)) {
          const nextCards = removeById(cards, id);
          const nextTransactions = transactions.filter((transaction) => transaction.cardId !== id);
          setCards(nextCards);
          setTransactions(nextTransactions);
          persistLocal({ cards: nextCards, transactions: nextTransactions });
        }
      },
      saveTransaction: (transaction) => {
        const nextTransactions = upsertById(transactions, transaction);
        setTransactions(nextTransactions);
        persistLocal({ transactions: nextTransactions });
        void persistTransaction(transaction);
      },
      deleteTransaction: async (id) => {
        if (await deleteFromSupabase("transactions", id)) {
          const nextTransactions = removeById(transactions, id);
          setTransactions(nextTransactions);
          persistLocal({ transactions: nextTransactions });
        }
      },
      savePot: (pot) => {
        const nextPots = upsertById(pots, pot);
        setPots(nextPots);
        persistLocal({ pots: nextPots });
        void persistPot(pot);
      },
      deletePot: async (id) => {
        if (await deleteFromSupabase("pots", id)) {
          const nextPots = removeById(pots, id);
          setPots(nextPots);
          persistLocal({ pots: nextPots });
        }
      },
      saveWishlistItem: (item) => {
        const nextWishlist = upsertById(wishlist, item);
        setWishlist(nextWishlist);
        persistLocal({ wishlist: nextWishlist });
        void persistWishlistItem(item);
      },
      deleteWishlistItem: async (id) => {
        if (await deleteFromSupabase("wishlist_items", id)) {
          const nextWishlist = removeById(wishlist, id);
          setWishlist(nextWishlist);
          persistLocal({ wishlist: nextWishlist });
        }
      },
      setSalary: (settings) => {
        setSalary(settings);
        persistLocal({ salary: settings });
        void persistSalary(settings);
      },
      saveBudget: (budget) => {
        const nextBudgets = upsertById(budgets, budget);
        setBudgets(nextBudgets);
        persistLocal({ budgets: nextBudgets });
        void persistBudget(budget);
      },
      deleteBudget: async (id) => {
        if (await deleteFromSupabase("budgets", id)) {
          const nextBudgets = removeById(budgets, id);
          setBudgets(nextBudgets);
          persistLocal({ budgets: nextBudgets });
        }
      },
      saveSubscription: (subscription) => {
        const nextSubscriptions = upsertById(subscriptions, subscription);
        setSubscriptions(nextSubscriptions);
        persistLocal({ subscriptions: nextSubscriptions });
        void persistSubscription(subscription);
      },
      deleteSubscription: async (id) => {
        if (await deleteFromSupabase("subscriptions", id)) {
          const nextSubscriptions = removeById(subscriptions, id);
          setSubscriptions(nextSubscriptions);
          persistLocal({ subscriptions: nextSubscriptions });
        }
      },
      saveCustomCategory: (category) => {
        const nextCustomCategories = upsertById(customCategories, category);
        setCustomCategories(nextCustomCategories);
        persistLocal({ customCategories: nextCustomCategories });
        void persistCustomCategory(category);
      },
      deleteCustomCategory: async (id) => {
        if (await deleteFromSupabase("categories", id)) {
          const nextCustomCategories = removeById(customCategories, id);
          setCustomCategories(nextCustomCategories);
          persistLocal({ customCategories: nextCustomCategories });
        }
      },
      saveCsvTemplate: (template) => {
        const nextCsvTemplates = upsertById(csvTemplates, template);
        setCsvTemplates(nextCsvTemplates);
        persistLocal({ csvTemplates: nextCsvTemplates });
        void persistCsvTemplate(template);
      },
      saveReportExport: (report) => {
        const nextReportExports = upsertById(reportExports, report);
        setReportExports(nextReportExports);
        persistLocal({ reportExports: nextReportExports });
        void persistReportExport(report);
      },
    }),
    [balancedCards, transactions, pots, wishlist, salary, budgets, subscriptions, customCategories, categoryOptions, csvTemplates, reportExports, session, usingSupabase, loading, error, cards, persistLocal, persistCard, persistPot, persistSalary, persistTransaction, persistWishlistItem, persistBudget, persistSubscription, persistCustomCategory, persistCsvTemplate, persistReportExport, deleteFromSupabase],
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
