begin;

-- GS1 check digit for GTIN-8, UPC, EAN-13 and GTIN-14.
create function public.is_valid_gtin(value text) returns boolean
language sql immutable set search_path = '' as $$
  -- CASE guards the casts: AND does not guarantee short-circuit evaluation.
  select case when value ~ '^(\d{8}|\d{12,14})$' then (
    select (10 - sum(substr(value, i, 1)::integer
      * case when (char_length(value) - i) % 2 = 1 then 3 else 1 end) % 10) % 10
    from generate_series(1, char_length(value) - 1) i
  ) = right(value, 1)::integer else false end
$$;

-- Manufacturer identifiers for Google Merchant; the application keeps verified research as fallback.
alter table public.products
  add column gtin text,
  add column mpn text,
  add constraint products_gtin_valid check (gtin is null or public.is_valid_gtin(gtin)),
  add constraint products_mpn_valid check (mpn is null or char_length(btrim(mpn)) between 1 and 70);
create unique index products_gtin_unique on public.products (gtin) where gtin is not null;

-- Same function as 202610080012_admin_products.sql with gtin and mpn added to the editable fields.
create or replace function public.save_admin_product(p_current_slug text,p_values jsonb,p_category_slug text,p_expected_updated_at timestamptz)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare
 v_before public.products%rowtype; v_after public.products%rowtype; v_category uuid; v_payload jsonb;
 v_new boolean := coalesce(p_current_slug,'')=''; v_delta integer;
