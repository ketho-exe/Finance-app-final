"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  BarChart3,
  BellRing,
  Bot,
  CircleDollarSign,
  CreditCard,
  FileBarChart,
  FileSpreadsheet,
  Gift,
  Home,
  PiggyBank,
  ReceiptText,
  ShieldCheck,
  Users,
  User,
  Settings,
  Upload,
  WalletCards,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/salary", label: "Salary", icon: CircleDollarSign },
  { href: "/cards", label: "Cards", icon: CreditCard },
  { href: "/transactions", label: "Transactions", icon: WalletCards },
  { href: "/pots", label: "Pots", icon: PiggyBank },
  { href: "/wishlist", label: "Wishlist", icon: Gift },
  { href: "/statistics", label: "Statistics", icon: BarChart3 },
  { href: "/subscriptions", label: "Subscriptions", icon: BellRing },
  { href: "/budgets", label: "Budgets", icon: ReceiptText },
  { href: "/safe-spend", label: "Safe Spend", icon: ShieldCheck },
  { href: "/upload", label: "CSV Upload", icon: Upload },
  { href: "/csv-templates", label: "CSV Templates", icon: FileSpreadsheet },
  { href: "/categorisation", label: "Categorisation", icon: Bot },
  { href: "/household", label: "Household", icon: Users },
  { href: "/debt", label: "Debt Planner", icon: CreditCard },
  { href: "/reports", label: "Reports", icon: FileBarChart },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-border bg-panel/92 px-4 py-5 backdrop-blur xl:flex xl:flex-col">
        <Link href="/" className="flex items-center gap-3 px-2">
          <span className="grid size-11 place-items-center rounded-lg bg-foreground text-background">
            <ArrowUpRight className="size-5" />
          </span>
          <span>
            <span className="block text-lg font-black">Ledgerly</span>
            <span className="text-sm text-muted">UK money control</span>
          </span>
        </Link>
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
                  "hover:bg-soft hover:text-foreground",
                  active && "bg-foreground text-background hover:bg-foreground hover:text-background",
                )}
              >
                <Icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="rounded-md border border-border bg-soft p-3 text-sm text-muted">
          <p className="font-bold text-foreground">Supabase ready</p>
          <p className="mt-1">Connect env vars, run the schema, and swap sample data for user-owned rows.</p>
        </div>
      </aside>

      <div className="xl:pl-72">
        <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
          <div className="flex min-h-16 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2 xl:hidden">
              <span className="grid size-9 place-items-center rounded-md bg-foreground text-background">
                <ArrowUpRight className="size-4" />
              </span>
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
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
