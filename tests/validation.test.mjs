import test from 'node:test';
import assert from 'node:assert/strict';
import { validateEmail, validateRequiredFields } from '../utils/validation.js';

test('validateEmail accepts valid addresses', () => {
  assert.ok(validateEmail('test@example.com'));
  assert.ok(validateEmail('user.name+tag@domain.co'));
});

test('validateEmail rejects invalid addresses', () => {
  assert.strictEqual(validateEmail('plainaddress'), false);
  assert.strictEqual(validateEmail('user@localhost'), false);
  assert.strictEqual(validateEmail('user@'), false);
});

test('validateRequiredFields returns true when all fields are non-empty', () => {
  const fields = { email: 'user@example.com', name: 'User', extra: 'info' };
  assert.strictEqual(validateRequiredFields(fields), true);

  const fieldsWithNumbers = { count: 0, enabled: false };
  assert.strictEqual(validateRequiredFields(fieldsWithNumbers), true);
});

test('validateRequiredFields returns false when any field is empty', () => {
  const fields = { email: 'user@example.com', name: '', extra: 'info' };
  assert.strictEqual(validateRequiredFields(fields), false);

  const fieldsWithSpaces = { one: 'value', two: '   ' };
  assert.strictEqual(validateRequiredFields(fieldsWithSpaces), false);

  const fieldsWithNull = { name: 'User', meta: null };
  assert.strictEqual(validateRequiredFields(fieldsWithNull), false);

  const fieldsWithEmptyArray = { name: 'User', tags: [] };
  assert.strictEqual(validateRequiredFields(fieldsWithEmptyArray), false);
});