begin
 if not public.has_admin_role(array['admin']::public.admin_role[]) then raise exception 'admin_required' using errcode='42501'; end if;
 if jsonb_typeof(p_values) <> 'object' then raise exception 'invalid_product'; end if;
 select id into v_category from public.categories where slug=p_category_slug and status in ('active','published') and archived_at is null;
 if v_category is null then raise exception 'invalid_category'; end if;
 if not v_new then
   select * into v_before from public.products where slug=p_current_slug for update;
   if not found then raise exception 'product_not_found'; end if;
   if p_expected_updated_at is null or v_before.updated_at<>p_expected_updated_at then raise exception 'stale_product' using errcode='40001'; end if;
 end if;
 select jsonb_object_agg(key,value) into v_payload from jsonb_each(p_values) where key=any(array['name','name_sl','slug','brand','sku','gtin','mpn','technology','status','sales_mode','featured','short_description','short_description_sl','description','description_sl','benefits','seo_title','seo_description','primary_keyword','secondary_keywords','long_tail_keywords','seo_keywords','tags','price_cents','compare_at_price_cents','vat_rate','stock_status','stock_quantity','lead_time_days','warranty_months','household_size_min','household_size_max','resin_volume_liters','nominal_flow_lpm','max_flow_lpm','connection_size','regeneration_mode','salt_consumption_kg','dimensions','weight_kg','drain_required','electricity_required','bypass_included','installation_required','technical_specs','certifications']);
 v_after := jsonb_populate_record(v_before,v_payload);
 if not v_new and v_after.slug is distinct from v_before.slug then raise exception 'product_slug_locked'; end if;
 if v_after.status not in ('draft','active','archived') or v_after.status is null
   or v_after.stock_quantity is null or v_after.stock_quantity<0
   or length(trim(coalesce(v_after.name,'')))<2 or length(v_after.name)>180
   or v_after.sku is null or v_after.sku !~ '^[A-Z0-9][A-Z0-9._-]{1,63}$'
   or v_after.slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(v_after.slug)>120
   or (v_after.gtin is not null and not public.is_valid_gtin(v_after.gtin))
   or (v_after.mpn is not null and char_length(btrim(v_after.mpn)) not between 1 and 70)
   or (v_after.stock_status='in_stock' and v_after.stock_quantity=0)
   or (v_after.price_cents is not null and v_after.price_cents<0)
   or (v_after.compare_at_price_cents is not null and (v_after.price_cents is null or v_after.compare_at_price_cents<=v_after.price_cents))
   or v_after.vat_rate<0 or v_after.vat_rate>100 then raise exception 'invalid_product'; end if;
 if v_after.gtin is not null and exists(select 1 from public.products where gtin=v_after.gtin and id is distinct from v_before.id) then raise exception 'duplicate_gtin'; end if;
 if v_new and v_after.status<>'draft' then raise exception 'create_draft_first'; end if;
 if v_after.status='active' and (coalesce(v_after.price_cents,0)<=0 or v_after.stock_status='unverified'
   or v_after.lead_time_days is null or v_after.warranty_months is null
   or length(coalesce(v_after.short_description_sl,''))<20 or length(coalesce(v_after.description_sl,''))<80
   or length(coalesce(v_after.seo_title,''))<10 or length(coalesce(v_after.seo_description,''))<50
   or jsonb_typeof(v_after.technical_specs)<>'array' or jsonb_array_length(v_after.technical_specs)=0
   or not exists(select 1 from public.product_images where product_id=v_before.id)) then raise exception 'product_not_ready'; end if;
 if v_new then
   insert into public.products(name,name_sl,slug,brand,sku,gtin,mpn,technology,status,sales_mode,featured,short_description,short_description_sl,description,description_sl,benefits,seo_title,seo_description,primary_keyword,secondary_keywords,long_tail_keywords,seo_keywords,tags,price_cents,compare_at_price_cents,vat_rate,stock_status,stock_quantity,lead_time_days,warranty_months,household_size_min,household_size_max,resin_volume_liters,nominal_flow_lpm,max_flow_lpm,connection_size,regeneration_mode,salt_consumption_kg,dimensions,weight_kg,drain_required,electricity_required,bypass_included,installation_required,technical_specs,certifications) values(v_after.name,v_after.name_sl,v_after.slug,v_after.brand,v_after.sku,v_after.gtin,v_after.mpn,v_after.technology,v_after.status,v_after.sales_mode,v_after.featured,v_after.short_description,v_after.short_description_sl,v_after.description,v_after.description_sl,v_after.benefits,v_after.seo_title,v_after.seo_description,v_after.primary_keyword,v_after.secondary_keywords,v_after.long_tail_keywords,v_after.seo_keywords,v_after.tags,v_after.price_cents,v_after.compare_at_price_cents,v_after.vat_rate,v_after.stock_status,v_after.stock_quantity,v_after.lead_time_days,v_after.warranty_months,v_after.household_size_min,v_after.household_size_max,v_after.resin_volume_liters,v_after.nominal_flow_lpm,v_after.max_flow_lpm,v_after.connection_size,v_after.regeneration_mode,v_after.salt_consumption_kg,v_after.dimensions,v_after.weight_kg,v_after.drain_required,v_after.electricity_required,v_after.bypass_included,v_after.installation_required,v_after.technical_specs,v_after.certifications) returning * into v_after;
 else
   update public.products set name=v_after.name,name_sl=v_after.name_sl,slug=v_after.slug,brand=v_after.brand,sku=v_after.sku,gtin=v_after.gtin,mpn=v_after.mpn,technology=v_after.technology,status=v_after.status,sales_mode=v_after.sales_mode,featured=v_after.featured,short_description=v_after.short_description,short_description_sl=v_after.short_description_sl,description=v_after.description,description_sl=v_after.description_sl,benefits=v_after.benefits,seo_title=v_after.seo_title,seo_description=v_after.seo_description,primary_keyword=v_after.primary_keyword,secondary_keywords=v_after.secondary_keywords,long_tail_keywords=v_after.long_tail_keywords,seo_keywords=v_after.seo_keywords,tags=v_after.tags,price_cents=v_after.price_cents,compare_at_price_cents=v_after.compare_at_price_cents,vat_rate=v_after.vat_rate,stock_status=v_after.stock_status,stock_quantity=v_after.stock_quantity,lead_time_days=v_after.lead_time_days,warranty_months=v_after.warranty_months,household_size_min=v_after.household_size_min,household_size_max=v_after.household_size_max,resin_volume_liters=v_after.resin_volume_liters,nominal_flow_lpm=v_after.nominal_flow_lpm,max_flow_lpm=v_after.max_flow_lpm,connection_size=v_after.connection_size,regeneration_mode=v_after.regeneration_mode,salt_consumption_kg=v_after.salt_consumption_kg,dimensions=v_after.dimensions,weight_kg=v_after.weight_kg,drain_required=v_after.drain_required,electricity_required=v_after.electricity_required,bypass_included=v_after.bypass_included,installation_required=v_after.installation_required,technical_specs=v_after.technical_specs,certifications=v_after.certifications,
     published_at=case when v_after.status='active' then coalesce(v_before.published_at,now()) else null end,
     archived_at=case when v_after.status='archived' then now() else null end,updated_at=now()
   where id=v_before.id returning * into v_after;
 end if;
 delete from public.product_categories where product_id=v_after.id;
 insert into public.product_categories(product_id,category_id,sort_order) values(v_after.id,v_category,0);
 v_delta:=v_after.stock_quantity-coalesce(v_before.stock_quantity,0);
 if v_delta<>0 then
   insert into public.product_inventory_movements(product_id,reason,quantity_delta,balance_after,note)
     values(v_after.id,case when v_new then 'initial'::public.inventory_reason else 'correction'::public.inventory_reason end,v_delta,v_after.stock_quantity,'Administration catalogue');
 end if;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,before_data,after_data)
   values(auth.uid(),case when v_new then 'product.created' else 'product.updated' end,'product',v_after.id,case when v_new then null else to_jsonb(v_before) end,to_jsonb(v_after));
 return jsonb_build_object('slug',v_after.slug,'updated_at',v_after.updated_at);
end $$;
revoke all on function public.save_admin_product(text,jsonb,text,timestamptz) from public,anon;
grant execute on function public.save_admin_product(text,jsonb,text,timestamptz) to authenticated;

commit;
