"use client";

import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { QuickAddToCart } from "@/components/cart/add-to-cart";
import { formatMoney } from "@/lib/commerce/money";
import {
  recommendProducts,
  type ConfiguratorInput,
  type ConfiguratorProduct,
  type RecommendationResult,
} from "@/lib/configurator/recommendation-engine";

const initialInput: ConfiguratorInput = {
  municipality: "",
  postalCode: "",
  hardnessDgh: null,
  dwellingType: "house",
  residents: 4,
  monthlyUsageM3: null,
  bathrooms: 1,
  waterHeater: "unknown",
  availableSpace: "unknown",
  connectionSize: null,
  installationNeed: "unsure",
};

function track(name: string, data: Record<string, unknown> = {}) {
  const win = window as typeof window & { dataLayer?: unknown[] };
  win.dataLayer = win.dataLayer || [];
  win.dataLayer.push({ event: name, ...data });
}

export function SoftenerConfigurator({ products }: { products: ConfiguratorProduct[] }) {
  const [step, setStep] = useState(1);
  const [input, setInput] = useState<ConfiguratorInput>(initialInput);
  const [hardnessUnknown, setHardnessUnknown] = useState(true);
  const [result, setResult] = useState<RecommendationResult | null>(null);

  function update<K extends keyof ConfiguratorInput>(
    key: K,
    value: ConfiguratorInput[K],
  ) {
    setInput((current) => ({ ...current, [key]: value }));
  }

  function next() {
    if (step === 1) track("configurator_start");
    setStep((current) => Math.min(3, current + 1));
  }

  function calculate() {
    const calculated = recommendProducts(input, products);
    setResult(calculated);
    setStep(4);
    track("configurator_complete", {
      needs_advice: calculated.needsAdvice,
      result_count: calculated.recommendations.length,
    });
  }

  function restart() {
    setInput(initialInput);
    setHardnessUnknown(true);
    setResult(null);
    setStep(1);
  }

  return (
    <div className="configurator-shell card">
      <div className="configurator-progress" aria-label={`Korak ${step} od 4`}>
        {[1, 2, 3, 4].map((item) => (
          <span key={item} className={item <= step ? "is-active" : ""}>
            <b>{item}</b>
            <small>{["Voda", "Dom", "Pogoji", "Rezultat"][item - 1]}</small>
          </span>
        ))}
      </div>

      {step === 1 ? (
        <fieldset className="configurator-step">
          <legend>Lokacija in trdota vode</legend>
          <p>Lokacija pomaga opisati vodni vir, vendar trdote iz kraja ne ugibamo.</p>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="cfg-municipality">Občina ali kraj</label>
              <input id="cfg-municipality" value={input.municipality} onChange={(event) => update("municipality", event.target.value)} />
            </div>
            <div className="form-field">
              <label htmlFor="cfg-postal">Poštna številka</label>
              <input id="cfg-postal" inputMode="numeric" value={input.postalCode} onChange={(event) => update("postalCode", event.target.value)} />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="cfg-hardness">Trdota vode v °dH</label>
            <input
              id="cfg-hardness"
              type="number"
              min="1"
              max="60"
              step="0.5"
              value={input.hardnessDgh ?? ""}
              onChange={(event) => {
                const value = event.target.value;
                update("hardnessDgh", value ? Number(value) : null);
                if (value) setHardnessUnknown(false);
              }}
            />
          </div>
          <label className="choice-check">
            <input
              type="checkbox"
              checked={hardnessUnknown}
              onChange={(event) => {
                setHardnessUnknown(event.target.checked);
                if (event.target.checked) update("hardnessDgh", null);
              }}
            />
            Trdote še ne poznam
          </label>
          <div className="configurator-actions"><button className="button button-primary" type="button" onClick={next}>Naprej <ArrowRight aria-hidden="true" size={18} /></button></div>
        </fieldset>
      ) : null}

      {step === 2 ? (
        <fieldset className="configurator-step">
          <legend>Gospodinjstvo in poraba</legend>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="cfg-dwelling">Vrsta doma</label>
              <select id="cfg-dwelling" value={input.dwellingType} onChange={(event) => update("dwellingType", event.target.value as ConfiguratorInput["dwellingType"])}>
                <option value="house">Hiša</option><option value="apartment">Stanovanje</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="cfg-residents">Število oseb</label>
              <input id="cfg-residents" type="number" min="1" max="20" value={input.residents} onChange={(event) => update("residents", Number(event.target.value))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="cfg-usage">Mesečna poraba v m³ <span>(če je znana)</span></label>
              <input id="cfg-usage" type="number" min="1" max="200" value={input.monthlyUsageM3 ?? ""} onChange={(event) => update("monthlyUsageM3", event.target.value ? Number(event.target.value) : null)} />
            </div>
            <div className="form-field">
              <label htmlFor="cfg-bathrooms">Število kopalnic</label>
              <input id="cfg-bathrooms" type="number" min="1" max="10" value={input.bathrooms} onChange={(event) => update("bathrooms", Number(event.target.value))} />
            </div>
          </div>
          <div className="form-field">
            <label htmlFor="cfg-heater">Način ogrevanja sanitarne vode</label>
            <select id="cfg-heater" value={input.waterHeater} onChange={(event) => update("waterHeater", event.target.value as ConfiguratorInput["waterHeater"])}>
              <option value="unknown">Ne vem</option><option value="electric">Električni grelnik</option><option value="heat_pump">Toplotna črpalka</option><option value="district">Daljinsko ogrevanje</option><option value="other">Drugo</option>
            </select>
          </div>
          <div className="configurator-actions"><button className="button button-secondary" type="button" onClick={() => setStep(1)}><ArrowLeft aria-hidden="true" size={18} /> Nazaj</button><button className="button button-primary" type="button" onClick={next}>Naprej <ArrowRight aria-hidden="true" size={18} /></button></div>
        </fieldset>
      ) : null}

      {step === 3 ? (
        <fieldset className="configurator-step">
          <legend>Prostor in priključki</legend>
          <div className="form-row">
            <div className="form-field">
              <label htmlFor="cfg-space">Razpoložljiv prostor</label>
              <select id="cfg-space" value={input.availableSpace} onChange={(event) => update("availableSpace", event.target.value as ConfiguratorInput["availableSpace"])}>
                <option value="unknown">Še ni izmerjen</option><option value="compact">Zelo omejen prostor</option><option value="standard">Običajen servisni prostor</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="cfg-connection">Premer priključka <span>(če je znan)</span></label>
              <input id="cfg-connection" placeholder="npr. 3/4″" value={input.connectionSize ?? ""} onChange={(event) => update("connectionSize", event.target.value || null)} />
            </div>
          </div>
          <div className="form-field">
              <label htmlFor="cfg-installation">Način namestitve</label>
            <select id="cfg-installation" value={input.installationNeed} onChange={(event) => update("installationNeed", event.target.value as ConfiguratorInput["installationNeed"])}>
                <option value="unsure">Še ni določeno</option><option value="yes">Strokovna namestitev</option><option value="no">Samostojna namestitev</option>
            </select>
          </div>
          <p className="notice">Primerjava uporablja tehnične podatke trenutno objavljenih izdelkov. Pred montažo vedno preverite dejanski pretok, tlak, mere in priključke.</p>
          <div className="configurator-actions"><button className="button button-secondary" type="button" onClick={() => setStep(2)}><ArrowLeft aria-hidden="true" size={18} /> Nazaj</button><button className="button button-primary" type="button" onClick={calculate}>Prikažite rezultat <ArrowRight aria-hidden="true" size={18} /></button></div>
        </fieldset>
      ) : null}

      {step === 4 && result ? (
        <div className="configurator-results">
          <div className="configurator-result-heading">
            <div><p className="section-kicker">Primerjava izdelkov</p><h2>{result.needsAdvice ? "Najprej potrebujemo dodaten podatek" : "Priporočeni izdelki"}</h2><p>{result.reasonSl}</p></div>
            <button className="button button-secondary" type="button" onClick={restart}><RotateCcw aria-hidden="true" size={18} /> Začnite znova</button>
          </div>
          {result.assumptions ? (
            <dl className="configurator-assumptions" aria-label="Uporabljene ocene">
              <div><dt>Ocenjena mesečna poraba</dt><dd>{result.assumptions.estimatedMonthlyUsageM3} m³</dd></div>
              <div><dt>Ciljni pretok</dt><dd>{result.assumptions.targetFlowLitersPerMinute} l/min</dd></div>
              <div><dt>Ocenjeni razred smole</dt><dd>{result.assumptions.targetResinVolumeLiters} l</dd></div>
            </dl>
          ) : null}
          {result.recommendations.length > 0 ? (
            <div className="recommendation-grid">
              {result.recommendations.map((recommendation) => (
                <article className="card configurator-product-card" key={recommendation.product.sku}>
                  <Link className="configurator-product-media" href={`/izdelki/${recommendation.product.slug}`}>
                    {recommendation.product.imageUrl ? (
                      <Image
                        src={recommendation.product.imageUrl}
                        alt={recommendation.product.imageAltSl}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                      />
                    ) : null}
                  </Link>
                  <div className="configurator-product-content">
                    <span className="eyebrow">{recommendation.matchLabelSl}</span>
                    <p className="product-card-brand">{recommendation.product.brand}</p>
                    <h3><Link href={`/izdelki/${recommendation.product.slug}`}>{recommendation.product.nameSl}</Link></h3>
                    <p>{recommendation.product.shortDescriptionSl}</p>
                    <ul className="configurator-match-reasons">
                      {recommendation.reasonsSl.map((reason) => <li key={reason}><CheckCircle2 aria-hidden="true" size={18} /> {reason}</li>)}
                    </ul>
                    {recommendation.cautionsSl.length > 0 ? (
                      <div className="configurator-cautions">
                        <AlertTriangle aria-hidden="true" size={18} />
                        <p>{recommendation.cautionsSl.join(" ")}</p>
                      </div>
                    ) : null}
                    <strong className="product-card-price">{formatMoney(recommendation.product.unitPriceCents)}</strong>
                    <div className="configurator-product-actions">
                      <Link className="catalog-product-card-link" href={`/izdelki/${recommendation.product.slug}`}>Podrobnosti <ArrowRight aria-hidden="true" size={17} /></Link>
                      <QuickAddToCart product={{
                        sku: recommendation.product.sku,
                        slug: recommendation.product.slug,
                        nameSl: recommendation.product.nameSl,
                        unitPriceCents: recommendation.product.unitPriceCents,
                        imageUrl: recommendation.product.imageUrl,
                        imageAltSl: recommendation.product.imageAltSl,
                        stockQuantity: recommendation.product.stockQuantity,
                      }} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
          {result.needsAdvice ? <div className="configurator-actions">
            <Link className="button button-primary" href="/mehcalci-vode#katalog">
              Oglejte si vse izdelke <ArrowRight aria-hidden="true" size={18} />
            </Link>
          </div> : null}
        </div>
      ) : null}
    </div>
  );
}
