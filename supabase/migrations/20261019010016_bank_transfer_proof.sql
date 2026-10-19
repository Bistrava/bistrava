begin;

-- Final confirmation of a customer's order is distinct from bank settlement
-- and from completed_at, which remains the end of fulfillment.
alter table public.orders
  add column transfer_proof_received_at timestamptz,
  add column transfer_proof_reference text,
  add constraint orders_transfer_proof_valid check (
    (transfer_proof_received_at is null and transfer_proof_reference is null)
    or (checkout_mode = 'bank_transfer' and transfer_proof_received_at is not null
      and transfer_proof_reference is not null
      and char_length(btrim(transfer_proof_reference)) between 3 and 200)
  );

create function public.admin_confirm_transfer_proof(
  input_order_id uuid,
  input_expected_updated_at timestamptz,
  input_proof_reference text
) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare
  previous_order public.orders%rowtype;
  proof_reference text := nullif(btrim(input_proof_reference), '');
  received_at timestamptz := clock_timestamp();
begin
  if auth.uid() is null or not public.has_admin_role(array['admin']::public.admin_role[]) then
    raise exception 'admin_required';
  end if;
  if proof_reference is null or char_length(proof_reference) not between 3 and 200 then
    raise exception 'invalid_transfer_proof';
  end if;
  select * into previous_order from public.orders where id = input_order_id for update;
  if not found then raise exception 'order_not_found'; end if;
  if previous_order.checkout_mode <> 'bank_transfer'
    or previous_order.status not in ('pending', 'awaiting_payment', 'paid', 'processing', 'shipped', 'completed') then
    raise exception 'transfer_proof_not_allowed';
  end if;
  -- Repeating a successful confirmation does not overwrite the first proof
  -- or create another audit event, even when the original version is stale.
  if previous_order.transfer_proof_received_at is not null then return input_order_id; end if;
  if input_expected_updated_at is null or previous_order.updated_at <> input_expected_updated_at then
    raise exception 'order_conflict';
  end if;
  update public.orders set transfer_proof_received_at = received_at,
    transfer_proof_reference = proof_reference where id = input_order_id;
  insert into public.audit_logs(actor_id, action, entity_type, entity_id, after_data)
  values(auth.uid(), 'order.transfer_proof_received', 'order', input_order_id,
    jsonb_build_object('received_at', received_at, 'reference', proof_reference));
  return input_order_id;
end;
$$;

revoke all on function public.admin_confirm_transfer_proof(uuid, timestamptz, text) from public, anon;
grant execute on function public.admin_confirm_transfer_proof(uuid, timestamptz, text) to authenticated;

commit;
