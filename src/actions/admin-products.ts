"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAdminAccess } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";
import { adminProductFormSchema } from "@/lib/validation/admin-product";
import { slugSchema } from "@/lib/validation/catalog";

import type { AdminProductActionState } from "@/lib/forms/action-state";
function fail(fr:boolean, french:string, slovenian:string):AdminProductActionState { return { status:"error",message:fr?french:slovenian }; }
function refreshCatalog(slug:string, oldSlug?:string) {
  for(const path of ["/admin","/admin/izdelki","/admin/zaloga","/","/mehcalci-vode","/kategorije","/sitemap.xml","/merchant-feed.xml",`/admin/izdelki/${slug}`,`/izdelki/${slug}`]) revalidatePath(path);
  revalidatePath("/kategorije","layout");
  if(oldSlug && oldSlug!==slug) { revalidatePath(`/admin/izdelki/${oldSlug}`); revalidatePath(`/izdelki/${oldSlug}`); }
}
function rpcFailure(message:string,fr:boolean):AdminProductActionState {
  if(message.includes("stale_product")) return fail(fr,"Ce produit a changé depuis son ouverture (commande ou autre modification). Rechargez avant de réessayer.","Izdelek se je medtem spremenil. Osvežite stran in poskusite znova.");
  if(message.includes("product_not_ready") || message.includes("create_draft_first")) return fail(fr,"Enregistrez d’abord un brouillon, ajoutez une image, puis complétez les champs nécessaires avant l’activation.","Najprej shranite osnutek, dodajte sliko in dopolnite obvezne podatke za objavo.");
  if(message.includes("last_active_image")) return fail(fr,"Ajoutez une autre image avant de retirer la dernière image d’un produit actif.","Pred odstranitvijo zadnje slike aktivnega izdelka dodajte drugo sliko.");
  if(message.includes("duplicate key")) return fail(fr,"Ce SKU ou cet identifiant URL est déjà utilisé.","Ta SKU ali URL oznaka že obstaja.");
  return fail(fr,"L’enregistrement a échoué. Vérifiez les champs puis réessayez.","Shranjevanje ni uspelo. Preverite podatke in poskusite znova.");
}

export async function saveAdminProduct(_previousState:AdminProductActionState,formData:FormData):Promise<AdminProductActionState> {
  const isFrench=formData.get("adminLocale")==="fr";
  const access=await getAdminAccess();
  if(access.status!=="authorized" || access.role!=="admin") return fail(isFrench,"Accès administrateur requis.","Potreben je skrbniški dostop.");
  const parsed=adminProductFormSchema.safeParse(Object.fromEntries(formData));
  if(!parsed.success) return { ...fail(isFrench,"Vérifiez les champs signalés.","Preverite označena polja."),fieldErrors:parsed.error.flatten().fieldErrors };
  const supabase=await createClient();
  if(!supabase) return fail(isFrench,"Supabase indisponible.","Supabase ni na voljo.");
  if (parsed.data.currentSlug && parsed.data.slug !== parsed.data.currentSlug) return fail(isFrench,"L’URL d’un produit existant reste inchangée pour préserver les liens.","URL obstoječega izdelka ostane nespremenjen zaradi povezav.");
  const expected=formData.get("expectedUpdatedAt");
  if(parsed.data.currentSlug && (typeof expected!=="string" || !Number.isFinite(Date.parse(expected)))) return fail(isFrench,"Rechargez le produit avant de l’enregistrer.","Pred shranjevanjem osvežite izdelek.");
  const seoKeywords=Array.from(new Set([parsed.data.primaryKeyword,...parsed.data.secondaryKeywords,...parsed.data.longTailKeywords].filter(Boolean)));
  const update = {
    name: parsed.data.nameSl,
    name_sl: parsed.data.nameSl,
    slug: parsed.data.slug,
    brand: parsed.data.brand,
    sku: parsed.data.sku,
    technology: parsed.data.technology || null,
    status: parsed.data.status,
    sales_mode: parsed.data.salesMode,
    featured: parsed.data.featured,
    short_description: parsed.data.shortDescriptionSl,
    short_description_sl: parsed.data.shortDescriptionSl,
    description: parsed.data.descriptionSl,
    description_sl: parsed.data.descriptionSl,
    benefits: parsed.data.highlights,
    seo_title: parsed.data.seoTitle,
    seo_description: parsed.data.seoDescriptionSl,
    primary_keyword: parsed.data.primaryKeyword || null,
    secondary_keywords: parsed.data.secondaryKeywords,
    long_tail_keywords: parsed.data.longTailKeywords,
    seo_keywords: seoKeywords,
    tags: parsed.data.tags,
    price_cents: parsed.data.priceEuros,
    compare_at_price_cents: parsed.data.compareAtPriceEuros,
    vat_rate: parsed.data.vatRate ?? 22,
    stock_status: parsed.data.stockStatus,
    stock_quantity: parsed.data.stockQuantity ?? 0,
    lead_time_days: parsed.data.leadTimeDays,
    warranty_months: parsed.data.warrantyMonths,
    household_size_min: parsed.data.householdSizeMin,
    household_size_max: parsed.data.householdSizeMax,
    resin_volume_liters: parsed.data.resinVolumeLiters,
    nominal_flow_lpm: parsed.data.nominalFlowLitersPerMinute,
    max_flow_lpm: parsed.data.maxFlowLitersPerMinute,
    connection_size: parsed.data.connectionSize || null,
    regeneration_mode: parsed.data.regenerationMode || null,
    salt_consumption_kg: parsed.data.saltConsumptionKg,
    dimensions: parsed.data.dimensions || null,
    weight_kg: parsed.data.weightKg,
    drain_required: parsed.data.drainRequired,
    electricity_required: parsed.data.electricityRequired,
    bypass_included: parsed.data.bypassIncluded,
    installation_required: parsed.data.installationRequired,
    technical_specs: parsed.data.technicalSpecifications,
    certifications: parsed.data.certifications,
  };

  const {data,error}=await supabase.rpc("save_admin_product",{
    p_current_slug:parsed.data.currentSlug,p_values:update,p_category_slug:parsed.data.categorySlug,p_expected_updated_at:parsed.data.currentSlug?expected:null,
  });
  if(error) return rpcFailure(error.message,isFrench);
  refreshCatalog(parsed.data.slug,parsed.data.currentSlug);
  return {status:"success",message:isFrench?"Produit enregistré dans Supabase.":"Izdelek je shranjen v Supabase.",updatedAt:data?.updated_at,redirectUrl:parsed.data.slug===parsed.data.currentSlug?undefined:`/admin/izdelki/${parsed.data.slug}`};
}

