import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanMailHeader, safeMailAddress, safeMessageId, mailboxReplySchema } from './mailbox-types';

const mocks = vi.hoisted(()=>({ access:vi.fn(), client:vi.fn(), sync:vi.fn(), verify:vi.fn(), send:vi.fn(), configured:vi.fn() }));
vi.mock('@/lib/auth/admin',()=>({ getAdminAccess:mocks.access }));
vi.mock('@/lib/supabase/server',()=>({ createClient:mocks.client }));
vi.mock('@/lib/email/mailbox',()=>({ mailboxAddress:'kontakt@bistrava.com',mailboxConfigured:mocks.configured,syncMailbox:mocks.sync,verifyMailboxSmtp:mocks.verify,sendMailboxReply:mocks.send }));
import { GET, POST } from '@/app/admin/mailbox/route';
const id='11111111-1111-4111-8111-111111111111';
const req=(body:unknown,origin='https://bistrava.com')=>new Request('https://bistrava.com/admin/mailbox',{method:'POST',headers:{origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
beforeEach(()=>{ vi.resetAllMocks(); mocks.access.mockResolvedValue({status:'authorized',userId:'staff',role:'admin'}); mocks.configured.mockReturnValue(true); mocks.sync.mockResolvedValue({ok:true}); mocks.verify.mockResolvedValue({ok:true}); mocks.send.mockResolvedValue({ok:true}); });
describe('mailbox privacy and sending authorization',()=>{
  it.each(['unauthenticated','forbidden'])('rejects %s before connecting to LWS',async status=>{
    mocks.access.mockResolvedValue({status});
    expect((await POST(req({action:'sync'}))).status).toBe(status==='forbidden'?403:401);
    expect((await GET(new Request('https://bistrava.com/admin/mailbox'))).status).toBe(status==='forbidden'?403:401);
    expect(mocks.sync).not.toHaveBeenCalled(); expect(mocks.client).not.toHaveBeenCalled();
  });
  it('rejects cross-origin and missing-origin mutations',async()=>{
    for(const origin of ['https://attacker.invalid','']) expect((await POST(req({action:'reply'},origin))).status).toBe(403);
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it('verifies without sending and does not expose secret configuration',async()=>{
    const result=await POST(req({action:'verify'})); expect(await result.json()).toEqual({ok:true});
    expect(mocks.verify).toHaveBeenCalledOnce(); expect(mocks.send).not.toHaveBeenCalled();
    expect(result.headers.get('Cache-Control')).toContain('no-store');
  });
  it('derives the reply actor from the authenticated session',async()=>{
    const reply={id,messageId:id,body:'Odgovor'};
    await POST(req({action:'reply',reply,actorId:'attacker'})); expect(mocks.send).toHaveBeenCalledWith(reply,'staff');
  });
  it('rejects oversized input and hides provider errors',async()=>{
    expect((await POST(req({action:'reply',body:'x'.repeat(91000)}))).status).toBe(413);
    mocks.sync.mockRejectedValue(new Error('private password and message'));
    const result=await POST(req({action:'sync'})); expect(result.status).toBe(503); expect(await result.json()).toEqual({error:'unavailable'});
  });
});
describe('untrusted mail headers',()=>{
  it('rejects recipient injection, malformed addresses and message IDs',()=>{
    expect(safeMailAddress('client@example.com\r\nBcc: victim@example.com')).toBeNull();
    expect(safeMailAddress('client@example.com')).toBe('client@example.com');
    expect(safeMessageId('<valid@example.com>')).toBe('<valid@example.com>');
    expect(safeMessageId('<bad>\r\nBcc:x')).toBeUndefined();
    expect(cleanMailHeader('A\r\nB\0C')).toBe('A  B C');
  });
  it('limits reply bodies and rejects client-controlled recipient or actor fields',()=>{
    expect(mailboxReplySchema.safeParse({id,messageId:id,body:'Hello',to:'other@example.com'}).success).toBe(false);
    expect(mailboxReplySchema.safeParse({id,messageId:id,body:' '.repeat(50)}).success).toBe(false);
    expect(mailboxReplySchema.safeParse({id,messageId:id,body:'x'.repeat(20001)}).success).toBe(false);
  });
});
