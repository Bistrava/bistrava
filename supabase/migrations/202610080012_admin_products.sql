begin;
-- Row locks prevent stock lost updates. Catalogue, category, inventory and audit commit together.
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
 select jsonb_object_agg(key,value) into v_payload from jsonb_each(p_values) where key=any(array['name','name_sl','slug','brand','sku','technology','status','sales_mode','featured','short_description','short_description_sl','description','description_sl','benefits','seo_title','seo_description','primary_keyword','secondary_keywords','long_tail_keywords','seo_keywords','tags','price_cents','compare_at_price_cents','vat_rate','stock_status','stock_quantity','lead_time_days','warranty_months','household_size_min','household_size_max','resin_volume_liters','nominal_flow_lpm','max_flow_lpm','connection_size','regeneration_mode','salt_consumption_kg','dimensions','weight_kg','drain_required','electricity_required','bypass_included','installation_required','technical_specs','certifications']);
 v_after := jsonb_populate_record(v_before,v_payload);
 if not v_new and v_after.slug is distinct from v_before.slug then raise exception 'product_slug_locked'; end if;
 if v_after.status not in ('draft','active','archived') or v_after.status is null
   or v_after.stock_quantity is null or v_after.stock_quantity<0
   or length(trim(coalesce(v_after.name,'')))<2 or length(v_after.name)>180
   or v_after.sku is null or v_after.sku !~ '^[A-Z0-9][A-Z0-9._-]{1,63}$'
   or v_after.slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(v_after.slug)>120
   or (v_after.stock_status='in_stock' and v_after.stock_quantity=0)
   or (v_after.price_cents is not null and v_after.price_cents<0)
   or (v_after.compare_at_price_cents is not null and (v_after.price_cents is null or v_after.compare_at_price_cents<=v_after.price_cents))
   or v_after.vat_rate<0 or v_after.vat_rate>100 then raise exception 'invalid_product'; end if;
 if v_new and v_after.status<>'draft' then raise exception 'create_draft_first'; end if;
 if v_after.status='active' and (coalesce(v_after.price_cents,0)<=0 or v_after.stock_status='unverified'
   or v_after.lead_time_days is null or v_after.warranty_months is null
   or length(coalesce(v_after.short_description_sl,''))<20 or length(coalesce(v_after.description_sl,''))<80
   or length(coalesce(v_after.seo_title,''))<10 or length(coalesce(v_after.seo_description,''))<50
   or jsonb_typeof(v_after.technical_specs)<>'array' or jsonb_array_length(v_after.technical_specs)=0
   or not exists(select 1 from public.product_images where product_id=v_before.id)) then raise exception 'product_not_ready'; end if;
 if v_new then
   insert into public.products(name,name_sl,slug,brand,sku,technology,status,sales_mode,featured,short_description,short_description_sl,description,description_sl,benefits,seo_title,seo_description,primary_keyword,secondary_keywords,long_tail_keywords,seo_keywords,tags,price_cents,compare_at_price_cents,vat_rate,stock_status,stock_quantity,lead_time_days,warranty_months,household_size_min,household_size_max,resin_volume_liters,nominal_flow_lpm,max_flow_lpm,connection_size,regeneration_mode,salt_consumption_kg,dimensions,weight_kg,drain_required,electricity_required,bypass_included,installation_required,technical_specs,certifications) values(v_after.name,v_after.name_sl,v_after.slug,v_after.brand,v_after.sku,v_after.technology,v_after.status,v_after.sales_mode,v_after.featured,v_after.short_description,v_after.short_description_sl,v_after.description,v_after.description_sl,v_after.benefits,v_after.seo_title,v_after.seo_description,v_after.primary_keyword,v_after.secondary_keywords,v_after.long_tail_keywords,v_after.seo_keywords,v_after.tags,v_after.price_cents,v_after.compare_at_price_cents,v_after.vat_rate,v_after.stock_status,v_after.stock_quantity,v_after.lead_time_days,v_after.warranty_months,v_after.household_size_min,v_after.household_size_max,v_after.resin_volume_liters,v_after.nominal_flow_lpm,v_after.max_flow_lpm,v_after.connection_size,v_after.regeneration_mode,v_after.salt_consumption_kg,v_after.dimensions,v_after.weight_kg,v_after.drain_required,v_after.electricity_required,v_after.bypass_included,v_after.installation_required,v_after.technical_specs,v_after.certifications) returning * into v_after;
 else
   update public.products set name=v_after.name,name_sl=v_after.name_sl,slug=v_after.slug,brand=v_after.brand,sku=v_after.sku,technology=v_after.technology,status=v_after.status,sales_mode=v_after.sales_mode,featured=v_after.featured,short_description=v_after.short_description,short_description_sl=v_after.short_description_sl,description=v_after.description,description_sl=v_after.description_sl,benefits=v_after.benefits,seo_title=v_after.seo_title,seo_description=v_after.seo_description,primary_keyword=v_after.primary_keyword,secondary_keywords=v_after.secondary_keywords,long_tail_keywords=v_after.long_tail_keywords,seo_keywords=v_after.seo_keywords,tags=v_after.tags,price_cents=v_after.price_cents,compare_at_price_cents=v_after.compare_at_price_cents,vat_rate=v_after.vat_rate,stock_status=v_after.stock_status,stock_quantity=v_after.stock_quantity,lead_time_days=v_after.lead_time_days,warranty_months=v_after.warranty_months,household_size_min=v_after.household_size_min,household_size_max=v_after.household_size_max,resin_volume_liters=v_after.resin_volume_liters,nominal_flow_lpm=v_after.nominal_flow_lpm,max_flow_lpm=v_after.max_flow_lpm,connection_size=v_after.connection_size,regeneration_mode=v_after.regeneration_mode,salt_consumption_kg=v_after.salt_consumption_kg,dimensions=v_after.dimensions,weight_kg=v_after.weight_kg,drain_required=v_after.drain_required,electricity_required=v_after.electricity_required,bypass_included=v_after.bypass_included,installation_required=v_after.installation_required,technical_specs=v_after.technical_specs,certifications=v_after.certifications,
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

