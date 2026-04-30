import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

test("FinanceProvider starts empty when Supabase is not configured and no local data exists", async () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const { FinanceProvider, useFinance } = await import("../src/lib/finance-store");

  function Probe() {
    const finance = useFinance();
    return createElement("p", null, `${finance.cards.length}:${finance.transactions.length}:${finance.pots.length}:${finance.wishlist.length}:${finance.budgets.length}:${finance.subscriptions.length}`);
  }

  const html = renderToString(createElement(FinanceProvider, null, createElement(Probe)));

  assert.match(html, />0:0:0:0:0:0</);

  if (previousUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
  }

  if (previousKey === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousKey;
  }
});

test("profile auth does not create a Supabase client in local mode", async () => {
  const previousUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const previousKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const { FinanceProvider } = await import("../src/lib/finance-store");
  const { ProfileAuth } = await import("../src/components/profile-auth");

  assert.doesNotThrow(() => {
    const html = renderToString(createElement(FinanceProvider, null, createElement(ProfileAuth)));
    assert.match(html, /Local mode/);
  });

  if (previousUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_URL = previousUrl;
  }

  if (previousKey === undefined) {
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  } else {
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = previousKey;
  }
});
