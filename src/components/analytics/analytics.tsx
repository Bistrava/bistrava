"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

import { ConsentBanner } from "@/components/analytics/consent-banner";

export function Analytics() {
  const pathname = usePathname();
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const ga4Id = process.env.NEXT_PUBLIC_GA4_ID;
  const adsId = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      {gtmId ? (
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${gtmId}');`}
        </Script>
      ) : null}
      {ga4Id && !gtmId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4Id}`} strategy="afterInteractive" />
          <Script id="ga4-config" strategy="afterInteractive">
            {`window.gtag('js', new Date()); window.gtag('config', '${ga4Id}', { send_page_view: true });`}
          </Script>
        </>
      ) : null}
      {adsId && !gtmId ? (
        <Script id="google-ads-config" strategy="afterInteractive">
          {`window.gtag('config', '${adsId}');`}
        </Script>
      ) : null}
      <ConsentBanner />
    </>
  );
}
