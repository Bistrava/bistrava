import Link from "next/link";

export default function NotFound() {
  return (
    <main id="glavna-vsebina" className="standalone-state">
      <div className="narrow-container empty-state card">
        <span className="eyebrow">Napaka 404</span>
        <h1>Te strani ni mogoče najti.</h1>
        <p>
          Naslov je morda napačen ali pa vsebina še ni bila objavljena.
        </p>
        <Link className="button button-primary" href="/">
          Nazaj na domačo stran
        </Link>
      </div>
    </main>
  );
}
