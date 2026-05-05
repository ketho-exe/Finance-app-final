# Open Banking MVP Notes

Ledgerly uses GoCardless Bank Account Data as the first account-information provider. The browser only talks to Ledgerly API routes; GoCardless credentials, Supabase service role keys, cron secrets, provider tokens, and synced bank data ingestion all stay server-side.

## Required Environment

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
APP_URL=http://localhost:3000
GOCARDLESS_SECRET_ID=
GOCARDLESS_SECRET_KEY=
CRON_SECRET=replace-with-a-long-random-string
```

Set `APP_URL` to the deployed URL in production. Apply `supabase/migrations/20260505_open_banking_onboarding.sql` before enabling the feature.

## Sync

Vercel runs `/api/open-banking/sync` once per day through `vercel.json`. For local testing, use the Settings screen `Sync now` button or call:

```bash
curl -X GET "http://localhost:3000/api/open-banking/sync" \
  -H "Authorization: Bearer $CRON_SECRET"
```

Imported transactions use `source = 'open_banking'` and are upserted by `(user_id, external_account_id, external_transaction_id)` so repeated syncs do not duplicate provider rows.

## Release Checklist

- Confirm GoCardless production/commercial requirements before public release.
- Add Privacy Policy and Terms of Use.
- Add disconnect, imported-data deletion, data export, and account deletion controls.
- Add consent-expiry reconnect banners.
- Keep service-role and provider code out of client components.
- Verify RLS prevents cross-user access after every schema change.
