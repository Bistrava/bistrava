# Environment configuration

Copy `.env.example` to `.env.local`. Never commit `.env.local` or real credentials.

| Variable | Exposure | Required for | Description |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Browser + server | Canonical URLs | `http://localhost:3000` locally; `https://bistrava.com` in production. |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | Supabase | Project URL from the Supabase Connect dialog. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser + server | Supabase | Browser-safe publishable key. RLS remains mandatory. |
| `SUPABASE_SECRET_KEY` | Server only | Privileged jobs | Secret key used only by `src/lib/supabase/admin.ts`. Never prefix it with `NEXT_PUBLIC_`. |
| `RESEND_API_KEY` | Server only | Email delivery | Resend API key beginning with `re_`. Not needed for preview rendering. |
| `EMAIL_FROM` | Server only | Email delivery | Use `Bistrava <narocila@mail.bistrava.com>` only after Resend verifies the DNS records. |
| `EMAIL_REPLY_TO` | Server only | Email replies | A monitored reply address on a verified domain. |
| `EMAIL_INTERNAL_TO` | Server only | Inquiry alerts | Internal recipient for new quote, installation, service, advice, and configurator requests. |
| `RATE_LIMIT_SALT` | Server only | Inquiry protection | Long random value used when hashing request IPs. |
| `CHECKOUT_ORDERING_ENABLED` | Server only | Order creation | Must remain `false` until selling prices, public stock, delivery rates and legal terms are approved. |
| `CHECKOUT_MODE` | Server only | Order workflow | `manual_review` creates a pending, unpaid order. It never represents successful payment. |
| `NEXT_PUBLIC_GTM_ID` | Browser | Measurement | Optional GTM container. Preferred production orchestration path. |
| `NEXT_PUBLIC_GA4_ID` | Browser | Measurement | Optional direct GA4 property when GTM is not used. |
| `NEXT_PUBLIC_GOOGLE_ADS_ID` | Browser | Measurement | Optional direct Google Ads tag when GTM is not used. |

The app intentionally builds when these values are blank. Supabase client factories return `null`, no draft becomes active, inquiries return a clear configuration error instead of a false success, and the email sender returns `not_configured` without attempting delivery. The cart still works locally, but checkout submission remains disabled unless the server-side commerce gate and at least one real Slovenian shipping rate are configured.

## Vercel environments

Configure separate values for Development, Preview, and Production. Prefer separate Supabase projects or, at minimum, separate databases and credentials for production. Pull local values only after the Vercel project is linked and the user approves the connection.

Do not add the Supabase secret key or Resend API key to browser-exposed variables. Do not log full email addresses, access tokens, refresh tokens, secret keys, raw payment payloads, or address data.

## Applying Supabase migrations

After a Development project is approved and linked:

1. Review all SQL in `supabase/migrations`.
2. Apply migrations to the Development project first.
3. Run RLS tests as anonymous, authenticated customer, editor, and administrator.
4. Generate `supabase/seed-specialist-products.sql` with `pnpm catalog:seed:sql`, review it, and apply it only in local/development first. Every imported candidate stays in draft.
5. Generate TypeScript database types from the resulting schema.

## Creating the first administrator

There is no public sign-up route.

1. Create or invite the user manually in Supabase Authentication.
2. Confirm the `handle_new_user` trigger created the matching `profiles` row.
3. In a controlled SQL session, insert the role using the real auth user UUID:

```sql
insert into public.admin_roles (profile_id, role, active)
values ('REAL_AUTH_USER_UUID', 'admin', true);
```

4. Sign in at `/admin/connexion` and confirm `/admin` is accessible.
5. Verify that an authenticated account without a role is denied.

Never expose this insertion through a public endpoint.
