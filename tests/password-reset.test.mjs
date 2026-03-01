import test, { before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'fs';
import { join } from 'path';

const nextServerPath = join(process.cwd(), 'node_modules', 'next', 'server');
const libMongoPath = join(process.cwd(), 'Lib', 'mongodb');
const userModelPath = join(process.cwd(), 'models', 'user');
const sendEmailPath = join(process.cwd(), 'utils', 'sendEmail');

before(async () => {
  const links = [
    [nextServerPath, 'server.js'],
    [libMongoPath, 'mongodb.js'],
    [userModelPath, 'user.js'],
    [sendEmailPath, 'sendEmail.js'],
  ];
  for (const [link, target] of links) {
    try {
      await fs.lstat(link);
    } catch {
      await fs.symlink(target, link);
    }
  }
});

after(async () => {
  for (const p of [nextServerPath, libMongoPath, userModelPath, sendEmailPath]) {
    try {
      const stat = await fs.lstat(p);
      if (stat.isSymbolicLink()) {
        await fs.unlink(p);
      }
    } catch {
      // ignore
    }
  }
});

function jsonResponse(body, init = {}) {
  return new Response(JSON.stringify(body), { headers: { 'content-type': 'application/json' }, ...init });
}

const NEXT_RESPONSE_MOCK = { NextResponse: { json: jsonResponse } };

function setupForgotPasswordMocks({ userExists = true, throwDbError = false } = {}) {
  const sendEmailMock = mock.fn(async () => ({ success: true }));
  const saveMock = mock.fn(async () => {});
  const user = userExists ? { email: 'user@example.com', firstName: 'User', save: saveMock } : null;
  const findOneMock = throwDbError
    ? mock.fn(async () => { throw new Error('DB Error'); })
    : mock.fn(async () => user);
  const connectDBMock = mock.fn(async () => {});

  const restoreUser = mock.module('../models/user', { cache: false, defaultExport: { findOne: findOneMock } });
  const restoreEmail = mock.module('../utils/sendEmail', { cache: false, namedExports: { sendEmail: sendEmailMock } });
  const restoreDB = mock.module('../Lib/mongodb', { cache: false, defaultExport: connectDBMock });
  const restoreNext = mock.module('next/server', { cache: false, namedExports: NEXT_RESPONSE_MOCK });

  return {
    sendEmailMock,
    findOneMock,
    saveMock,
    connectDBMock,
    restoreAll: () => {
      restoreUser.restore();
      restoreEmail.restore();
      restoreDB.restore();
      restoreNext.restore();
    },
  };
}

function setupResetPasswordMocks({ validToken = true, throwDbError = false } = {}) {
  const sendEmailMock = mock.fn(); // not used but kept for symmetry
  const connectDBMock = mock.fn(async () => {});
  const saveMock = mock.fn(async () => {});
  const user = validToken ? { password: 'old', save: saveMock } : null;
  const selectMock = mock.fn(async () => user);
  const findOneMock = throwDbError
    ? mock.fn(() => { throw new Error('DB Error'); })
    : mock.fn(() => ({ select: selectMock }));

  const restoreUser = mock.module('../models/user', { cache: false, defaultExport: { findOne: findOneMock } });
  const restoreDB = mock.module('../Lib/mongodb', { cache: false, defaultExport: connectDBMock });
  const restoreNext = mock.module('next/server', { cache: false, namedExports: NEXT_RESPONSE_MOCK });

  return {
    findOneMock,
    selectMock,
    saveMock,
    connectDBMock,
    restoreAll: () => {
      restoreUser.restore();
      restoreDB.restore();
      restoreNext.restore();
    },
  };
}

// Forgot Password tests
test('forgot-password sends email when user exists', { concurrency: false }, async (t) => {
  const mocks = setupForgotPasswordMocks();
  t.after(mocks.restoreAll);
  const { POST } = await import(`../app/api/auth/forgot-password/route.js?${Date.now()}`);
  const req = { json: async () => ({ email: 'user@example.com' }) };
  const res = await POST(req);
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.ok(data.message.includes('password reset link'));
  assert.strictEqual(mocks.findOneMock.mock.callCount(), 1);
  assert.strictEqual(mocks.sendEmailMock.mock.callCount(), 1);
  assert.strictEqual(mocks.saveMock.mock.callCount(), 1);
});

test('forgot-password handles missing user gracefully', { concurrency: false }, async (t) => {
  const mocks = setupForgotPasswordMocks({ userExists: false });
  t.after(mocks.restoreAll);
  const { POST } = await import(`../app/api/auth/forgot-password/route.js?${Date.now()}`);
  const req = { json: async () => ({ email: 'missing@example.com' }) };
  const res = await POST(req);
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.ok(data.message.includes('password reset link'));
  assert.strictEqual(mocks.findOneMock.mock.callCount(), 1);
  assert.strictEqual(mocks.sendEmailMock.mock.callCount(), 0);
});

test('forgot-password returns 500 on database error', { concurrency: false }, async (t) => {
  const mocks = setupForgotPasswordMocks({ throwDbError: true });
  t.after(mocks.restoreAll);
  const { POST } = await import(`../app/api/auth/forgot-password/route.js?${Date.now()}`);
  const req = { json: async () => ({ email: 'error@example.com' }) };
  const res = await POST(req);
  const data = await res.json();
  assert.strictEqual(res.status, 500);
  assert.ok(data.message.includes('internal server error'));
});

// Reset Password tests

test('reset-password updates password with valid token', { concurrency: false }, async (t) => {
  const mocks = setupResetPasswordMocks();
  t.after(mocks.restoreAll);
  const { POST } = await import(`../app/api/auth/reset-password/route.js?${Date.now()}`);
  const req = { json: async () => ({ token: 'valid', password: 'newpass' }) };
  const res = await POST(req);
  const data = await res.json();
  assert.strictEqual(res.status, 200);
  assert.ok(data.message.includes('Password reset successful'));
  assert.strictEqual(mocks.findOneMock.mock.callCount(), 1);
  assert.strictEqual(mocks.selectMock.mock.callCount(), 1);
  assert.strictEqual(mocks.saveMock.mock.callCount(), 1);
});

test('reset-password rejects missing parameters', { concurrency: false }, async (t) => {
  const mocks = setupResetPasswordMocks();
  t.after(mocks.restoreAll);
  const { POST } = await import(`../app/api/auth/reset-password/route.js?${Date.now()}`);
  const req = { json: async () => ({ token: '', password: '' }) };
  const res = await POST(req);
  const data = await res.json();
  assert.strictEqual(res.status, 400);
  assert.ok(data.message.includes('Invalid request'));
  assert.strictEqual(mocks.findOneMock.mock.callCount(), 0);
});

test('reset-password rejects invalid token', { concurrency: false }, async (t) => {
  const mocks = setupResetPasswordMocks({ validToken: false });
  t.after(mocks.restoreAll);
  const { POST } = await import(`../app/api/auth/reset-password/route.js?${Date.now()}`);
  const req = { json: async () => ({ token: 'bad', password: 'newpass' }) };
  const res = await POST(req);
  const data = await res.json();
  assert.strictEqual(res.status, 400);
  assert.ok(data.message.includes('Invalid or expired'));
  assert.strictEqual(mocks.findOneMock.mock.callCount(), 1);
});

test('reset-password returns 500 on database error', { concurrency: false }, async (t) => {
  const mocks = setupResetPasswordMocks({ throwDbError: true });
  t.after(mocks.restoreAll);
  const { POST } = await import(`../app/api/auth/reset-password/route.js?${Date.now()}`);
  const req = { json: async () => ({ token: 'err', password: 'newpass' }) };
  const res = await POST(req);
  const data = await res.json();
  assert.strictEqual(res.status, 500);
  assert.ok(data.message.includes('internal server error'));
});
