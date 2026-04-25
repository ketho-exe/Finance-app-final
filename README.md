# Ledgerly

A modern UK-focused financial tracking app built with Next.js, Tailwind CSS, Supabase-ready clients, and Vercel deployment defaults.

## Features

- UK salary input with automatic take-home calculations.
- Separate pages for dashboard, salary, cards, transactions, pots, wishlist, statistics, CSV upload, and settings.
- Card accounts with individual transactions, credit limits, overdrafts, and utilisation.
- Pots for savings and mixed financial goals.
- Wishlist tracking with priority and funding progress.
- Transaction categories, top-spend statistics, cash-flow graph, and predictions.
- CSV transaction preview using Papa Parse.
- Add, edit, and delete controls for cards, transactions, pots, and wishlist items.
- Autosaved salary settings in the browser.
- CSV mapping dropdowns for category and card before importing rows.
- Supabase magic-link auth and profile page.
- Light/dark/system theme support with contrast-safe colours.
- Self-hosted Satoshi font from `public/fonts`.
- Supabase browser/server clients and starter schema in `supabase/schema.sql`.

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Supabase Setup

1. Create a Supabase project.
2. Copy `.env.example` to `.env.local`.
3. Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Run `supabase/schema.sql` in the Supabase SQL editor.
5. Add your deployed URL and `http://localhost:3000/profile` to Supabase Auth redirect URLs.
6. Replace the local store in `src/lib/finance-store.tsx` with Supabase queries/mutations when you are ready for multi-device sync.

## Vercel Setup

1. Import the GitHub repository into Vercel.
2. Add the same environment variables from `.env.example`.
3. Deploy. The app uses Next.js App Router and no custom server.

## Scripts

- `npm run dev` - start local development.
- `npm run lint` - lint the project.
- `npm run build` - create a production build.
