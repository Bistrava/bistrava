import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";

import { PrivacySettingsButton } from "@/components/analytics/consent-banner";

const solutionLinks = [
  ["Vsi izdelki", "/mehcalci-vode#katalog"],
  ["Mehčalci vode", "/mehcalci-vode#mehcalci-vode"],
  ["Zaščita naprav", "/mehcalci-vode#ciljna-zascita"],
  ["Sol in vzdrževanje", "/mehcalci-vode#sol-in-vzdrzevanje"],
] as const;

const supportLinks = [
  ["Vodnik za izbiro", "/izbira-mehcalca"],
  ["Trda voda", "/trda-voda"],
  ["Test trdote", "/test-trdote-vode"],
  ["Vodniki", "/vodici"],
  ["Pogosta vprašanja", "/pogosta-vprasanja"],
] as const;

const legalLinks = [
  ["O Bistravi", "/o-nas"],
  ["Kontakt", "/kontakt"],
  ["Splošni pogoji", "/splosni-pogoji-poslovanja"],
  ["Pravno obvestilo", "/pravna-obvestila"],
  ["Dostava", "/dostava"],
  ["Plačila", "/placila"],
  ["Vračila in povračila", "/vracila"],
  ["Garancija in skladnost", "/garancija"],
  ["Politika zasebnosti", "/zasebnost"],
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
        <FooterColumn title="Trgovina" links={solutionLinks} />
        <FooterColumn title="Nasveti" links={supportLinks} />
        <FooterColumn title="Informacije" links={legalLinks} />
      </div>
      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} Bistrava. Vse pravice pridržane.</p>
        <div>
          <p>Preverite podatke na produktni kartici pred nakupom.</p>
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
