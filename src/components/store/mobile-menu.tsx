"use client";

import { Menu, X } from "lucide-react";
import type { Route } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

type MobileMenuProps = {
  items: ReadonlyArray<{ href: string; label: string }>;
};

export function MobileMenu({ items }: MobileMenuProps) {
  const pathname = usePathname();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  }, [pathname]);

  return (
    <details className="mobile-menu" ref={detailsRef}>
      <summary aria-label="Odpri meni">
        <Menu className="menu-open-icon" aria-hidden="true" />
        <X className="menu-close-icon" aria-hidden="true" />
      </summary>
      <nav aria-label="Mobilna navigacija">
        {items.map((item) => <Link key={item.href} href={item.href as Route}>{item.label}</Link>)}
        <div className="mobile-menu-actions">
          <Link href="/mehcalci-vode#katalog">Vsi izdelki</Link>
          <Link href="/test-trdote-vode">Kako izmeriti trdoto?</Link>
        </div>
      </nav>
    </details>
  );
}
