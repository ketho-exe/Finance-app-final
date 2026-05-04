import {
  BarChart3,
  BellRing,
  BookOpen,
  CircleDollarSign,
  CreditCard,
  FileBarChart,
  Gift,
  Home,
  Landmark,
  PiggyBank,
  ReceiptText,
  Scale,
  Settings,
  Table2,
  Upload,
  User,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  group: "core" | "workspace" | "tools" | "admin";
};

export const primaryNavItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: Home, group: "core" },
  { href: "/planning", label: "Plan", icon: BookOpen, group: "core" },
  { href: "/cards", label: "Accounts", icon: CreditCard, group: "core" },
  { href: "/transactions", label: "Transactions", icon: WalletCards, group: "core" },
  { href: "/budgets", label: "Budgets", icon: ReceiptText, group: "core" },
  { href: "/upload", label: "Import", icon: Upload, group: "tools" },
  { href: "/reports", label: "Reports", icon: FileBarChart, group: "tools" },
  { href: "/settings", label: "Settings", icon: Settings, group: "admin" },
];

export const secondaryNavItems: NavItem[] = [
  { href: "/salary", label: "Salary", icon: CircleDollarSign, group: "workspace" },
  { href: "/ledger", label: "Ledger", icon: Table2, group: "workspace" },
  { href: "/statistics", label: "Statistics", icon: BarChart3, group: "workspace" },
  { href: "/subscriptions", label: "Subscriptions", icon: BellRing, group: "workspace" },
  { href: "/pots", label: "Pots", icon: PiggyBank, group: "workspace" },
  { href: "/wishlist", label: "Wishlist", icon: Gift, group: "workspace" },
  { href: "/reconciliation", label: "Reconciliation", icon: Scale, group: "workspace" },
  { href: "/statements", label: "Statements", icon: FileBarChart, group: "workspace" },
  { href: "/loans", label: "Loans", icon: Landmark, group: "workspace" },
  { href: "/net-worth", label: "Net Worth", icon: CircleDollarSign, group: "workspace" },
  { href: "/household", label: "Household", icon: Users, group: "workspace" },
  { href: "/profile", label: "Account", icon: User, group: "admin" },
];

export const commandNavItems = [...primaryNavItems, ...secondaryNavItems];
