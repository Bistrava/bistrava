begin;

alter table public.orders drop constraint orders_checkout_mode_valid;
alter table public.orders add constraint orders_checkout_mode_valid check(checkout_mode in ('manual_review','bank_transfer'));
alter table public.orders add column bank_transfer_snapshot jsonb;
alter table public.orders add constraint bank_transfer_snapshot_required check(checkout_mode<>'bank_transfer' or bank_transfer_snapshot is not null);

create function public.valid_bank_transfer_details(details jsonb) returns boolean
language plpgsql immutable set search_path='' as $$
declare iban text:=details->>'iban'; rearranged text; char text; digits text; remainder integer:=0; i integer; j integer;
begin
  if details is null or jsonb_typeof(details)<>'object'
    or coalesce(length(btrim(details->>'beneficiary')),0) not between 2 and 160
    or coalesce(length(btrim(details->>'bankName')),0) not between 2 and 160
    or coalesce(details->>'currency','')<>'EUR'
    or coalesce(details->>'bic','')!~ '^([A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?)?$'
    or iban is null or iban!~ '^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$'
  then return false; end if;
  rearranged:=substr(iban,5)||substr(iban,1,4);
  for i in 1..length(rearranged) loop
    char:=substr(rearranged,i,1);
    digits:=case when char between 'A' and 'Z' then (ascii(char)-55)::text else char end;
    for j in 1..length(digits) loop remainder:=(remainder*10+substr(digits,j,1)::integer)%97; end loop;
  end loop;
  return remainder=1;
end;
$$;

create function public.preserve_bank_transfer_snapshot() returns trigger
language plpgsql set search_path='' as $$
begin
  if old.bank_transfer_snapshot is not null and (new.bank_transfer_snapshot is distinct from old.bank_transfer_snapshot or new.checkout_mode<>old.checkout_mode) then
    raise exception 'bank_transfer_snapshot_immutable';
  end if;
  return new;
end;
$$;
create trigger preserve_bank_transfer_snapshot before update on public.orders for each row execute function public.preserve_bank_transfer_snapshot();

create function public.create_bank_transfer_order(
  input_cart_lines jsonb,input_email text,input_phone text,input_customer jsonb,
  input_shipping_address jsonb,input_shipping_rate_id uuid,input_customer_note text,
  input_guest_access_token_hash text,input_idempotency_key uuid,input_discount_code text,
  input_expected_total_cents integer,input_bank_details jsonb
) returns table(order_id uuid,order_reference text)
language plpgsql security definer set search_path='' as $$
declare existing public.orders%rowtype; created record;
begin
  if not public.valid_bank_transfer_details(input_bank_details) then raise exception 'bank_transfer_not_configured'; end if;
  if input_idempotency_key is null then raise exception 'invalid_guest_access_token'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(input_idempotency_key::text,0));
  select * into existing from public.orders where checkout_idempotency_key=input_idempotency_key;
  if found then
    if existing.guest_access_token_hash is distinct from input_guest_access_token_hash or existing.checkout_mode<>'bank_transfer' then raise exception 'idempotency_conflict'; end if;
    return query select existing.id,existing.reference; return;
  end if;
  select * into created from public.create_pending_guest_order(input_cart_lines,input_email,input_phone,input_customer,
    input_shipping_address,input_shipping_rate_id,input_customer_note,input_guest_access_token_hash,
    input_idempotency_key,input_discount_code,input_expected_total_cents);
  update public.orders set status='awaiting_payment',checkout_mode='bank_transfer',reservation_expires_at=null,
    bank_transfer_snapshot=jsonb_build_object('beneficiary',input_bank_details->>'beneficiary','iban',input_bank_details->>'iban',
      'bankName',input_bank_details->>'bankName','bic',coalesce(input_bank_details->>'bic',''),'currency','EUR')
  where id=created.order_id;
  update public.payments set provider='bank_transfer' where public.payments.order_id=created.order_id;
  return query select created.order_id,created.order_reference;
end;
$$;
revoke all on function public.create_bank_transfer_order(jsonb,text,text,jsonb,jsonb,uuid,text,text,uuid,text,integer,jsonb) from public,anon,authenticated;
grant execute on function public.create_bank_transfer_order(jsonb,text,text,jsonb,jsonb,uuid,text,text,uuid,text,integer,jsonb) to service_role;

-- Preserve the existing audited transition, stock and shipment checks; extend
-- only the explicitly supported offline provider for receipt confirmation.
do $$
declare definition text;
begin
  select pg_get_functiondef('public.admin_save_order(uuid,timestamp with time zone,public.order_status,text,jsonb,text)'::regprocedure) into definition;
  if position('payment_record.provider <> ''manual_review''' in definition)=0 then raise exception 'unexpected_admin_order_definition'; end if;
  execute replace(definition,'payment_record.provider <> ''manual_review''','payment_record.provider not in (''manual_review'', ''bank_transfer'')');
end;
$$;

commit;
