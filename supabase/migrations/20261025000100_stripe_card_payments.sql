begin;

-- Card orders are paid through Stripe; card data never reaches this database.
alter table public.orders drop constraint orders_checkout_mode_valid;
alter table public.orders add constraint orders_checkout_mode_valid check (checkout_mode in ('manual_review', 'bank_transfer', 'card'));
create unique index payments_stripe_reference_unique on public.payments(provider_reference)
  where provider = 'stripe' and provider_reference is not null;

create function public.create_card_order(
  input_cart_lines jsonb, input_email text, input_phone text, input_customer jsonb,
  input_shipping_address jsonb, input_shipping_rate_id uuid, input_customer_note text,
  input_guest_access_token_hash text, input_idempotency_key uuid, input_discount_code text,
  input_expected_total_cents integer
) returns table(order_id uuid, order_reference text)
language plpgsql security definer set search_path = '' as $$
declare existing public.orders%rowtype; created record;
begin
  if input_idempotency_key is null then raise exception 'invalid_guest_access_token'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(input_idempotency_key::text, 0));
  select * into existing from public.orders where checkout_idempotency_key = input_idempotency_key;
  if found then
    if existing.guest_access_token_hash is distinct from input_guest_access_token_hash or existing.checkout_mode <> 'card' then raise exception 'idempotency_conflict'; end if;
    return query select existing.id, existing.reference; return;
  end if;
  select * into created from public.create_pending_guest_order(input_cart_lines, input_email, input_phone, input_customer,
    input_shipping_address, input_shipping_rate_id, input_customer_note, input_guest_access_token_hash,
    input_idempotency_key, input_discount_code, input_expected_total_cents);
  -- Like bank transfers, unpaid card orders keep their reservation until staff cancel them.
  update public.orders set status = 'awaiting_payment', checkout_mode = 'card', reservation_expires_at = null
  where id = created.order_id;
  update public.payments set provider = 'stripe' where public.payments.order_id = created.order_id;
  return query select created.order_id, created.order_reference;
end;
$$;
revoke all on function public.create_card_order(jsonb,text,text,jsonb,jsonb,uuid,text,text,uuid,text,integer) from public, anon, authenticated;
grant execute on function public.create_card_order(jsonb,text,text,jsonb,jsonb,uuid,text,text,uuid,text,integer) to service_role;

create function public.attach_card_payment_intent(input_order_id uuid, input_intent_id text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if input_intent_id is null or input_intent_id !~ '^pi_[A-Za-z0-9_]{6,250}$' then raise exception 'invalid_payment_intent'; end if;
  update public.payments set provider_reference = input_intent_id
  where order_id = input_order_id and provider = 'stripe' and status in ('pending', 'requires_action', 'failed')
    and (provider_reference is null or provider_reference = input_intent_id);
  if not found then raise exception 'card_payment_not_found'; end if;
end;
$$;
revoke all on function public.attach_card_payment_intent(uuid, text) from public, anon, authenticated;
grant execute on function public.attach_card_payment_intent(uuid, text) to service_role;

-- Applies a verified Stripe PaymentIntent state once per event id. Only the
-- server calls it, after checking the webhook signature or retrieving the
-- PaymentIntent from Stripe with the secret key.
create function public.record_card_payment_event(
  input_event_id text, input_event_type text, input_intent_id text,
  input_amount_cents integer, input_currency text, input_payload jsonb
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  payment_record public.payments%rowtype;
  order_record public.orders%rowtype;
  newly_paid boolean := false;
  problem text;
begin
  if input_event_id is null or char_length(input_event_id) not between 3 and 255 or input_intent_id is null then raise exception 'invalid_payment_event'; end if;
  select * into payment_record from public.payments where provider = 'stripe' and provider_reference = input_intent_id for update;
  if not found then
    insert into public.payment_events(provider, provider_event_id, event_type, verified, payload, processed_at, processing_error)
    values ('stripe', input_event_id, input_event_type, true, coalesce(input_payload, '{}'::jsonb), now(), 'payment_not_found')
    on conflict (provider, provider_event_id) do nothing;
    return jsonb_build_object('status', 'ignored');
  end if;
  insert into public.payment_events(payment_id, provider, provider_event_id, event_type, verified, payload)
  values (payment_record.id, 'stripe', input_event_id, input_event_type, true, coalesce(input_payload, '{}'::jsonb))
  on conflict (provider, provider_event_id) do nothing;
  if not found then return jsonb_build_object('status', 'duplicate'); end if;
  select * into order_record from public.orders where id = payment_record.order_id for update;

  if input_event_type = 'payment_intent.succeeded' then
    if input_amount_cents is distinct from payment_record.amount_cents or lower(coalesce(input_currency, '')) <> 'eur'
      or payment_record.amount_cents <> order_record.total_cents then
      problem := 'amount_mismatch';
    else
      if payment_record.status <> 'paid' then
        update public.payments set status = 'paid', paid_at = now(), failed_at = null where id = payment_record.id;
        newly_paid := true;
      end if;
      if order_record.status in ('pending', 'awaiting_payment') then
        update public.orders set status = 'paid', reservation_expires_at = null where id = order_record.id;
      elsif order_record.status = 'cancelled' then
        problem := 'paid_after_cancellation';
      end if;
      if newly_paid then
        insert into public.audit_logs(actor_id, action, entity_type, entity_id, before_data, after_data)
        values (null, 'payment.card_confirmed', 'payment', payment_record.id,
          jsonb_build_object('status', payment_record.status, 'order_status', order_record.status),
          jsonb_build_object('status', 'paid', 'reference', input_intent_id, 'amount_cents', payment_record.amount_cents));
      end if;
    end if;
  elsif input_event_type = 'payment_intent.payment_failed' then
    update public.payments set status = 'failed', failed_at = now()
    where id = payment_record.id and status in ('pending', 'requires_action', 'failed');
  elsif input_event_type = 'payment_intent.canceled' then
    update public.payments set status = 'cancelled'
    where id = payment_record.id and status in ('pending', 'requires_action', 'failed');
  end if;

  update public.payment_events set processed_at = now(), processing_error = problem
  where provider = 'stripe' and provider_event_id = input_event_id;
  return jsonb_build_object('status', coalesce(problem, 'processed'), 'orderId', order_record.id, 'newlyPaid', newly_paid);
end;
$$;
revoke all on function public.record_card_payment_event(text, text, text, integer, text, jsonb) from public, anon, authenticated;
grant execute on function public.record_card_payment_event(text, text, text, integer, text, jsonb) to service_role;

commit;