create or replace function public.adjust_admin_inventory(p_slug text,p_expected_quantity integer,p_quantity integer,p_stock_status public.stock_status,p_note text)
returns void language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_before public.products%rowtype; v_delta integer;
begin
 if not public.has_admin_role(array['admin']::public.admin_role[]) then raise exception 'admin_required' using errcode='42501'; end if;
 if p_quantity is null or p_quantity<0 or p_quantity>10000000 or p_stock_status is null
   or (p_stock_status='in_stock' and p_quantity=0) or length(trim(coalesce(p_note,'')))<3 or length(p_note)>500 then raise exception 'invalid_inventory'; end if;
 select * into v_before from public.products where slug=p_slug for update;
 if not found then raise exception 'product_not_found'; end if;
 if p_expected_quantity is null or v_before.stock_quantity<>p_expected_quantity then raise exception 'stale_product' using errcode='40001'; end if;
 v_delta:=p_quantity-v_before.stock_quantity;
 update public.products set stock_quantity=p_quantity,stock_status=p_stock_status,updated_at=now() where id=v_before.id;
 if v_delta<>0 then
   insert into public.product_inventory_movements(product_id,reason,quantity_delta,balance_after,note) values(v_before.id,'correction',v_delta,p_quantity,p_note);
 end if;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,before_data,after_data)
   values(auth.uid(),'inventory.adjusted','product',v_before.id,jsonb_build_object('quantity',v_before.stock_quantity,'status',v_before.stock_status),jsonb_build_object('quantity',p_quantity,'status',p_stock_status,'note',p_note));
end $$;
revoke all on function public.adjust_admin_inventory(text,integer,integer,public.stock_status,text) from public,anon;
grant execute on function public.adjust_admin_inventory(text,integer,integer,public.stock_status,text) to authenticated;

