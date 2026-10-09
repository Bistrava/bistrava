begin;

-- Basket bounds are inclusive and apply to merchandise including VAT, before
-- promotional discounts and excluding delivery (see calculate_guest_checkout_quote).
alter table public.shipping_rates
  add constraint shipping_rates_order_bounds_valid check (
    (min_order_cents is null or min_order_cents >= 0)
    and (max_order_cents is null or max_order_cents >= 0)
    and (min_order_cents is null or max_order_cents is null or min_order_cents <= max_order_cents)
  ),
  add constraint shipping_rates_estimated_days_valid check (
    (estimated_days_min is null and estimated_days_max is null)
    or (estimated_days_min is not null and estimated_days_max is not null
      and estimated_days_min between 1 and 90
      and estimated_days_max between estimated_days_min and 90)
  );

-- Replace the signature, rather than leave an ambiguous PostgREST overload.
-- The new defaults preserve ranges when an older client supplies eight args.
drop function public.admin_save_shipping_rate(uuid, uuid, text, integer, integer, integer, boolean, timestamptz);

create function public.admin_save_shipping_rate(
  input_id uuid, input_zone_id uuid, input_name text, input_price_cents integer,
  input_days_min integer, input_days_max integer, input_active boolean,
  input_expected_updated_at timestamptz default null,
  input_min_order_cents integer default -1,
  input_max_order_cents integer default -1
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  saved_id uuid;
  previous public.shipping_rates%rowtype;
  preserve_bounds boolean := input_min_order_cents = -1 and input_max_order_cents = -1;
  next_min_order integer;
  next_max_order integer;
begin
  if not public.has_admin_role(array['admin']::public.admin_role[]) then raise exception 'admin_required'; end if;
  if input_name is null or char_length(btrim(input_name)) not between 2 and 120
    or input_price_cents is null or input_price_cents not between 0 and 9999999
    or input_active is null
    or ((input_days_min is null) <> (input_days_max is null))
    or (input_days_min is not null and (input_days_min not between 1 and 90 or input_days_max not between input_days_min and 90)) then
    raise exception 'invalid_shipping_rate';
  end if;
  -- A pair of -1 values is only an omitted-argument compatibility marker.
  -- Explicit NULL removes a bound; negative stored bounds are never accepted.
  if not coalesce(preserve_bounds, false) and (
    coalesce(input_min_order_cents < 0, false) or coalesce(input_max_order_cents < 0, false)
    or coalesce(input_min_order_cents > input_max_order_cents, false)
  ) then raise exception 'invalid_shipping_rate'; end if;

  perform id from public.shipping_zones where id = input_zone_id and country_codes = array['SI']::text[]
    and cardinality(postal_code_patterns) = 0 for share;
  if not found then raise exception 'unsupported_shipping_zone'; end if;

  if input_id is not null then
    select * into previous from public.shipping_rates where id = input_id for update;
    if not found then raise exception 'shipping_not_found'; end if;
    if input_expected_updated_at is null or previous.updated_at <> input_expected_updated_at then raise exception 'shipping_conflict'; end if;
  end if;
  next_min_order := case when preserve_bounds then previous.min_order_cents else input_min_order_cents end;
  next_max_order := case when preserve_bounds then previous.max_order_cents else input_max_order_cents end;

  if input_id is null then
    insert into public.shipping_rates(zone_id, name, price_cents, min_order_cents, max_order_cents, estimated_days_min, estimated_days_max, active)
    values(input_zone_id, btrim(input_name), input_price_cents, next_min_order, next_max_order, input_days_min, input_days_max, input_active)
    returning id into saved_id;
  else
    update public.shipping_rates set zone_id = input_zone_id, name = btrim(input_name), price_cents = input_price_cents,
      min_order_cents = next_min_order, max_order_cents = next_max_order,
      estimated_days_min = input_days_min, estimated_days_max = input_days_max, active = input_active
    where id = input_id returning id into saved_id;
  end if;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, before_data, after_data)
  values(auth.uid(), 'shipping_rate.saved', 'shipping_rate', saved_id, to_jsonb(previous),
    jsonb_build_object('name', btrim(input_name), 'price_cents', input_price_cents, 'zone_id', input_zone_id, 'active', input_active,
      'min_order_cents', next_min_order, 'max_order_cents', next_max_order,
      'estimated_days_min', input_days_min, 'estimated_days_max', input_days_max));
  return saved_id;
end;
$$;

revoke all on function public.admin_save_shipping_rate(uuid, uuid, text, integer, integer, integer, boolean, timestamptz, integer, integer) from public, anon;
grant execute on function public.admin_save_shipping_rate(uuid, uuid, text, integer, integer, integer, boolean, timestamptz, integer, integer) to authenticated;

commit;
