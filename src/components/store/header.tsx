import Image from "next/image";
import Link from "next/link";

import { CartLink } from "@/components/cart/cart-link";
import { MobileMenu } from "@/components/store/mobile-menu";

export const mainNavigation = [
  { href: "/mehcalci-vode", label: "Trgovina" },
  { href: "/vodni-kamen", label: "Vodni kamen" },
  { href: "/izbira-mehcalca", label: "Vodnik za izbiro" },
  { href: "/vodici", label: "Vodniki" },
  { href: "/pogosta-vprasanja", label: "Pogosta vprašanja" },
] as const;

export function Header() {
  return (
    <header className="site-header">
      <div className="utility-bar">
        <div className="container utility-inner">
          <p>Specializirana spletna trgovina za mehčanje in zaščito vode.</p>
          <Link href="/test-trdote-vode">Kako izmeriti trdoto?</Link>
        </div>
      </div>
      <div className="container header-main specialist-header-main">
        <Link className="brand-link" href="/" aria-label="Bistrava - domov">
          <Image
            src="/brand/bistrava-logo-web.png"
            alt="Bistrava"
            width={610}
            height={157}
            priority
            sizes="196px"
            unoptimized
          />
        </Link>
        <nav className="desktop-nav specialist-nav" aria-label="Glavna navigacija">
          {mainNavigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
        </nav>
        <div className="header-tools">
          <CartLink />
          <Link className="button button-primary header-quote-button" href="/mehcalci-vode#katalog">
            Izdelki
          </Link>
          <MobileMenu items={mainNavigation} />
        </div>
      </div>
    </header>
  );
}
