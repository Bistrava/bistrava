import { beforeEach, expect, it, vi } from 'vitest';
const mocks=vi.hoisted(()=>({access:vi.fn(),client:vi.fn(),rpc:vi.fn(),revalidate:vi.fn()}));
vi.mock('server-only',()=>({}));
vi.mock('next/cache',()=>({revalidatePath:mocks.revalidate}));
vi.mock('@/lib/auth/admin',()=>({getAdminAccess:mocks.access}));
vi.mock('@/lib/supabase/server',()=>({createClient:mocks.client}));
vi.mock('@/lib/email/send',()=>({sendOrderConfirmation:vi.fn(),sendOrderStatusEmail:vi.fn()}));
import { setOrderTrash } from './admin-orders';
const idle={status:'idle' as const,message:''};
function form() {
  const result=new FormData();
  Object.entries({adminLocale:'fr',orderId:'20000000-0000-4000-8000-000000000001',expectedUpdatedAt:'2026-10-28T00:00:00Z',deleted:'yes',confirmed:'on'}).forEach(([k,v])=>result.set(k,v));
  return result;
}
beforeEach(()=>{vi.resetAllMocks();mocks.access.mockResolvedValue({status:'authorized',role:'admin'});mocks.client.mockResolvedValue({rpc:mocks.rpc});mocks.rpc.mockResolvedValue({error:null});});
it.each(['editor','unauthenticated'])('rejects %s without a write',async role=>{
  mocks.access.mockResolvedValue(role==='editor'?{status:'authorized',role}:{status:role});
  expect((await setOrderTrash(idle,form())).status).toBe('error'); expect(mocks.rpc).not.toHaveBeenCalled();
});
it('requires explicit confirmation and passes the concurrency version to the database',async()=>{
  const data=form(); data.delete('confirmed');
  expect((await setOrderTrash(idle,data)).status).toBe('error'); expect(mocks.rpc).not.toHaveBeenCalled();
  expect((await setOrderTrash(idle,form())).status).toBe('success');
  expect(mocks.rpc).toHaveBeenCalledWith('admin_set_order_deleted',expect.objectContaining({input_deleted:true,input_expected_updated_at:'2026-10-28T00:00:00Z'}));
});
it('reports concurrent modification instead of claiming deletion',async()=>{
  mocks.rpc.mockResolvedValue({error:{message:'order_conflict'}});
  expect((await setOrderTrash(idle,form())).status).toBe('error'); expect(mocks.revalidate).not.toHaveBeenCalled();
});
