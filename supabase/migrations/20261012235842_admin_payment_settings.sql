begin;

create table public.payment_settings (
  id text primary key check (id = 'bank_transfer'),
  configured boolean not null default false,
  enabled boolean not null default false,
  bank_details jsonb,
  revision integer not null default 0,
  updated_at timestamptz not null default now(),
  updated_by uuid references public.profiles(id) on delete set null,
  constraint payment_settings_valid check (
    (not enabled or (configured and public.valid_bank_transfer_details(bank_details)))
    and (bank_details is null or (jsonb_typeof(bank_details) = 'object' and octet_length(bank_details::text) <= 2000))
  )
);
insert into public.payment_settings(id) values ('bank_transfer');
alter table public.payment_settings enable row level security;
revoke all on public.payment_settings from anon, authenticated, service_role;
grant select on public.payment_settings to authenticated, service_role;
grant update (configured, enabled, bank_details) on public.payment_settings to authenticated;
create policy payment_settings_admin_read on public.payment_settings for select to authenticated
  using ((select public.has_admin_role(array['admin']::public.admin_role[])));
create policy payment_settings_admin_update on public.payment_settings for update to authenticated
  using ((select public.has_admin_role(array['admin']::public.admin_role[])))
  with check ((select public.has_admin_role(array['admin']::public.admin_role[])));

create schema if not exists private;
create function private.audit_payment_settings() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.has_admin_role(array['admin']::public.admin_role[]) then
    raise exception 'admin_required';
  end if;
  new.configured := true;
  new.revision := old.revision + 1;
  new.updated_at := clock_timestamp();
  new.updated_by := auth.uid();
  insert into public.audit_logs(actor_id,action,entity_type,before_data,after_data)
  values(auth.uid(),'payment_settings.update','payment_settings',
    jsonb_build_object('enabled',old.enabled,'revision',old.revision,'iban_last4',right(old.bank_details->>'iban',4)),
    jsonb_build_object('enabled',new.enabled,'revision',new.revision,'iban_last4',right(new.bank_details->>'iban',4)));
  return new;
end;
$$;
revoke all on function private.audit_payment_settings() from public, anon, authenticated;
create trigger audit_payment_settings before update on public.payment_settings
  for each row execute function private.audit_payment_settings();

create function public.save_admin_payment_settings(input_expected_revision integer, input_enabled boolean, input_bank_details jsonb)
returns integer language plpgsql security invoker set search_path = '' as $$
declare saved_revision integer;
begin
  if auth.uid() is null or not public.has_admin_role(array['admin']::public.admin_role[]) then raise exception 'admin_required'; end if;
  if input_enabled is null or input_bank_details is null then raise exception 'invalid_payment_settings'; end if;
  update public.payment_settings set configured=true, enabled=input_enabled, bank_details=input_bank_details
  where id='bank_transfer' and revision=input_expected_revision returning revision into saved_revision;
  if not found then raise exception 'payment_settings_conflict'; end if;
  return saved_revision;
end;
$$;
revoke all on function public.save_admin_payment_settings(integer,boolean,jsonb) from public,anon,service_role;
grant execute on function public.save_admin_payment_settings(integer,boolean,jsonb) to authenticated;

-- Lock the configuration while creating a new order. Never accept obsolete
-- account details or a disabled method after the checkout page was rendered.
do $$
declare definition text; marker text := 'select * into created from public.create_pending_guest_order';
begin
  select pg_get_functiondef('public.create_bank_transfer_order(jsonb,text,text,jsonb,jsonb,uuid,text,text,uuid,text,integer,jsonb)'::regprocedure) into definition;
  if position(marker in definition)=0 then raise exception 'unexpected_bank_transfer_definition'; end if;
  execute replace(definition,marker,
    'perform 1 from public.payment_settings where id=''bank_transfer'' for share;
     if exists(select 1 from public.payment_settings where id=''bank_transfer'' and configured
       and (not enabled or bank_details is distinct from input_bank_details)) then
       raise exception ''payment_settings_changed'';
     end if;
     ' || marker);
end;
$$;
commit;
