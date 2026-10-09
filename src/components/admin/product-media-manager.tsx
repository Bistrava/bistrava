"use client";

import Image from "next/image";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { changeAdminProductImage } from "@/actions/admin-products";
import { initialAdminProductActionState } from "@/lib/forms/action-state";
import { useAdminLanguage } from "@/components/admin/admin-i18n";
import type { AdminProductEditorData } from "@/lib/admin/product-editor";
import "./product-admin.css";

function MediaImage({ image, slug, disabled }: { image: NonNullable<AdminProductEditorData["images"]>[number]; slug: string; disabled: boolean }) {
  const { locale } = useAdminLanguage();
  const fr = locale === "fr";
  const [state, action, pending] = useActionState(changeAdminProductImage, initialAdminProductActionState);
  const router = useRouter();
  useEffect(() => { if (state.status === "success") router.refresh(); }, [state, router]);
  return <form action={action} className="admin-media-image">
    <input type="hidden" name="slug" value={slug} /><input type="hidden" name="imageId" value={image.id} /><input type="hidden" name="adminLocale" value={locale} />
    <div className="admin-media-image-frame"><Image alt={image.alt} fill sizes="240px" src={image.url} /></div>
    <label className="admin-editor-field"><span>{fr ? "Description de l’image (SEO)" : "Opis slike (SEO)"}</span><input name="alt" defaultValue={image.alt} maxLength={250} minLength={2} disabled={disabled || pending} /></label>
    {image.isPrimary ? <span className="admin-status admin-status-active">{fr ? "Image principale" : "Glavna slika"}</span> : null}
    <div className="admin-product-inline-actions">
      <button className="button button-secondary" name="operation" value="alt" disabled={disabled || pending}>{fr ? "Enregistrer le texte" : "Shrani opis"}</button>
      <button className="button button-secondary" name="operation" value="primary" disabled={disabled || pending || image.isPrimary}>{fr ? "Image principale" : "Glavna slika"}</button>
      <button className="button button-secondary" name="operation" value="up" disabled={disabled || pending} aria-label={fr ? "Avancer cette image" : "Premakni sliko naprej"}>↑</button>
      <button className="button button-secondary" name="operation" value="down" disabled={disabled || pending} aria-label={fr ? "Reculer cette image" : "Premakni sliko nazaj"}>↓</button>
      <button className="button button-secondary" name="operation" value="remove" disabled={disabled || pending}>{fr ? "Retirer de la galerie" : "Odstrani iz galerije"}</button>
    </div>
    {state.message ? <p role="status" className={state.status === "error" ? "is-error" : "is-success"}>{state.message}</p> : null}
  </form>;
}

export function ProductMediaManager({ product, disabled }: { product: AdminProductEditorData; disabled: boolean }) {
  const { locale } = useAdminLanguage(); const fr = locale === "fr";
  const [fileError, setFileError] = useState("");
  const [state, action, pending] = useActionState(changeAdminProductImage, initialAdminProductActionState);
  const router = useRouter();
  useEffect(() => { if (state.status === "success") router.refresh(); }, [state, router]);
  if (!product.values.currentSlug) return <section className="admin-panel card"><h2>{fr ? "Images du produit" : "Slike izdelka"}</h2><p>{fr ? "Enregistrez le brouillon pour ajouter vos images, puis activez le produit." : "Shranite osnutek, dodajte slike in nato aktivirajte izdelek."}</p></section>;
  return <section className="admin-panel card admin-product-media-manager">
    <h2>{fr ? "Galerie du produit" : "Galerija izdelka"}</h2>
    <p>{fr ? "Choisissez l’image principale et organisez les images du carrousel. JPG, PNG, WebP ou AVIF, 3 Mo maximum par image." : "Izberite glavno sliko in uredite zaporedje galerije. JPG, PNG, WebP ali AVIF, največ 3 MB na sliko."}</p>
    {disabled ? <p className="admin-product-notice">{fr ? "Enregistrez les modifications du produit avant de gérer les images. Un accès administrateur est requis." : "Pred urejanjem slik shranite spremembe izdelka. Potreben je skrbniški dostop."}</p> : null}
    <form action={action} className="admin-media-upload" onSubmit={(event) => {
      const file = new FormData(event.currentTarget).get("file");
      if (!(file instanceof File) || file.size > 3 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type)) {
        event.preventDefault(); setFileError(fr ? "Choisissez une image JPG, PNG, WebP ou AVIF de 3 Mo maximum." : "Izberite sliko JPG, PNG, WebP ali AVIF do 3 MB.");
      } else setFileError("");
    }}>
      <input type="hidden" name="slug" value={product.values.currentSlug} /><input type="hidden" name="operation" value="add" /><input type="hidden" name="adminLocale" value={locale} />
      <label className="admin-editor-field"><span>{fr ? "Nouvelle image" : "Nova slika"}</span><input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required disabled={disabled || pending} /></label>
      <label className="admin-editor-field"><span>{fr ? "Description de l’image" : "Opis slike"}</span><input name="alt" defaultValue={product.values.nameSl} required minLength={2} maxLength={250} disabled={disabled || pending} /></label>
      <button className="button button-primary" disabled={disabled || pending || (product.images?.length ?? 0) >= 20}>{pending ? (fr ? "Transfert…" : "Prenašanje …") : (fr ? "Ajouter l’image" : "Dodaj sliko")}</button>
      {fileError ? <p role="alert">{fileError}</p> : state.message ? <p role="status">{state.message}</p> : null}
    </form>
    <div className="admin-media-grid">{product.images?.map((image) => <MediaImage key={`${image.id}:${image.alt}`} image={image} slug={product.values.currentSlug} disabled={disabled} />)}</div>
  </section>;
}
