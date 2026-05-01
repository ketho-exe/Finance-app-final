"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  BellRing,
  CircleDollarSign,
  CreditCard,
  FileBarChart,
  Gift,
  Home,
  Menu,
  Plus,
  PiggyBank,
  ReceiptText,
  PanelLeftClose,
  PanelLeftOpen,
  Users,
  User,
  Settings,
  Search,
  Upload,
  WalletCards,
} from "lucide-react";
import { GlideOverlay } from "@/components/glide-overlay";
import { ThemeToggle } from "@/components/theme-toggle";
import { useFinance } from "@/lib/finance-store";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/salary", label: "Salary", icon: CircleDollarSign },
  { href: "/cards", label: "Accounts", icon: CreditCard },
  { href: "/transactions", label: "Transactions", icon: WalletCards },
  { href: "/pots", label: "Pots", icon: PiggyBank },
  { href: "/wishlist", label: "Wishlist", icon: Gift },
  { href: "/statistics", label: "Statistics", icon: BarChart3 },
  { href: "/subscriptions", label: "Subscriptions", icon: BellRing },
  { href: "/budgets", label: "Budgets", icon: ReceiptText },
  { href: "/upload", label: "CSV Upload", icon: Upload },
  { href: "/household", label: "Household", icon: Users },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/profile", label: "Account", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { error } = useFinance();
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [query, setQuery] = useState("");
  const commands = useMemo(() => navItems.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())), [query]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className={cn("fixed inset-y-0 left-0 z-30 hidden border-r border-border bg-panel/92 px-4 py-5 backdrop-blur transition-[width] xl:flex xl:flex-col", sidebarCollapsed ? "w-20" : "w-72")}>
        <div className={cn("flex items-center", sidebarCollapsed ? "justify-center" : "justify-between gap-3")}>
          <Link href="/" className={cn("flex min-w-0 items-center gap-3", sidebarCollapsed && "justify-center")}>
            <Image src="/ledgerly-logo.png" alt="Ledgerly logo" width={44} height={44} className="size-11 rounded-lg object-contain" priority />
            {!sidebarCollapsed ? (
              <span className="min-w-0">
                <span className="block text-lg font-black">Ledgerly</span>
                <span className="text-sm text-muted">Personal finance, clearly</span>
              </span>
            ) : null}
          </Link>
          {!sidebarCollapsed ? (
            <button type="button" onClick={() => setSidebarCollapsed(true)} className="grid size-9 place-items-center rounded-md border border-border text-muted hover:bg-soft hover:text-foreground" title="Hide sidebar">
              <PanelLeftClose className="size-4" />
            </button>
          ) : null}
        </div>
        {sidebarCollapsed ? (
          <button type="button" onClick={() => setSidebarCollapsed(false)} className="mt-4 grid size-10 place-items-center rounded-md border border-border text-muted hover:bg-soft hover:text-foreground" title="Show sidebar">
            <PanelLeftOpen className="size-4" />
          </button>
        ) : null}
        <nav className="mt-8 flex flex-1 flex-col gap-1">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-bold text-muted transition",
                  sidebarCollapsed && "justify-center px-0",
                  "hover:bg-soft hover:text-foreground",
                  active && "bg-foreground text-background hover:bg-foreground hover:text-background",
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className="size-4 shrink-0" />
                {!sidebarCollapsed ? item.label : null}
              </Link>
            );
          })}
        </nav>
        {!sidebarCollapsed ? <div className="rounded-md border border-border bg-soft p-3 text-sm text-muted">
          <p className="font-bold text-foreground">Private workspace</p>
          <p className="mt-1">Your accounts, budgets, goals, and reports stay tied to your profile.</p>
        </div> : null}
      </aside>

      <div className={cn("transition-[padding] xl:pl-72", sidebarCollapsed && "xl:pl-20")}>
        <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <button type="button" onClick={() => setSidebarCollapsed((current) => !current)} className="hidden size-10 place-items-center rounded-md border border-border text-muted hover:bg-soft hover:text-foreground xl:grid" title={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}>
              <Menu className="size-5" />
            </button>
            <Link href="/" className="flex items-center gap-2 xl:hidden">
              <Image src="/ledgerly-logo.png" alt="Ledgerly logo" width={36} height={36} className="size-9 rounded-md object-contain" priority />
              <span className="font-black">Ledgerly</span>
            </Link>
            <nav className="hidden flex-1 items-center gap-1 overflow-x-auto lg:flex xl:hidden">
              {navItems.slice(0, 7).map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "whitespace-nowrap rounded-md px-3 py-2 text-sm font-bold text-muted hover:bg-soft hover:text-foreground",
                    pathname === item.href && "bg-soft text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-2">
              <button type="button" onClick={() => setCommandOpen(true)} className="hidden h-10 items-center gap-2 rounded-md border border-border px-3 text-sm font-bold text-muted sm:flex">
                <Search className="size-4" />
                Search
              </button>
              <ThemeToggle />
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 lg:hidden">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-md px-3 py-2 text-sm font-bold text-muted",
                  pathname === item.href && "bg-foreground text-background",
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          {error ? <div className="mb-4 rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm font-bold text-danger">{error}</div> : null}
          {children}
        </main>
      </div>
      <button type="button" onClick={() => setQuickAddOpen(true)} className="fixed bottom-5 right-5 z-30 grid size-14 place-items-center rounded-full bg-foreground text-background shadow-lg xl:hidden" title="Quick add">
        <Plus className="size-6" />
      </button>
      <GlideOverlay open={quickAddOpen} title="Quick add" onClose={() => setQuickAddOpen(false)}>
        <div className="grid gap-3">
          {[
            ["Transaction", "/transactions"],
            ["Account", "/cards"],
            ["Pot", "/pots"],
            ["Subscription", "/subscriptions"],
            ["Wishlist item", "/wishlist"],
          ].map(([label, href]) => (
            <Link key={href} href={href} onClick={() => setQuickAddOpen(false)} className="flex items-center justify-between rounded-md bg-soft px-4 py-3 font-black">
              {label}
              <ArrowUpRight className="size-4" />
            </Link>
          ))}
        </div>
      </GlideOverlay>
      <GlideOverlay open={commandOpen} title="Command menu" onClose={() => setCommandOpen(false)}>
        <div className="space-y-4">
          <input autoFocus placeholder="Search pages or actions" value={query} onChange={(event) => setQuery(event.target.value)} className="focus-ring w-full rounded-md border border-border bg-background px-3 py-3 font-bold" />
          <div className="grid gap-2">
            {commands.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} onClick={() => setCommandOpen(false)} className="flex items-center gap-3 rounded-md bg-soft px-4 py-3 font-black">
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </GlideOverlay>
    </div>
  );
}
