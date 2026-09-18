import { decideGuestPluginTest } from "./guest-test-engine.js";

export function createKentGuestTest({ session, policy } = {}) {
  const decision = decideGuestPluginTest({
    session,
    policy,
    context: { type: "guest_test" }
  });
  if (!decision.allowed) return decision;

  return {
    allowed: true,
    agent: "kent",
    context: "guest_test",
    plugin_id: decision.plugin_id,
    execution_mode: decision.execution_mode,
    message: "Kent kör plugin-testet i en isolerad gästscession."
  };
}