create or replace function public.admin_product_image_change(p_slug text,p_image_id uuid,p_operation text,p_path text default null,p_alt text default null)
returns void language plpgsql security invoker set search_path=public,pg_temp as $$
declare v_product public.products%rowtype; v_image public.product_images%rowtype; v_count integer; v_adjacent public.product_images%rowtype;
begin
 if not public.has_admin_role(array['admin']::public.admin_role[]) then raise exception 'admin_required' using errcode='42501'; end if;
 select * into v_product from public.products where slug=p_slug for update;
 if not found then raise exception 'product_not_found'; end if;
 select count(*) into v_count from public.product_images where product_id=v_product.id;
 if p_operation='add' then
   if v_count>=20 or p_path is null or p_path not like v_product.id::text || '/%' or p_path like '%..%'
     or p_path !~ '\.(jpg|png|webp|avif)$' or length(trim(coalesce(p_alt,'')))<2 or length(p_alt)>250 then raise exception 'invalid_image'; end if;
   insert into public.product_images(product_id,storage_path,alt_text,sort_order,is_primary)
     values(v_product.id,p_path,p_alt,coalesce((select max(sort_order)+1 from public.product_images where product_id=v_product.id),0),v_count=0);
 else
   select * into v_image from public.product_images where id=p_image_id and product_id=v_product.id;
   if not found then raise exception 'image_not_found'; end if;
   if p_operation='remove' then
     if v_product.status in ('active','published') and v_count<=1 then raise exception 'last_active_image'; end if;
     delete from public.product_images where id=v_image.id;
     if v_image.is_primary then update public.product_images set is_primary=true where id=(select id from public.product_images where product_id=v_product.id order by sort_order,id limit 1); end if;
   elsif p_operation='primary' then
     update public.product_images set is_primary=(id=v_image.id) where product_id=v_product.id;
   elsif p_operation='alt' then
     if length(trim(coalesce(p_alt,'')))<2 or length(p_alt)>250 then raise exception 'invalid_image'; end if;
     update public.product_images set alt_text=p_alt where id=v_image.id;
   elsif p_operation in ('up','down') then
     update public.product_images i set sort_order=r.position from
       (select id,row_number() over(order by sort_order,id)::integer as position from public.product_images where product_id=v_product.id) r where i.id=r.id;
     select * into v_image from public.product_images where id=p_image_id;
     select * into v_adjacent from public.product_images where product_id=v_product.id and sort_order=v_image.sort_order+case when p_operation='up' then -1 else 1 end;
     if found then update public.product_images set sort_order=case when id=v_image.id then v_adjacent.sort_order else v_image.sort_order end where id in(v_image.id,v_adjacent.id); end if;
   else raise exception 'invalid_image_operation'; end if;
 end if;
 update public.products set updated_at=now() where id=v_product.id;
 insert into public.audit_logs(actor_id,action,entity_type,entity_id,after_data) values(auth.uid(),'product.image.'||p_operation,'product',v_product.id,jsonb_build_object('image_id',p_image_id,'path',p_path));
end $$;
revoke all on function public.admin_product_image_change(text,uuid,text,text,text) from public,anon;
grant execute on function public.admin_product_image_change(text,uuid,text,text,text) to authenticated;

drop policy if exists "products_staff_all" on public.products;
create policy "products_staff_read" on public.products for select to authenticated using(public.has_admin_role());
create policy "products_admin_write" on public.products for all to authenticated using(public.has_admin_role(array['admin']::public.admin_role[])) with check(public.has_admin_role(array['admin']::public.admin_role[]));

drop policy if exists "variants_staff_all" on public.product_variants;
create policy "product_variants_staff_read" on public.product_variants for select to authenticated using(public.has_admin_role());
create policy "product_variants_admin_write" on public.product_variants for all to authenticated using(public.has_admin_role(array['admin']::public.admin_role[])) with check(public.has_admin_role(array['admin']::public.admin_role[]));

drop policy if exists "product_images_staff_all" on public.product_images;
create policy "product_images_staff_read" on public.product_images for select to authenticated using(public.has_admin_role());
create policy "product_images_admin_write" on public.product_images for all to authenticated using(public.has_admin_role(array['admin']::public.admin_role[])) with check(public.has_admin_role(array['admin']::public.admin_role[]));

drop policy if exists "product_documents_staff_all" on public.product_documents;
create policy "product_documents_staff_read" on public.product_documents for select to authenticated using(public.has_admin_role());
create policy "product_documents_admin_write" on public.product_documents for all to authenticated using(public.has_admin_role(array['admin']::public.admin_role[])) with check(public.has_admin_role(array['admin']::public.admin_role[]));

