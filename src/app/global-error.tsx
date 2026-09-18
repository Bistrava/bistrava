"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="sl">
      <body>
        <main className="standalone-state">
          <div className="narrow-container empty-state card">
            <h1>Prišlo je do nepričakovane napake.</h1>
            <p>Poskusite znova. Če težava ostane, nas obvestite.</p>
            <button className="button button-primary" onClick={reset}>
              Poskusi znova
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
