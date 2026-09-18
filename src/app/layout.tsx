import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";

import { Analytics } from "@/components/analytics/analytics";
import { JsonLd } from "@/components/seo/json-ld";
import { siteConfig } from "@/lib/seo/site";
import { organizationSchema, websiteSchema } from "@/lib/seo/structured-data";

import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"], display: "swap" });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin", "latin-ext"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "Bistrava | Mehčalci vode in zaščita pred vodnim kamnom",
    template: "%s | Bistrava",
  },
  description:
    "Bistrava pomaga izbrati mehčalec vode za hišo ali stanovanje: analiza trdote, svetovanje, ponudba, montaža in vzdrževanje v Sloveniji.",
  applicationName: siteConfig.name,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "sl_SI",
    url: "/",
    siteName: siteConfig.name,
    title: "Mehka voda. Manj vodnega kamna. Več udobja doma.",
    description: "Analiza, svetovanje, mehčalci vode, montaža in vzdrževanje.",
    images: [{ url: "/media/bistrava-water-mineral-v1.png", width: 1729, height: 910, alt: "Abstraktna tekstura čiste vode in svetlega minerala" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bistrava - strokovnjak za mehko vodo",
    description: "Analiza, svetovanje, mehčalci vode, montaža in vzdrževanje.",
    images: ["/media/bistrava-water-mineral-v1.png"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sl" className={`${inter.variable} ${manrope.variable}`}>
      <body>
        <Script id="consent-mode-default" strategy="beforeInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            window.gtag = window.gtag || gtag;
            gtag('consent', 'default', {
              ad_storage: 'denied',
              analytics_storage: 'denied',
              ad_user_data: 'denied',
              ad_personalization: 'denied',
              functionality_storage: 'granted',
              security_storage: 'granted',
              wait_for_update: 500
            });
          `}
        </Script>
        <a className="skip-link" href="#glavna-vsebina">Preskoči na glavno vsebino</a>
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
