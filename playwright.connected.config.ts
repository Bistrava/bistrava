import { defineConfig, devices } from "@playwright/test";
import { assertLocalCheckoutEnvironment } from "./scripts/seed-checkout-local.mjs";

const local = assertLocalCheckoutEnvironment();
const port = new URL(local.siteUrl).port;

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: "checkout-connected.spec.ts",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: Boolean(process.env.CI),
  timeout: 180_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  outputDir: "test-results/connected",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: local.siteUrl,
    serviceWorkers: "block",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `pnpm exec next dev --hostname 127.0.0.1 --port ${port}`,
    url: local.siteUrl,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      NODE_ENV: "development",
      BISTRAVA_CONNECTED_TEST: "1",
      NEXT_PUBLIC_SITE_URL: local.siteUrl,
      NEXT_PUBLIC_SUPABASE_URL: local.supabaseUrl,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: local.publishableKey,
      SUPABASE_SECRET_KEY: local.secretKey,
      CHECKOUT_ORDERING_ENABLED: "true",
      CHECKOUT_MODE: "bank_transfer",
      LWS_MAIL_PASSWORD: "",
      RESEND_API_KEY: "",
      EMAIL_FROM: "",
      EMAIL_REPLY_TO: "",
      EMAIL_INTERNAL_TO: "",
      NEXT_PUBLIC_GTM_ID: "",
      NEXT_PUBLIC_GA4_ID: "",
      NEXT_PUBLIC_GOOGLE_ADS_ID: "",
      ROBOTS_INDEXING_ENABLED: "false",
      NEXT_TELEMETRY_DISABLED: "1",
      RATE_LIMIT_SALT: "local-connected-checkout-test-only",
    },
  },
});