drop policy if exists "product_categories_staff_all" on public.product_categories;
create policy "product_categories_staff_read" on public.product_categories for select to authenticated using(public.has_admin_role());
create policy "product_categories_admin_write" on public.product_categories for all to authenticated using(public.has_admin_role(array['admin']::public.admin_role[])) with check(public.has_admin_role(array['admin']::public.admin_role[]));

drop policy if exists "product_relations_staff_all" on public.product_relations;
create policy "product_relations_staff_read" on public.product_relations for select to authenticated using(public.has_admin_role());
create policy "product_relations_admin_write" on public.product_relations for all to authenticated using(public.has_admin_role(array['admin']::public.admin_role[])) with check(public.has_admin_role(array['admin']::public.admin_role[]));

drop policy if exists "product_inventory_staff_insert" on public.product_inventory_movements;
create policy "product_inventory_admin_insert" on public.product_inventory_movements for insert to authenticated with check(public.has_admin_role(array['admin']::public.admin_role[]));

drop policy if exists "product_media_staff_insert" on storage.objects;
create policy "product_media_admin_insert" on storage.objects for insert to authenticated with check(bucket_id='product-media' and public.has_admin_role(array['admin']::public.admin_role[]) and lower(storage.extension(name))=any(array['jpg','jpeg','png','webp','avif']));

drop policy if exists "product_media_staff_update" on storage.objects;
create policy "product_media_admin_update" on storage.objects for update to authenticated using(bucket_id='product-media' and public.has_admin_role(array['admin']::public.admin_role[])) with check(bucket_id='product-media' and public.has_admin_role(array['admin']::public.admin_role[]) and lower(storage.extension(name))=any(array['jpg','jpeg','png','webp','avif']));

drop policy if exists "product_media_staff_delete" on storage.objects;
create policy "product_media_admin_delete" on storage.objects for delete to authenticated using(bucket_id='product-media' and public.has_admin_role(array['admin']::public.admin_role[])) ;


-- Harden the original variant inventory entry point too; editors retain read-only access.
create or replace function public.adjust_inventory(
  target_variant_id uuid,
  delta integer,
  movement_reason public.inventory_reason,
  movement_note text default null,
  source_type text default null,
  source_id uuid default null
)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_quantity integer;
  next_quantity integer;
begin
  if not public.has_admin_role(array['admin']::public.admin_role[]) then
    raise exception 'admin_required' using errcode='42501';
  end if;
  if delta = 0 then
    raise exception 'inventory_delta_must_not_be_zero';
  end if;

  select stock_quantity into current_quantity
  from public.product_variants
  where id = target_variant_id
  for update;

  if current_quantity is null then
    raise exception 'variant_not_found';
  end if;

  next_quantity := current_quantity + delta;
  if next_quantity < 0 then
    raise exception 'insufficient_inventory';
  end if;

  update public.product_variants
  set stock_quantity = next_quantity, updated_at = now()
  where id = target_variant_id;

  insert into public.inventory_movements (
    variant_id, reason, quantity_delta, balance_after,
    reference_type, reference_id, note, actor_id
  ) values (
    target_variant_id, movement_reason, delta, next_quantity,
    source_type, source_id, movement_note, auth.uid()
  );

  return next_quantity;
end;
$$;

drop policy if exists "inventory_staff_insert" on public.inventory_movements;
create policy "inventory_admin_insert" on public.inventory_movements for insert to authenticated with check(public.has_admin_role(array['admin']::public.admin_role[]));

drop policy if exists "private_documents_staff_insert" on storage.objects;
create policy "private_documents_admin_insert" on storage.objects for insert to authenticated with check(bucket_id='private-documents' and public.has_admin_role(array['admin']::public.admin_role[]) and lower(storage.extension(name))='pdf');

drop policy if exists "private_documents_staff_update" on storage.objects;
create policy "private_documents_admin_update" on storage.objects for update to authenticated using(bucket_id='private-documents' and public.has_admin_role(array['admin']::public.admin_role[])) with check(bucket_id='private-documents' and public.has_admin_role(array['admin']::public.admin_role[]) and lower(storage.extension(name))='pdf');

drop policy if exists "private_documents_staff_delete" on storage.objects;
create policy "private_documents_admin_delete" on storage.objects for delete to authenticated using(bucket_id='private-documents' and public.has_admin_role(array['admin']::public.admin_role[])) ;

commit;
