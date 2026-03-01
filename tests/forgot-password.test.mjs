import test from 'node:test';
import assert from 'node:assert/strict';

// Use module mocks for dependencies

const MOCK_USER = {
  email: 'user@example.com',
  firstName: 'User',
  save: async () => {},
};

// Helper to get POST after applying mocks
async function getRoute(t, sendEmailImpl, findOneImpl = async () => MOCK_USER) {
  const routePath = new URL('../app/api/auth/forgot-password/route.js', import.meta.url);
  await t.mock.module('next/server.js', {
    namedExports: {
      NextResponse: class extends Response {
        static json(body, init = {}) {
          const headers = new Headers(init.headers || {});
          if (!headers.has('content-type')) {
            headers.set('content-type', 'application/json');
          }
          return new Response(JSON.stringify(body), { ...init, headers });
        }
      },
    },
  });
  await t.mock.module(new URL('../utils/sendEmail.js', import.meta.url), {
    namedExports: { sendEmail: sendEmailImpl },
  });
  await t.mock.module(new URL('../Lib/mongodb.js', import.meta.url), { defaultExport: async () => {} });
  await t.mock.module(new URL('../models/user.js', import.meta.url), {
    defaultExport: { findOne: findOneImpl },
  });
  const mod = await import(`${routePath}?cacheBust=${Math.random()}`);
  return mod.POST;
}

test('forgot-password returns 200 when email sends successfully', async (t) => {
  const POST = await getRoute(t, async () => ({ success: true }));
  const req = { json: async () => ({ email: MOCK_USER.email }) };
  const res = await POST(req);
  assert.strictEqual(res.status, 200);
});

test('forgot-password returns 500 when email send fails', async (t) => {
  const POST = await getRoute(t, async () => ({ success: false, error: 'fail' }));
  const req = { json: async () => ({ email: MOCK_USER.email }) };
  const res = await POST(req);
  assert.strictEqual(res.status, 500);
});
