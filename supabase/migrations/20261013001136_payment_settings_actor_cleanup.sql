begin;
create or replace function private.audit_payment_settings() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- A profile deletion may clear only its attribution through the FK action.
  -- It must neither change payment settings nor require the deleted actor's login.
  if pg_trigger_depth() > 1 and old.updated_by is not null and new.updated_by is null
     and (to_jsonb(new)-'updated_by') = (to_jsonb(old)-'updated_by') then
    return new;
  end if;
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
commit;
