begin;

create table public.mailbox_sync (
  mailbox text primary key,
  uid_validity text,
  last_uid bigint not null default 0 check (last_uid >= 0),
  lease_id uuid,
  lease_until timestamptz,
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  smtp_verified_at timestamptz
);
insert into public.mailbox_sync(mailbox) values ('kontakt@bistrava.com');

create table public.mailbox_messages (
  id uuid primary key default gen_random_uuid(),
  mailbox text not null references public.mailbox_sync(mailbox),
  uid_validity text not null,
  imap_uid bigint not null,
  message_id text,
  sender_name text not null default '',
  sender_address text not null,
  reply_address text,
  subject text not null,
  body_text text not null default '',
  body_limited boolean not null default false,
  attachments jsonb not null default '[]'::jsonb,
  received_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique(mailbox, uid_validity, imap_uid)
);
create index mailbox_messages_received on public.mailbox_messages(received_at desc, id);

create table public.mailbox_replies (
  id uuid primary key,
  message_id uuid not null references public.mailbox_messages(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  recipient text not null,
  subject text not null,
  body_text text not null check (length(body_text) between 1 and 20000),
  rfc_message_id text not null unique,
  status text not null default 'sending' check (status in ('sending','sent','failed','unknown')),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);
create index mailbox_replies_message on public.mailbox_replies(message_id, created_at);

create function public.guard_mailbox_reply() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(7310042);
  if exists(select 1 from public.mailbox_replies where message_id=new.message_id and status in ('sending','unknown')) then
    raise exception 'mailbox_send_pending';
  end if;
  if (select count(*) from public.mailbox_replies where created_at>now()-interval '1 hour') >= 50 then
    raise exception 'mailbox_send_limit';
  end if;
  return new;
end;
$$;
revoke all on function public.guard_mailbox_reply() from public, anon, authenticated;
create trigger mailbox_reply_guard before insert on public.mailbox_replies for each row execute function public.guard_mailbox_reply();

alter table public.mailbox_sync enable row level security;
alter table public.mailbox_messages enable row level security;
alter table public.mailbox_replies enable row level security;
create policy mailbox_sync_staff_read on public.mailbox_sync for select to authenticated using(public.has_admin_role());
create policy mailbox_messages_staff_read on public.mailbox_messages for select to authenticated using(public.has_admin_role());
create policy mailbox_replies_staff_read on public.mailbox_replies for select to authenticated using(public.has_admin_role());
revoke all on public.mailbox_sync, public.mailbox_messages, public.mailbox_replies from public, anon, authenticated;
grant select on public.mailbox_sync, public.mailbox_messages, public.mailbox_replies to authenticated;
grant all on public.mailbox_sync, public.mailbox_messages, public.mailbox_replies to service_role;

-- A database lease prevents simultaneous serverless instances from flooding IMAP.
create function public.claim_mailbox_sync(input_lease uuid) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if input_lease is null then return false; end if;
  update public.mailbox_sync set lease_id=input_lease, lease_until=now()+interval '90 seconds', last_attempt_at=now()
  where mailbox='kontakt@bistrava.com'
    and (lease_until is null or lease_until < now())
    and (last_attempt_at is null or last_attempt_at < now()-interval '45 seconds');
  return found;
end;
$$;
revoke all on function public.claim_mailbox_sync(uuid) from public, anon, authenticated;
grant execute on function public.claim_mailbox_sync(uuid) to service_role;

-- One atomic inbox insert creates exactly one notification using the same ID.
create function public.notify_mailbox_message() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.email_events(id,email_type,recipient_hash,idempotency_key,status,occurred_at)
  values(new.id, left(new.subject,160), encode(sha256(convert_to(new.mailbox,'UTF8')),'hex'),
    'inbox:'||new.id::text,'delivered',new.received_at);
  return new;
end;
$$;
revoke all on function public.notify_mailbox_message() from public, anon, authenticated;
create trigger mailbox_message_notification after insert on public.mailbox_messages
for each row execute function public.notify_mailbox_message();

commit;
