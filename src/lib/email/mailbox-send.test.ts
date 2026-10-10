import { beforeEach, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({ results:[] as unknown[], send:vi.fn(), close:vi.fn(), queries:[] as string[] }));
vi.mock('server-only',()=>({}));
vi.mock('nodemailer',()=>({default:{createTransport:()=>({sendMail:mocks.send,close:mocks.close})}}));
vi.mock('@/lib/supabase/admin',()=>({createAdminClient:()=>({from:(table:string)=>{
  mocks.queries.push(table);
  const query={select:()=>query,eq:()=>query,insert:()=>query,update:()=>query,
    single:()=>Promise.resolve(mocks.results.shift()),maybeSingle:()=>Promise.resolve(mocks.results.shift()),
    then:(resolve:(value:unknown)=>unknown)=>Promise.resolve(mocks.results.shift()).then(resolve)};
  return query;
}})}));
import { sendMailboxReply } from './mailbox';
const id='11111111-1111-4111-8111-111111111111';
const input={id,messageId:id,body:'Hvala za vaše vprašanje.'};
const original={data:{id,reply_address:'client@example.test',sender_address:'sender@example.test',subject:'Question',message_id:'<original@example.test>'},error:null};
beforeEach(()=>{ vi.clearAllMocks(); mocks.results=[]; mocks.queries=[]; vi.stubEnv('LWS_MAIL_PASSWORD','test-only-not-a-real-password'); });
it('uses only the stored recipient and stable RFC threading identifiers',async()=>{
  mocks.results=[original,{error:null},{error:null}]; mocks.send.mockResolvedValue({accepted:['client@example.test']});
  expect(await sendMailboxReply(input,'actor')).toEqual({ok:true,reason:'sent'});
  expect(mocks.send).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({to:'client@example.test',messageId:`<${id}@bistrava.com>`,inReplyTo:'<original@example.test>',text:input.body}));
  expect(mocks.close).toHaveBeenCalledOnce();
});
it('never repeats an already sent request',async()=>{
  mocks.results=[original,{error:{code:'23505'}},{data:{message_id:id,body_text:input.body,status:'sent'}}];
  expect(await sendMailboxReply(input,'actor')).toEqual({ok:true,reason:'sent'});
  expect(mocks.send).not.toHaveBeenCalled();
});
it('never sends when the outbox reservation fails or a token is reused with new content',async()=>{
  mocks.results=[original,{error:{code:'23505'}},{data:{message_id:id,body_text:'different',status:'sent'}}];
  expect(await sendMailboxReply(input,'actor')).toEqual({ok:false,reason:'conflict'});
  expect(mocks.send).not.toHaveBeenCalled();
});
it('retains an uncertain SMTP outcome and does not auto retry it',async()=>{
  mocks.results=[original,{error:null},{error:null}]; mocks.send.mockRejectedValue(new Error('socket closed after DATA'));
  expect(await sendMailboxReply(input,'actor')).toEqual({ok:false,reason:'unknown'});
  mocks.results=[original,{error:{code:'23505'}},{data:{message_id:id,body_text:input.body,status:'unknown'}}];
  expect(await sendMailboxReply(input,'actor')).toEqual({ok:false,reason:'unknown'});
  expect(mocks.send).toHaveBeenCalledOnce();
});
it('rejects client recipient overrides without database access',async()=>{
  expect(await sendMailboxReply({...input,to:'victim@example.test'},'actor')).toEqual({ok:false,reason:'invalid'});
  expect(mocks.queries).toEqual([]); expect(mocks.send).not.toHaveBeenCalled();
});
