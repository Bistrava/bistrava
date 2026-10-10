begin;
do $$
declare
  mid uuid := gen_random_uuid(); admin_id uuid; customer_id uuid := gen_random_uuid();
  rid uuid := gen_random_uuid(); rejected boolean;
begin
  select profile_id into admin_id from public.admin_roles where role='admin' and active limit 1;
  insert into auth.users(id,email) values(customer_id,'mailbox-customer@example.test');
  insert into public.mailbox_messages(id,mailbox,uid_validity,imap_uid,sender_address,subject,body_text,received_at)
  values(mid,'kontakt@bistrava.com','test',1,'customer@example.test','Private subject','Private body',now());
  if (select count(*) from public.email_events where id=mid)<>1 then raise exception 'TEST inbox event missing'; end if;
  insert into public.mailbox_messages(mailbox,uid_validity,imap_uid,sender_address,subject,received_at)
  values('kontakt@bistrava.com','test',1,'customer@example.test','Duplicate',now()) on conflict do nothing;
  if (select count(*) from public.mailbox_messages)<>1 then raise exception 'TEST duplicate import'; end if;
  if not public.claim_mailbox_sync(gen_random_uuid()) or public.claim_mailbox_sync(gen_random_uuid()) then raise exception 'TEST lease isolation'; end if;

  perform set_config('request.jwt.claim.sub',customer_id::text,true);
  execute 'set local role authenticated';
  if exists(select 1 from public.mailbox_messages) or exists(select 1 from public.mailbox_sync) then raise exception 'TEST customer can read inbox'; end if;
  rejected:=false;
  begin perform public.claim_mailbox_sync(gen_random_uuid()); exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'TEST browser can acquire service lease'; end if;
  perform set_config('request.jwt.claim.sub',admin_id::text,true);
  if (select count(*) from public.mailbox_messages)<>1 then raise exception 'TEST staff cannot read'; end if;
  rejected:=false;
  begin update public.mailbox_messages set subject='tampered'; exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'TEST browser write allowed'; end if;
  if public.mark_admin_notifications_read('email',array[mid])<>1 then raise exception 'TEST inbox read receipt'; end if;
  execute 'reset role';

  insert into public.mailbox_replies(id,message_id,actor_id,recipient,subject,body_text,rfc_message_id)
  values(rid,mid,admin_id,'customer@example.test','Re: Private','Reply','<'||rid::text||'@bistrava.com>');
  rejected:=false;
  begin
    insert into public.mailbox_replies(id,message_id,recipient,subject,body_text,rfc_message_id)
    values(gen_random_uuid(),mid,'customer@example.test','Duplicate','Duplicate','<duplicate@example.test>');
  exception when others then
    if sqlerrm='mailbox_send_pending' then rejected:=true; else raise; end if;
  end;
  if not rejected then raise exception 'TEST uncertain send can be duplicated'; end if;
  update public.mailbox_replies set status='sent' where id=rid;
  execute 'set local role anon';
  rejected:=false;
  begin perform count(*) from public.mailbox_replies; exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'TEST anonymous inbox access'; end if;
  execute 'reset role';
end;
$$;
rollback;
