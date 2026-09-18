import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";

import { PrivacySettingsButton } from "@/components/analytics/consent-banner";

const solutionLinks = [
  ["Mehčalci vode", "/mehcalci-vode"],
  ["Trda voda", "/trda-voda"],
  ["Vodni kamen", "/vodni-kamen"],
  ["Izbira mehčalca", "/izbira-mehcalca"],
] as const;

const supportLinks = [
  ["Montaža mehčalca", "/montaza-mehcalca-vode"],
  ["Servis naprav", "/servis-mehcalnih-naprav"],
  ["Sol za mehčalec", "/sol-za-mehcalec-vode"],
  ["Test trdote", "/test-trdote-vode"],
  ["Vodniki", "/vodici"],
  ["Pogosta vprašanja", "/pogosta-vprasanja"],
] as const;

const legalLinks = [
  ["Pravno obvestilo", "/pravna-obvestila"],
  ["Dostava", "/dostava"],
  ["Plačila", "/placila"],
  ["Vračila", "/vracila"],
  ["Garancija", "/garancija"],
  ["Zasebnost", "/zasebnost"],
  ["Piškotki", "/piskotki"],
] as const;

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <Link href="/" aria-label="Bistrava - domov">
            <span className="footer-logo-surface">
              <Image src="/brand/bistrava-logo-web.png" alt="Bistrava" width={610} height={157} sizes="180px" unoptimized />
            </span>
          </Link>
          <p className="footer-tagline">Mehka voda. Pametna izbira.</p>
          <p>Bistrava - strokovnjak za mehko vodo brez vodnega kamna.</p>
        </div>
        <FooterColumn title="Rešitve" links={solutionLinks} />
        <FooterColumn title="Podpora" links={supportLinks} />
        <FooterColumn title="Informacije" links={legalLinks} />
      </div>
      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} Bistrava. Vse pravice pridržane.</p>
        <div>
          <p>Prodajni in pravni podatki, označeni kot osnutek, še niso javna ponudba.</p>
          <PrivacySettingsButton />
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: ReadonlyArray<readonly [string, string]> }) {
  return (
    <div>
      <h2>{title}</h2>
      <ul>{links.map(([label, href]) => <li key={href}><Link href={href as Route}>{label}</Link></li>)}</ul>
    </div>
  );
}
