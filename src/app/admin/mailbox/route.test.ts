import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ access: vi.fn(), client: vi.fn(), configured: vi.fn(), sync: vi.fn(), verify: vi.fn(), send: vi.fn() }));
vi.mock('@/lib/auth/admin', () => ({ getAdminAccess: mocks.access }));
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.client }));
vi.mock('@/lib/email/mailbox', () => ({
  mailboxAddress: 'kontakt@bistrava.com', mailboxConfigured: mocks.configured,
  syncMailbox: mocks.sync, verifyMailboxSmtp: mocks.verify, sendMailboxReply: mocks.send,
}));

import { POST } from './route';

function request(origin: string | null, body: unknown = { action: 'sync' }, url = 'http://0.0.0.0:10000/admin/mailbox', forwardedHost = 'bistrava.com') {
  const headers = new Headers({
    'Content-Type': 'application/json', Host: forwardedHost,
    'X-Forwarded-Host': forwardedHost, 'X-Forwarded-Proto': 'https',
  });
  if (origin !== null) headers.set('Origin', origin);
  return new Request(url, { method: 'POST', headers, body: JSON.stringify(body) });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://bistrava.com');
  mocks.access.mockResolvedValue({ status: 'authorized', userId: 'trusted-staff', role: 'admin' });
  mocks.configured.mockReturnValue(true);
  mocks.sync.mockResolvedValue({ ok: true });
  mocks.verify.mockResolvedValue({ ok: true });
  mocks.send.mockResolvedValue({ ok: true });
});
afterEach(() => vi.unstubAllEnvs());

describe('mailbox configured-origin protection behind a reverse proxy', () => {
  it('accepts the public origin when the Node request URL contains the internal bind address', async () => {
    const response = await POST(request('https://bistrava.com'));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
    expect(mocks.access).toHaveBeenCalledOnce();
    expect(mocks.sync).toHaveBeenCalledOnce();
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it.each(['https://attacker.invalid', 'http://bistrava.com', 'https://bistrava.com:444', 'https://www.bistrava.com', 'null', '', null])('rejects foreign or missing origin %s before authorization or mail work', async origin => {
    const response = await POST(request(origin));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'origin' });
    expect(mocks.access).not.toHaveBeenCalled();
    expect(mocks.sync).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
    expect(mocks.verify).not.toHaveBeenCalled();
  });

  it('does not treat matching Host, forwarded Host or request URL as a trusted origin', async () => {
    const response = await POST(request('https://attacker.invalid', { action: 'sync' }, 'https://attacker.invalid/admin/mailbox', 'attacker.invalid'));
    expect(response.status).toBe(403);
    expect(mocks.access).not.toHaveBeenCalled();
    expect(mocks.sync).not.toHaveBeenCalled();
  });

  it('requires previews to configure their exact public origin', async () => {
    const preview = 'https://bistrava-preview.onrender.com';
    expect((await POST(request(preview, undefined, `${preview}/admin/mailbox`, 'bistrava-preview.onrender.com'))).status).toBe(403);
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', preview);
    expect((await POST(request(preview))).status).toBe(200);
    expect((await POST(request('https://bistrava.com'))).status).toBe(403);
    expect(mocks.sync).toHaveBeenCalledOnce();
  });

  it('accepts localhost development only when its origin is explicitly configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'http://localhost:3000');
    expect((await POST(request('http://localhost:3000'))).status).toBe(200);
    expect((await POST(request('http://localhost:3001'))).status).toBe(403);
  });

  it('uses the canonical fallback instead of trusting the request when the site URL is unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', undefined);
    expect((await POST(request('https://bistrava.com'))).status).toBe(200);
    expect((await POST(request('http://localhost:3000'))).status).toBe(403);
  });

  it.each(['not a URL', 'file:///tmp/app', 'javascript:alert(1)'])('fails closed for invalid configured origin %s', async siteUrl => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', siteUrl);
    expect((await POST(request('https://bistrava.com'))).status).toBe(403);
    expect(mocks.access).not.toHaveBeenCalled();
  });

  it.each(['unauthenticated', 'forbidden'])('still rejects %s staff for a trusted origin', async status => {
    mocks.access.mockResolvedValue({ status });
    expect((await POST(request('https://bistrava.com'))).status).toBe(status === 'forbidden' ? 403 : 401);
    expect(mocks.sync).not.toHaveBeenCalled();
    expect(mocks.verify).not.toHaveBeenCalled();
    expect(mocks.send).not.toHaveBeenCalled();
  });

  it('preserves verification and authenticated reply dispatch without performing a send in the test', async () => {
    expect((await POST(request('https://bistrava.com', { action: 'verify' }))).status).toBe(200);
    expect(mocks.verify).toHaveBeenCalledOnce();
    expect(mocks.send).not.toHaveBeenCalled();
    const reply = { id: 'reply-test', messageId: 'message-test', body: 'Local test only' };
    expect((await POST(request('https://bistrava.com', { action: 'reply', reply, actorId: 'untrusted' }))).status).toBe(200);
    expect(mocks.send).toHaveBeenCalledWith(reply, 'trusted-staff');
  });
});
