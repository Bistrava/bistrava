"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  initialInquiryState,
  submitInquiry,
} from "@/actions/inquiry";
import {
  inquiryFieldConstraints,
  inquiryTypes,
} from "@/lib/validation/inquiry";

type InquiryType = (typeof inquiryTypes)[number];

type InquiryFormProps = {
  type?: InquiryType;
  productSlug?: string;
  title?: string;
  description?: string;
  defaultMessage?: string;
  defaultMunicipality?: string;
  defaultPostalCode?: string;
  payload?: unknown;
};

const utmFields = [
  ["utmSource", "utm_source"],
  ["utmMedium", "utm_medium"],
  ["utmCampaign", "utm_campaign"],
  ["utmTerm", "utm_term"],
  ["utmContent", "utm_content"],
] as const;

export function InquiryForm({
  type = "contact",
  productSlug,
  title = "Pošljite povpraševanje",
  description = "Opišite svojo situacijo in vključite podatke, ki jih že imate.",
  defaultMessage = "",
  defaultMunicipality = "",
  defaultPostalCode = "",
  payload = {},
}: InquiryFormProps) {
  const [state, formAction, pending] = useActionState(
    submitInquiry,
    initialInquiryState,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const trackedSuccess = useRef(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    for (const [fieldName, parameterName] of utmFields) {
      const field = formRef.current?.elements.namedItem(fieldName);
      if (field instanceof HTMLInputElement) {
        field.value = params.get(parameterName) || "";
      }
    }
  }, []);

  useEffect(() => {
    if (state.status !== "success" || trackedSuccess.current) return;
    trackedSuccess.current = true;
    const win = window as typeof window & { dataLayer?: unknown[] };
    win.dataLayer = win.dataLayer || [];
    win.dataLayer.push({ event: "generate_lead", inquiry_type: type });
    const specificEvent =
      type === "quote" || type === "configurator"
        ? "request_quote"
        : type === "installation"
          ? "installation_request"
          : "contact_submit";
    win.dataLayer.push({ event: specificEvent, inquiry_type: type });
  }, [state.status, type]);

  return (
    <form ref={formRef} className="contact-form card" action={formAction} noValidate={false}>
      <div className="form-heading">
        <p className="section-kicker">Varen obrazec</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="productSlug" value={productSlug || ""} />
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />
      {utmFields.map(([name]) => (
        <input key={name} type="hidden" name={name} defaultValue="" />
      ))}
      <div className="honeypot-field" aria-hidden="true">
        <label htmlFor="website">Spletna stran</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <div className="form-row">
        <div className="form-field">
          <label htmlFor="inquiry-name">Ime in priimek</label>
          <input
            id="inquiry-name"
            name="name"
            autoComplete="name"
            minLength={inquiryFieldConstraints.name.minLength}
            maxLength={inquiryFieldConstraints.name.maxLength}
            required
            aria-invalid={Boolean(state.fieldErrors?.name)}
          />
          {state.fieldErrors?.name ? <small className="field-error">Vnesite veljavno ime.</small> : null}
        </div>
        <div className="form-field">
          <label htmlFor="inquiry-email">E-pošta</label>
          <input
            id="inquiry-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={inquiryFieldConstraints.email.maxLength}
            required
            aria-invalid={Boolean(state.fieldErrors?.email)}
          />
          {state.fieldErrors?.email ? <small className="field-error">Preverite e-poštni naslov.</small> : null}
        </div>
      </div>
      <div className="form-row">
        <div className="form-field">
          <label htmlFor="inquiry-phone">Telefon <span>(neobvezno)</span></label>
          <input
            id="inquiry-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            maxLength={inquiryFieldConstraints.phone.maxLength}
          />
        </div>
        <div className="form-field">
          <label htmlFor="inquiry-postal-code">Poštna številka <span>(neobvezno)</span></label>
          <input
            id="inquiry-postal-code"
            name="postalCode"
            inputMode="numeric"
            autoComplete="postal-code"
            defaultValue={defaultPostalCode}
            maxLength={inquiryFieldConstraints.postalCode.maxLength}
          />
        </div>
      </div>
      <div className="form-field">
        <label htmlFor="inquiry-municipality">Občina ali kraj <span>(neobvezno)</span></label>
        <input
          id="inquiry-municipality"
          name="municipality"
          autoComplete="address-level2"
          defaultValue={defaultMunicipality}
          maxLength={inquiryFieldConstraints.municipality.maxLength}
        />
      </div>
      <div className="form-field">
        <label htmlFor="inquiry-message">Kako vam lahko pomagamo?</label>
        <textarea
          id="inquiry-message"
          name="message"
          rows={6}
          defaultValue={defaultMessage}
          minLength={inquiryFieldConstraints.message.minLength}
          maxLength={inquiryFieldConstraints.message.maxLength}
          required
          aria-invalid={Boolean(state.fieldErrors?.message)}
        />
        {state.fieldErrors?.message ? <small className="field-error">Dodajte vsaj kratek opis situacije.</small> : null}
      </div>
      <label className="consent-field">
        <input type="checkbox" name="consent" required />
        <span>
          Strinjam se, da Bistrava moje podatke uporabi za obravnavo tega
          povpraševanja. Več v <a href="/zasebnost">obvestilu o zasebnosti</a>.
        </span>
      </label>
      <button className="button button-primary" type="submit" disabled={pending}>
        {pending ? "Varno pošiljanje ..." : "Pošljite povpraševanje"}
      </button>
      <p
        className={state.status === "error" ? "form-status form-status-error" : "form-status"}
        role="status"
        aria-live="polite"
      >
        {state.message}
      </p>
    </form>
  );
}
