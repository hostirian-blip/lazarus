import type { CrmConnector, CrmLead } from "./types";

// HubSpot CRM v3 connector (BUILD_PLAN step 3). OAuth lives in
// /api/connectors/hubspot/*; token storage + refresh in ./index.ts + ./hubspot-oauth.ts.
const API = "https://api.hubapi.com";
const CONTACT_PROPS = ["firstname", "lastname", "email", "phone", "company"];

interface HubSpotContact {
  id: string;
  properties: Record<string, string | null>;
}

export class HubSpotConnector implements CrmConnector {
  provider = "hubspot";
  constructor(private accessToken: string) {}

  private headers(): Record<string, string> {
    return { Authorization: `Bearer ${this.accessToken}`, "Content-Type": "application/json" };
  }

  async pullLeads(opts: { since?: Date; cursor?: string } = {}): Promise<{ leads: CrmLead[]; nextCursor?: string }> {
    const u = new URL(`${API}/crm/v3/objects/contacts`);
    u.searchParams.set("limit", "100");
    u.searchParams.set("properties", CONTACT_PROPS.join(","));
    if (opts.cursor) u.searchParams.set("after", opts.cursor);

    const res = await fetch(u, { headers: this.headers() });
    if (!res.ok) throw new Error(`HubSpot pullLeads failed (${res.status}): ${await res.text()}`);
    const json = (await res.json()) as { results: HubSpotContact[]; paging?: { next?: { after: string } } };

    const leads: CrmLead[] = json.results.map((c) => ({
      crmId: c.id,
      firstName: c.properties.firstname ?? undefined,
      lastName: c.properties.lastname ?? undefined,
      email: c.properties.email ?? undefined,
      phone: c.properties.phone ?? undefined,
      company: c.properties.company ?? undefined,
    }));
    return { leads, nextCursor: json.paging?.next?.after };
  }

  async writeActivity(crmId: string, activity: { type: string; body: string; at: Date }): Promise<void> {
    // Create a Note engagement associated to the contact (assoc type 202 = note→contact).
    const res = await fetch(`${API}/crm/v3/objects/notes`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        properties: { hs_timestamp: activity.at.toISOString(), hs_note_body: `[${activity.type}] ${activity.body}` },
        associations: [
          { to: { id: crmId }, types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 202 }] },
        ],
      }),
    });
    if (!res.ok) throw new Error(`HubSpot writeActivity failed (${res.status}): ${await res.text()}`);
  }

  async updateStatus(crmId: string, status: string): Promise<void> {
    // Writes the standard lead-status property; a tenant may remap to a custom field.
    const res = await fetch(`${API}/crm/v3/objects/contacts/${crmId}`, {
      method: "PATCH",
      headers: this.headers(),
      body: JSON.stringify({ properties: { hs_lead_status: status } }),
    });
    if (!res.ok) throw new Error(`HubSpot updateStatus failed (${res.status}): ${await res.text()}`);
  }
}

/** Pure mapping of a HubSpot contact payload to our CrmLead (exported for tests). */
export function mapHubSpotContact(c: HubSpotContact): CrmLead {
  return {
    crmId: c.id,
    firstName: c.properties.firstname ?? undefined,
    lastName: c.properties.lastname ?? undefined,
    email: c.properties.email ?? undefined,
    phone: c.properties.phone ?? undefined,
    company: c.properties.company ?? undefined,
  };
}
