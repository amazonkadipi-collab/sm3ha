import { describe, expect, it } from "vitest";

describe("Supabase connection", () => {
  it("can read one catalog row with the server key when configured", async () => {
    const baseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!baseUrl || !serviceRoleKey) return;

    const response = await fetch(`${baseUrl}/rest/v1/songs?select=id&limit=1`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    expect(response.ok).toBe(true);
    const body = await response.json();
    expect(Array.isArray(body)).toBe(true);
  }, 15000);
});
