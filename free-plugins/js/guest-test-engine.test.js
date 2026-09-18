import { decideGuestPluginTest } from "./guest-test-engine.js";

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

export function runGuestTestEngineTests() {
  const base = {
    session: { id: "g1", status: "active", expires_at: Date.now() + 60000 },
    policy: { plugin_id: "p1", guest_test_enabled: true, execution_mode: "sandbox" },
    context: { type: "guest_test" }
  };

  const allowed = decideGuestPluginTest(base);
  assert(allowed.allowed === true, "active guest + enabled plugin should be allowed");

  assert(decideGuestPluginTest({ ...base, session: { ...base.session, status: "revoked" } }).allowed === false, "revoked guest session must be denied");
  assert(decideGuestPluginTest({ ...base, session: { ...base.session, expires_at: Date.now() - 1 } }).allowed === false, "expired guest session must be denied");
  assert(decideGuestPluginTest({ ...base, policy: { ...base.policy, guest_test_enabled: false } }).allowed === false, "disabled guest test must be denied");
  assert(decideGuestPluginTest({ ...base, policy: null }).allowed === false, "unknown policy must be denied");
  assert(decideGuestPluginTest({ ...base, context: { type: "private_user" } }).allowed === false, "private context must not enter guest test boundary");
  assert(decideGuestPluginTest({ ...base, context: { type: "guest_test", privateCredential: "secret" } }).allowed === false, "private credentials must never be accepted");
  return true;
}
