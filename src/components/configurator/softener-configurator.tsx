"use client";

import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw } from "lucide-react";
import { useState } from "react";

import { InquiryForm } from "@/components/forms/inquiry-form";
import {
  recommendSolutions,
  type ConfiguratorInput,
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

export function SoftenerConfigurator() {
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
    const calculated = recommendSolutions(input);
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
            <small>{["Voda", "Dom", "Montaža", "Rezultat"][item - 1]}</small>
          </span>
        ))}
      </div>

      {step === 1 ? (
        <fieldset className="configurator-step">
          <legend>Lokacija in trdota vode</legend>
          <p>Poštna številka nam pomaga pri ponudbi, vendar trdote iz lokacije ne ugibamo.</p>
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
          <legend>Prostor in montaža</legend>
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
            <label htmlFor="cfg-installation">Potrebujete montažo?</label>
            <select id="cfg-installation" value={input.installationNeed} onChange={(event) => update("installationNeed", event.target.value as ConfiguratorInput["installationNeed"])}>
              <option value="unsure">Potrebujem nasvet</option><option value="yes">Da</option><option value="no">Ne</option>
            </select>
          </div>
          <p className="notice">Rezultat je profil rešitve, ne avtomatska potrditev konkretnega izdelka ali cene.</p>
          <div className="configurator-actions"><button className="button button-secondary" type="button" onClick={() => setStep(2)}><ArrowLeft aria-hidden="true" size={18} /> Nazaj</button><button className="button button-primary" type="button" onClick={calculate}>Prikažite rezultat <ArrowRight aria-hidden="true" size={18} /></button></div>
        </fieldset>
      ) : null}

      {step === 4 && result ? (
        <div className="configurator-results">
          <div className="configurator-result-heading">
            <div><p className="section-kicker">Deterministični rezultat</p><h2>{result.needsAdvice ? "Najprej potrebujemo dodaten podatek" : "Priporočeni profili rešitve"}</h2><p>{result.reasonSl}</p></div>
            <button className="button button-secondary" type="button" onClick={restart}><RotateCcw aria-hidden="true" size={18} /> Začnite znova</button>
          </div>
          {result.recommendations.length > 0 ? (
            <div className="recommendation-grid">
              {result.recommendations.map((recommendation) => (
                <article className="card" key={recommendation.id}>
                  <CheckCircle2 aria-hidden="true" />
                  <h3>{recommendation.nameSl}</h3>
                  <p>{recommendation.whySl}</p>
                  <dl>
                    <div><dt>Ocenjena zmogljivost</dt><dd>{recommendation.estimatedCapacitySl}</dd></div>
                    <div><dt>Montaža</dt><dd>{recommendation.installationSl}</dd></div>
                    <div><dt>Vzdrževanje</dt><dd>{recommendation.maintenanceSl}</dd></div>
                  </dl>
                </article>
              ))}
            </div>
          ) : null}
          <div className="configurator-contact">
            <InquiryForm
              type="configurator"
              title="Shranite rezultat in zahtevajte pregled"
              description="Kontaktne podatke zahtevamo šele zdaj, po prikazu rezultata. Z oddajo se rezultat shrani skupaj z vašim soglasjem."
              defaultMunicipality={input.municipality}
              defaultPostalCode={input.postalCode}
              defaultMessage="Prosim za pregled rezultata konfiguratorja in pripravo naslednjega koraka."
              payload={{ input, result }}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
