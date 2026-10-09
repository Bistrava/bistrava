"use client";

import Link from "next/link";

export default function StoreError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="section"><div className="container"><div className="card" style={{ padding: "clamp(1.5rem, 5vw, 3rem)", maxWidth: 720, margin: "2rem auto" }}>
    <p className="section-kicker">Bistrava</p>
    <h1>Strani trenutno ni mogoče naložiti.</h1>
    <p>Povezava je začasno prekinjena. Poskusite znova čez nekaj trenutkov. Izdelki v vaši košarici so shranjeni v tem brskalniku.</p>
    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginTop: "1.5rem" }}>
      <button className="button button-primary" onClick={reset}>Poskusi znova</button>
      <Link className="button button-secondary" href="/kontakt">Kontakt</Link>
    </div>
  </div></div></section>;
}
