import type { CrmConnector, CrmLead } from "./types";

// GoHighLevel (LeadConnector) v2 connector. OAuth lives in
// /api/connectors/gohighlevel/*; token storage + refresh in ./index.ts.
// Every request carries the API Version header and is scoped to a locationId.
const API = "https://services.leadconnectorhq.com";
const VERSION = "2021-07-28";

interface GhlContact {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  companyName?: string | null;
}

export class GoHighLevelConnector implements CrmConnector {
  provider = "gohighlevel";
  constructor(private accessToken: string, private locationId: string) {}

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      Version: VERSION,
      "Content-Type": "application/json",
      Accept: "application/json",
    };
  }

  async pullLeads(opts: { since?: Date; cursor?: string } = {}): Promise<{ leads: CrmLead[]; nextCursor?: string }> {
    // The cursor is the opaque nextPageUrl returned by GHL; otherwise build page 1.
    let url: string;
    if (opts.cursor && opts.cursor.startsWith("http")) {
      url = opts.cursor;
    } else {
      const u = new URL(`${API}/contacts/`);
      u.searchParams.set("locationId", this.locationId);
      u.searchParams.set("limit", "100");
      url = u.toString();
    }

    const res = await fetch(url, { headers: this.headers() });
    if (!res.ok) throw new Error(`GoHighLevel pullLeads failed (${res.status}): ${await res.text()}`);
    const json = (await res.json()) as { contacts?: GhlContact[]; meta?: { nextPageUrl?: string } };

    const leads: CrmLead[] = (json.contacts ?? []).map(mapGhlContact);
    return { leads, nextCursor: json.meta?.nextPageUrl ?? undefined };
  }

  async writeActivity(crmId: string, activity: { type: string; body: string; at: Date }): Promise<void> {
    const res = await fetch(`${API}/contacts/${crmId}/notes`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ body: `[${activity.type}] ${activity.body}` }),
    });
    if (!res.ok) throw new Error(`GoHighLevel writeActivity failed (${res.status}): ${await res.text()}`);
  }

  async updateStatus(crmId: string, status: string): Promise<void> {
    // GHL is tag-centric — surface status as a tag on the contact.
    const res = await fetch(`${API}/contacts/${crmId}/tags`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ tags: [`lazarus:${status}`] }),
    });
    if (!res.ok) throw new Error(`GoHighLevel updateStatus failed (${res.status}): ${await res.text()}`);
  }
}

/** Pure mapping of a GHL contact payload to our CrmLead (exported for tests). */
export function mapGhlContact(c: GhlContact): CrmLead {
  return {
    crmId: c.id,
    firstName: c.firstName ?? undefined,
    lastName: c.lastName ?? undefined,
    email: c.email ?? undefined,
    phone: c.phone ?? undefined,
    company: c.companyName ?? undefined,
  };
}
