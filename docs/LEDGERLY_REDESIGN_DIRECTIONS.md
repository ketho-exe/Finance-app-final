# Ledgerly Redesign Directions

## Recommended Direction: Calm Bento Finance + Subtle Liquid Ledger

This is the best fit for Ledgerly now. Use Calm Bento Finance for the information architecture and add Liquid Ledger surfaces only where depth helps: navigation, header, command palette, onboarding, overlays, and top-level summary cards.

## Option A: Liquid Ledger

Premium, mobile-first, Apple-inspired polish. Use translucent nav/header layers, soft borders, layered shadows, and floating quick actions. Keep forms and transaction tables solid for readability.

## Option B: Calm Bento Finance

Desktop-strong dashboard with bento sections for safe-to-spend, net worth, sync status, cash flow, upcoming bills, accounts, transactions, pots, and budget pressure. Large numbers, small labels, restrained color, and predictable spacing.

## Option C: Neobank Command Centre

Bolder dark-first direction with high-contrast cards, concise alerts, card-like account panels, and a prominent command menu. Better if Ledgerly should feel closer to Monzo/Revolut/Linear.

## Option D: iOS Sheet App

Mobile PWA emphasis with a sticky bottom tab bar, floating create action, full-height sheets for create/edit flows, pill filters, and iOS Wallet-like account detail screens. Keep desktop sidebar.

## Option E: WealthOS Editorial

Premium planning feel with report-like pages, editorial typography, more whitespace, and narrative forecasts such as monthly projected ending balance.

## Implementation Guardrails

- Preserve existing routes and data behavior.
- Keep Supabase auth, `FinanceProvider`, and `AppShell`.
- Use Tailwind only unless the project already adopts a UI library.
- Keep contrast accessible in light and dark mode.
- Do not make transaction tables transparent.
- Add skeleton/empty states for Open Banking connection and sync status.