export async function adjustAdminInventory(_previousState:AdminProductActionState,formData:FormData):Promise<AdminProductActionState> {
 const fr=formData.get("adminLocale")==="fr"; const access=await getAdminAccess();
 if(access.status!=="authorized"||access.role!=="admin") return fail(fr,"Accès administrateur requis.","Potreben je skrbniški dostop.");
 const parsed=z.object({slug:slugSchema,expectedQuantity:z.coerce.number().int().min(0),quantity:z.coerce.number().int().min(0).max(10000000),stockStatus:z.enum(["in_stock","out_of_stock","backorder","unverified"]),note:z.string().trim().min(3).max(500)}).safeParse(Object.fromEntries(formData));
 if(!parsed.success || (parsed.data.stockStatus==="in_stock" && parsed.data.quantity===0)) return fail(fr,"Indiquez une quantité valide, un statut cohérent et un motif (3 caractères minimum).","Vnesite veljavno količino, status in razlog (najmanj 3 znaki).");
 const supabase=await createClient(); if(!supabase) return fail(fr,"Supabase indisponible.","Supabase ni na voljo.");
 const v=parsed.data; const {error}=await supabase.rpc("adjust_admin_inventory",{p_slug:v.slug,p_expected_quantity:v.expectedQuantity,p_quantity:v.quantity,p_stock_status:v.stockStatus,p_note:v.note});
 if(error) return rpcFailure(error.message,fr); refreshCatalog(v.slug);
 return {status:"success",message:fr?"Stock et journal mis à jour.":"Zaloga in dnevnik sta posodobljena."};
}

export async function changeAdminProductImage(_previousState:AdminProductActionState,formData:FormData):Promise<AdminProductActionState> {
 const fr=formData.get("adminLocale")==="fr"; const access=await getAdminAccess();
 if(access.status!=="authorized"||access.role!=="admin") return fail(fr,"Accès administrateur requis.","Potreben je skrbniški dostop.");
 const parsed=z.object({slug:slugSchema,operation:z.enum(["add","remove","primary","up","down","alt"]),imageId:z.union([z.string().uuid(),z.literal("")]).optional(),alt:z.string().trim().max(250).optional()}).safeParse(Object.fromEntries(formData));
 if(!parsed.success) return fail(fr,"Données image invalides.","Neveljavni podatki slike.");
 const supabase=await createClient(); if(!supabase) return fail(fr,"Supabase indisponible.","Supabase ni na voljo.");
 const v=parsed.data; let path:string|null=null;
 if(v.operation==="add") {
   const file=formData.get("file");
   const types:Record<string,string>={"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/avif":"avif"};
   if(!(file instanceof File)||!types[file.type]||file.size===0||file.size>3*1024*1024||!v.alt||v.alt.length<2) return fail(fr,"Choisissez une image JPG, PNG, WebP ou AVIF de 3 Mo maximum et une description.","Izberite sliko JPG, PNG, WebP ali AVIF do 3 MB ter vnesite opis.");
   const header = new Uint8Array(await file.slice(0, 16).arrayBuffer());
   const ascii = (offset: number, length: number) => String.fromCharCode(...header.slice(offset, offset + length));
   const validImage = file.type === "image/jpeg" ? header[0] === 255 && header[1] === 216 && header[2] === 255
     : file.type === "image/png" ? [137,80,78,71,13,10,26,10].every((byte, index) => header[index] === byte)
     : file.type === "image/webp" ? ascii(0,4) === "RIFF" && ascii(8,4) === "WEBP"
     : ascii(4,4) === "ftyp" && ["avif", "avis"].includes(ascii(8,4));
   if (!validImage) return fail(fr,"Le contenu de ce fichier ne correspond pas à une image valide.","Vsebina datoteke ni veljavna slika.");
   const {data:product,error}=await supabase.from("products").select("id").eq("slug",v.slug).maybeSingle();
   if(error||!product) return fail(fr,"Produit introuvable.","Izdelka ni mogoče najti.");
   path=`${product.id}/${crypto.randomUUID()}.${types[file.type]}`;
   const {error:uploadError}=await supabase.storage.from("product-media").upload(path,file,{contentType:file.type,upsert:false});
   if(uploadError) return fail(fr,"Le transfert de l’image a échoué.","Prenos slike ni uspel.");
 }
 const {error}=await supabase.rpc("admin_product_image_change",{p_slug:v.slug,p_image_id:v.imageId||null,p_operation:v.operation,p_path:path,p_alt:v.alt||null});
 if(error) { if(path) await supabase.storage.from("product-media").remove([path]); return rpcFailure(error.message,fr); }
 refreshCatalog(v.slug);
 return {status:"success",message:fr?"Galerie mise à jour.":"Galerija je posodobljena."};
}
