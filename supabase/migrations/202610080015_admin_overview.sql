begin;
-- Editors can inspect operations; only administrators can change commerce data.
do $$
declare t text;
begin
  foreach t in array array['profiles','addresses','orders','order_items','payments','payment_events','shipments','shipping_zones','shipping_rates'] loop
    execute format('drop policy if exists %I on public.%I', t || '_staff_all', t);
    execute format('create policy %I on public.%I for select to authenticated using (public.has_admin_role())', t || '_staff_read', t);
    execute format('create policy %I on public.%I for all to authenticated using (public.has_admin_role(array[''admin'']::public.admin_role[])) with check (public.has_admin_role(array[''admin'']::public.admin_role[]))', t || '_admin_write', t);
  end loop;
end $$;
create policy admin_roles_staff_read on public.admin_roles for select to authenticated using (public.has_admin_role());

create function public.get_admin_overview() returns jsonb
language plpgsql security definer set search_path = '' as $$
declare result jsonb;
begin
  if not public.has_admin_role() then raise exception 'admin_required'; end if;
  select jsonb_build_object(
    'products', (select count(*) from public.products where archived_at is null and status <> 'archived'),
    'publishedProducts', (select count(*) from public.products where archived_at is null and status in ('active','published')),
    'stockUnits', (select coalesce(sum(stock_quantity),0) from public.products where archived_at is null and status <> 'archived'),
    'lowStockCount', (select count(*) from public.products where archived_at is null and status in ('active','published') and stock_quantity <= 5),
    'openOrders', (select count(*) from public.orders where status in ('pending','awaiting_payment','paid','processing','shipped')),
    'orders30', (select count(*) from public.orders where created_at >= now() - interval '30 days'),
    'revenue30', (select coalesce(sum(amount_cents-refunded_cents),0) from public.payments where paid_at >= now()-interval '30 days' and status in ('paid','refunded','partially_refunded')),
    'customers', (select count(*) from (select lower(email) from public.orders union select lower(p.email) from public.profiles p where p.email is not null and not exists(select 1 from public.admin_roles a where a.profile_id=p.id and a.active)) c),
    'promotions', (select count(*) from public.discounts where active and archived_at is null and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()) and (usage_limit is null or used_count < usage_limit)),
    'recentOrders', coalesce((select jsonb_agg(r) from (select id, reference, status, total_cents, created_at from public.orders order by created_at desc limit 6) r),'[]'::jsonb),
    'lowStock', coalesce((select jsonb_agg(r) from (select slug,coalesce(name_sl,name) as name,sku,stock_quantity from public.products where archived_at is null and status in ('active','published') and stock_quantity <= 5 order by stock_quantity,name limit 8) r),'[]'::jsonb),
    'monthlySales', (select jsonb_agg(jsonb_build_object('month',to_char(m,'YYYY-MM'),'cents',coalesce((select sum(p.amount_cents-p.refunded_cents) from public.payments p where p.paid_at >= m and p.paid_at < m+interval '1 month' and p.status in ('paid','refunded','partially_refunded')),0)) order by m) from generate_series(date_trunc('month',now())-interval '5 months',date_trunc('month',now()),interval '1 month') m)
  ) into result;
  return result;
end $$;
revoke all on function public.get_admin_overview() from public,anon;
grant execute on function public.get_admin_overview() to authenticated;

create function public.save_admin_customer(input_id uuid,input_expected_updated_at timestamptz,input_name text,input_phone text,input_locale text)
returns void language plpgsql security definer set search_path='' as $$
declare old_profile public.profiles;
begin
  if not public.has_admin_role(array['admin']::public.admin_role[]) then raise exception 'admin_required'; end if;
  if input_name is null or length(trim(input_name)) < 1 or length(input_name)>160 or coalesce(length(input_phone),0)>40 or input_locale not in ('sl-SI','fr-FR','en-GB') then raise exception 'invalid_customer'; end if;
  if exists(select 1 from public.admin_roles where profile_id=input_id) then raise exception 'staff_account'; end if;
  select * into old_profile from public.profiles where id=input_id for update;
  if not found then raise exception 'customer_not_found'; end if;
  if input_expected_updated_at is distinct from old_profile.updated_at then raise exception 'customer_conflict'; end if;
  update public.profiles set full_name=trim(input_name),phone=nullif(trim(input_phone),''),locale=input_locale where id=input_id;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,before_data,after_data)
  values(auth.uid(),'customer.update','profile',input_id,jsonb_build_object('full_name',old_profile.full_name,'phone',old_profile.phone,'locale',old_profile.locale),jsonb_build_object('full_name',trim(input_name),'phone',input_phone,'locale',input_locale));
end $$;
revoke all on function public.save_admin_customer(uuid,timestamptz,text,text,text) from public,anon;
grant execute on function public.save_admin_customer(uuid,timestamptz,text,text,text) to authenticated;

drop policy if exists quote_requests_staff_all on public.quote_requests;
create policy quote_requests_staff_read on public.quote_requests for select to authenticated using(public.has_admin_role());
create policy quote_requests_admin_write on public.quote_requests for all to authenticated using(public.has_admin_role(array['admin']::public.admin_role[])) with check(public.has_admin_role(array['admin']::public.admin_role[]));
create function public.save_admin_inquiry(input_id uuid,input_expected_updated_at timestamptz,input_status public.quote_request_status,input_note text)
returns void language plpgsql security definer set search_path='' as $$
declare previous public.quote_requests;
begin
  if not public.has_admin_role(array['admin']::public.admin_role[]) then raise exception 'admin_required'; end if;
  if input_status is null or length(coalesce(input_note,''))>5000 then raise exception 'invalid_inquiry'; end if;
  select * into previous from public.quote_requests where id=input_id for update;
  if not found then raise exception 'inquiry_not_found'; end if;
  if previous.updated_at is distinct from input_expected_updated_at then raise exception 'inquiry_conflict'; end if;
  update public.quote_requests set status=input_status,internal_note=nullif(input_note,''),assigned_to=auth.uid(),responded_at=case when input_status='responded' then coalesce(responded_at,now()) else responded_at end,closed_at=case when input_status='closed' then now() else null end where id=input_id;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,before_data,after_data) values(auth.uid(),'inquiry.update','inquiry',input_id,jsonb_build_object('status',previous.status),jsonb_build_object('status',input_status));
end $$;
revoke all on function public.save_admin_inquiry(uuid,timestamptz,public.quote_request_status,text) from public,anon;
grant execute on function public.save_admin_inquiry(uuid,timestamptz,public.quote_request_status,text) to authenticated;
commit;
