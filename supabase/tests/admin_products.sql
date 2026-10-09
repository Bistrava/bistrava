-- Run with a database owner connection after migration 202610080012.
-- Every fixture and temporary role change is rolled back. No Storage files are uploaded.
begin;
do $$
declare
  v_admin uuid; v_slug text; v_sku text; v_category text; v_id uuid; v_image uuid;
  v_payload jsonb; v_saved jsonb; v_before integer; v_after integer;
  v_rejected boolean; v_changed integer;
begin
  select profile_id into v_admin from public.admin_roles where role='admin' and active limit 1;
  if v_admin is null then raise exception 'TEST prerequisite: active administrator required'; end if;
  select slug into v_category from public.categories where status in ('active','published') and archived_at is null order by slug limit 1;
  if v_category is null then raise exception 'TEST prerequisite: active category required'; end if;
  select to_jsonb(p) into v_payload from public.products p limit 1;
  if v_payload is null then raise exception 'TEST prerequisite: source product required'; end if;
  v_slug := 'admin-test-' || replace(gen_random_uuid()::text,'-','');
  v_sku := upper(v_slug);
  v_payload := v_payload || jsonb_build_object(
    'name','Administrativni testni izdelek','name_sl','Administrativni testni izdelek','brand','Test',
    'slug',v_slug,'sku',v_sku,'status','draft','sales_mode','buy_now','stock_status','in_stock','stock_quantity',4,
    'price_cents',1234,'compare_at_price_cents',null,'vat_rate',22,'featured',false,
    'short_description','Testni izdelek za preverjanje administratorskega urejanja.',
    'short_description_sl','Testni izdelek za preverjanje administratorskega urejanja.',
    'description_sl','Ta testni izdelek preverja shranjevanje vsebine, prodajne cene, zaloge in galerije. Podatki se ob koncu testa v celoti razveljavijo.',
    'seo_title','Testni vodni filter za preverjanje | Bistrava',
    'seo_description','Testni opis za preverjanje pravilne objave izdelka in zaščite sprememb zaloge v administraciji Bistrava.',
    'lead_time_days',3,'warranty_months',24,'technical_specs','[{"labelSl":"Test","valueSl":"Da"}]'::jsonb,
    'benefits','[]'::jsonb,'certifications','[]'::jsonb,'secondary_keywords','[]'::jsonb,'long_tail_keywords','[]'::jsonb,'seo_keywords','[]'::jsonb,'tags','[]'::jsonb
  );
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_admin,'role','authenticated')::text,true);
  perform set_config('request.jwt.claim.sub',v_admin::text,true);
  execute 'set local role authenticated';
  v_saved := public.save_admin_product('',v_payload,v_category,null);
  select id into v_id from public.products where slug=v_slug;
  if v_id is null or (select status from public.products where id=v_id)<>'draft' then raise exception 'TEST draft creation failed'; end if;
  if (select count(*) from public.product_categories where product_id=v_id)<>1 then raise exception 'TEST category not linked'; end if;
  if (select sum(quantity_delta) from public.product_inventory_movements where product_id=v_id)<>4 then raise exception 'TEST initial stock journal failed'; end if;
  if not exists(select 1 from public.audit_logs where entity_id=v_id and action='product.created') then raise exception 'TEST creation audit missing'; end if;

  v_rejected:=false;
  begin perform public.save_admin_product(v_slug,v_payload || jsonb_build_object('slug',v_slug||'-renamed'),v_category,(v_saved->>'updated_at')::timestamptz);
  exception when others then if sqlerrm like '%product_slug_locked%' then v_rejected:=true; else raise; end if; end;
  if not v_rejected then raise exception 'TEST existing product URL can be changed'; end if;

  v_rejected:=false;
  begin
    perform public.save_admin_product(v_slug,v_payload || '{"status":"active"}'::jsonb,v_category,(v_saved->>'updated_at')::timestamptz);
  exception when others then
    if sqlerrm like '%product_not_ready%' then v_rejected:=true; else raise; end if;
  end;
  if not v_rejected then raise exception 'TEST activation without image accepted'; end if;

  perform public.admin_product_image_change(v_slug,null,'add',v_id::text||'/first.webp','Prva testna slika');
  perform public.admin_product_image_change(v_slug,null,'add',v_id::text||'/second.webp','Druga testna slika');
  select id into v_image from public.product_images where product_id=v_id and storage_path like '%second.webp';
  perform public.admin_product_image_change(v_slug,v_image,'primary');
  if not (select is_primary from public.product_images where id=v_image) then raise exception 'TEST primary image failed'; end if;
  perform public.admin_product_image_change(v_slug,v_image,'alt',null,'Posodobljen opis slike');
  if (select alt_text from public.product_images where id=v_image)<>'Posodobljen opis slike' then raise exception 'TEST image alt failed'; end if;
  perform public.admin_product_image_change(v_slug,v_image,'up');
  if (select sort_order from public.product_images where id=v_image)<>1 then raise exception 'TEST image reorder failed'; end if;
  perform public.admin_product_image_change(v_slug,(select id from public.product_images where product_id=v_id and id<>v_image),'remove');
  if (select count(*) from public.product_images where product_id=v_id)<>1 then raise exception 'TEST image removal failed'; end if;

  v_payload:=v_payload || '{"status":"active","stock_quantity":7}'::jsonb;
  v_saved:=public.save_admin_product(v_slug,v_payload,v_category,(select updated_at from public.products where id=v_id));
  if not exists(select 1 from public.products where id=v_id and status='active' and published_at is not null and stock_quantity=7) then raise exception 'TEST activation and inventory edit failed'; end if;
  if (select sum(quantity_delta) from public.product_inventory_movements where product_id=v_id)<>7 then raise exception 'TEST stock edit not journaled'; end if;
  v_rejected:=false;
  begin perform public.admin_product_image_change(v_slug,v_image,'remove');
  exception when others then if sqlerrm like '%last_active_image%' then v_rejected:=true; else raise; end if; end;
  if not v_rejected then raise exception 'TEST last active image removal accepted'; end if;

  v_rejected:=false;
  begin perform public.save_admin_product(v_slug,v_payload || '{"stock_quantity":999}'::jsonb,v_category,(v_saved->>'updated_at')::timestamptz-interval '1 second');
  exception when serialization_failure then v_rejected:=true; end;
  if not v_rejected or (select stock_quantity from public.products where id=v_id)<>7 then raise exception 'TEST stale edit overwrote stock'; end if;
  v_rejected:=false;
  begin perform public.adjust_admin_inventory(v_slug,6,8,'in_stock','Test stale quantity');
  exception when serialization_failure then v_rejected:=true; end;
  if not v_rejected then raise exception 'TEST stale inventory accepted'; end if;
  perform public.adjust_admin_inventory(v_slug,7,8,'in_stock','Test inventory receipt');
  if (select stock_quantity from public.products where id=v_id)<>8 then raise exception 'TEST inventory adjustment failed'; end if;
  if (select sum(quantity_delta) from public.product_inventory_movements where product_id=v_id)<>8 then raise exception 'TEST journal balance mismatch'; end if;

  -- Public reads see the new active product and its image without a local seed entry.
  execute 'set local role anon';
  if (select count(*) from public.products where id=v_id)<>1 then raise exception 'TEST active product not publicly readable'; end if;
  if (select count(*) from public.product_images where product_id=v_id)<>1 then raise exception 'TEST image not publicly readable'; end if;
  v_rejected:=false;
  begin perform public.adjust_admin_inventory(v_slug,8,100,'in_stock','Anonymous attempt');
  exception when insufficient_privilege then v_rejected:=true; end;
  if not v_rejected then raise exception 'TEST anonymous RPC write accepted'; end if;
  execute 'reset role';

  -- Temporarily exercise the existing identity as an editor. This role change is rolled back.
  update public.admin_roles set role='editor' where profile_id=v_admin;
  execute 'set local role authenticated';
  v_rejected:=false;
  begin perform public.adjust_admin_inventory(v_slug,8,100,'in_stock','Editor attempt');
  exception when insufficient_privilege then v_rejected:=true; end;
  if not v_rejected then raise exception 'TEST editor RPC write accepted'; end if;
  update public.products set stock_quantity=100 where id=v_id;
  get diagnostics v_changed = row_count;
  if v_changed<>0 then raise exception 'TEST editor direct product write accepted'; end if;
  delete from public.product_images where id=v_image;
  get diagnostics v_changed = row_count;
  if v_changed<>0 then raise exception 'TEST editor direct image delete accepted'; end if;
  execute 'reset role';
  update public.admin_roles set role='admin' where profile_id=v_admin;
  execute 'set local role authenticated';

  v_payload:=v_payload || '{"status":"archived","stock_quantity":8}'::jsonb;
  perform public.save_admin_product(v_slug,v_payload,v_category,(select updated_at from public.products where id=v_id));
  if not exists(select 1 from public.products where id=v_id and status='archived' and archived_at is not null and published_at is null) then raise exception 'TEST archive failed'; end if;
  perform public.admin_product_image_change(v_slug,v_image,'remove');
  execute 'set local role anon';
  if exists(select 1 from public.products where id=v_id) then raise exception 'TEST archived product publicly visible'; end if;
  execute 'reset role';
  raise notice 'PASS admin product create/category/activation/media/CAS/inventory/audit/archive and editor/anonymous RLS';
end $$;
rollback;
