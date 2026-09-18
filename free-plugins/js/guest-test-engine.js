const ACTIVE = "active";
const GUEST = "guest_test";

export function decideGuestPluginTest({ session, policy, context } = {}) {
  if (!session || !policy || !context) return { allowed: false, reason: "invalid_input" };
  if (context.type !== GUEST) return { allowed: false, reason: "invalid_context" };
  if (Object.prototype.hasOwnProperty.call(context, "privateCredential")) {
    return { allowed: false, reason: "private_credential_forbidden" };
  }
  if (session.status !== ACTIVE) return { allowed: false, reason: "session_inactive" };
  if (!Number.isFinite(session.expires_at) || session.expires_at <= Date.now()) {
    return { allowed: false, reason: "session_expired" };
  }
  if (policy.guest_test_enabled !== true) return { allowed: false, reason: "guest_test_disabled" };
  if (!policy.plugin_id || !policy.execution_mode) return { allowed: false, reason: "invalid_policy" };

  return {
    allowed: true,
    plugin_id: policy.plugin_id,
    execution_mode: policy.execution_mode,
    scope: GUEST
  };
}
