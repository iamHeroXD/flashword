import test from "node:test";
import assert from "node:assert/strict";
import {
  validateUsername,
  validatePassword,
  generateRecoveryCode,
  createSessionToken,
  verifySessionToken,
} from "../src/lib/auth";

test("validateUsername enforces length and permitted characters", () => {
  assert.equal(validateUsername("ro").valid, false, "Too short");
  assert.equal(validateUsername("valid_user-123").valid, true, "Valid alphanumeric");
  assert.equal(validateUsername("user@bad").valid, false, "Disallow @ symbol");
  assert.equal(validateUsername("user with spaces").valid, false, "Disallow spaces");
});

test("validatePassword enforces minimum length", () => {
  assert.equal(validatePassword("12345").valid, false, "Too short");
  assert.equal(validatePassword("secret123").valid, true, "Valid password");
});

test("generateRecoveryCode formats standard FLASH-XXXX-XXXX-XXXX key", () => {
  const code = generateRecoveryCode();
  assert.match(code, /^FLASH-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}$/);
});

test("createSessionToken and verifySessionToken handle cryptographic signing", () => {
  const userId = "usr_test123";
  const token = createSessionToken(userId);
  assert.ok(token.includes("."), "Token should contain dot separator");

  const verifiedId = verifySessionToken(token);
  assert.equal(verifiedId, userId, "Verified ID must match original");

  // Tampered token test
  const tampered = token.slice(0, -4) + "XXXX";
  assert.equal(verifySessionToken(tampered), null, "Tampered token must fail verification");
});
